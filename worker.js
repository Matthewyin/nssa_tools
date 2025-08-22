// Module-scoped cache survives across requests within the same isolate
const TOKEN_CACHE = new Map();

// Import server cron modules
import { ServerCronManager } from './cron/server-cron.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Allow health check quickly
    if (url.pathname === "/_health") {
      return new Response("ok", { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    // Handle cron API requests
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    // Serve firebase config to frontend without exposing secrets
    if (url.pathname === "/firebase-config.js") {
      const config = {
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
      };
      const body = `window.__FIREBASE_CONFIG__ = ${JSON.stringify(config)};`;
      return new Response(body, { status: 200, headers: { "content-type": "application/javascript; charset=utf-8" } });
    }

    // Login/logout endpoints (frontend will handle UI).
    if (url.pathname === "/auth/session" && request.method === "POST") {
      try {
        const { idToken, redirect } = await request.json();
        const valid = await verifyIdToken(env, idToken);
        if (!valid) return new Response("Unauthorized", { status: 401 });
        const cookieName = env.SESSION_COOKIE_NAME || "nssatools_session";
        const maxAge = Number(env.SESSION_MAX_AGE || 604800);
        const headers = new Headers({ "content-type": "application/json" });
        headers.append(
          "Set-Cookie",
          `${cookieName}=${idToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
        );
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
      } catch (e) {
        return new Response("Bad Request", { status: 400 });
      }
    }
    if (url.pathname === "/auth/logout") {
      const cookieName = env.SESSION_COOKIE_NAME || "nssatools_session";
      const headers = new Headers({ Location: "/" });
      headers.append("Set-Cookie", `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
      return new Response(null, { status: 302, headers });
    }

    // Determine if request path should bypass auth
    const bypass = (env.AUTH_BYPASS || "").split(",").map(p => p.trim()).filter(Boolean);
    const isBypass = bypass.some(prefix => url.pathname === prefix || url.pathname.startsWith(prefix + "/"));

    // Simple cookie-based gate with token validation
    const cookieName = env.SESSION_COOKIE_NAME || "nssatools_session";
    const rawCookie = request.headers.get("Cookie") || "";
    const cookies = {};
    for (const part of rawCookie.split(";")) {
      const p = part.trim();
      if (!p) continue;
      const eq = p.indexOf("=");
      const k = eq >= 0 ? p.slice(0, eq) : p;
      const v = eq >= 0 ? p.slice(eq + 1) : "";
      if (k) cookies[k] = v;
    }
    const session = cookies[cookieName];

    // If not bypass and no session, redirect to login
    if (!isBypass && !session) {
      const homeUrl = new URL("/", url.origin);
      homeUrl.searchParams.set("redirect", url.pathname + url.search);
      return Response.redirect(homeUrl.toString(), 302);
    }

    // If session present, verify token (with cache)
    if (!isBypass && session) {
      const valid = await verifyIdToken(env, session);
      if (!valid) {
        const homeUrl = new URL("/", url.origin);
        homeUrl.searchParams.set("redirect", url.pathname + url.search);
        return Response.redirect(homeUrl.toString(), 302);
      }
    }

    // Serve static assets from repository root
    // Blocklist: do not expose sensitive files or heavy folders
    const sensitivePatterns = [
      /(^|\/)wrangler\.toml(\.bak)?$/i,
      /(^|\/)wrangler\.json$/i,
      /(^|\/)package(-lock)?\.json$/i,
      /(^|\.)env(\..*)?$/i,
      /(^|\/)node_modules(\/|$)/i,
      /(^|\/)\.git(\/|$)/,
      /(^|\/)\.DS_Store$/,
      /(^|\/)\.vscode(\/|$)/,
      /(^|\/)\.idea(\/|$)/,
      /(^|\/)\w+\.sample$/i,
      /(^|\/)\w+\.bak$/i,
      /(^|\/)firebase\-admin\.\w+$/i,
      /(^|\/)service\-account.*\.json$/i,
      /(^|\/)worker\.js$/i,
    ];

    // hard drop large dependency directories irrespective of assets.include
    if (url.pathname.includes('/node_modules/')) {
      return new Response("Not Found", { status: 404 });
    }

    for (const pattern of sensitivePatterns) {
      if (pattern.test(url.pathname)) {
        return new Response("Not Found", { status: 404 });
      }
    }

    // Directory index fallback
    const tryPaths = [];
    if (url.pathname.endsWith("/")) {
      tryPaths.push(url.pathname + "index.html");
    } else {
      tryPaths.push(url.pathname);
      tryPaths.push(url.pathname + "/index.html");
    }

    for (const p of tryPaths) {
      const req = new Request(new URL(p, url.origin), request);
      const resp = await env.ASSETS.fetch(req);
      if (resp.status !== 404) {
        return resp;
      }
    }

    return new Response("Not Found", { status: 404 });
  },

  // Handle scheduled cron events
  async scheduled(event, env, ctx) {
    const cronManager = new ServerCronManager(env);
    
    try {
      console.log('Starting scheduled cron job execution...');
      
      // Get due tasks and execute them
      const dueTasks = await getDueTasks(env);
      
      if (dueTasks.length === 0) {
        console.log('No due tasks found');
        return;
      }

      console.log(`Found ${dueTasks.length} due tasks`);
      
      // Execute tasks with concurrency limit
      const concurrencyLimit = 10;
      const chunks = [];
      
      for (let i = 0; i < dueTasks.length; i += concurrencyLimit) {
        chunks.push(dueTasks.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(task => cronManager.executeTask(task)));
      }

      console.log('Cron job execution completed');
      
    } catch (error) {
      console.error('Cron job execution failed:', error);
    }
  }
};

// Handle API requests
async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const user = await authenticateUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const cronManager = new ServerCronManager(env);

    // Route handling
    if (path === '/api/tasks' && request.method === 'GET') {
      const tasks = await cronManager.getUserTasks(user.email);
      return new Response(JSON.stringify({ tasks }), { headers: corsHeaders });
    } else if (path === '/api/tasks' && request.method === 'POST') {
      const taskData = await request.json();
      const task = await cronManager.createTask(user.email, taskData);
      return new Response(JSON.stringify({ task }), { 
        status: 201,
        headers: corsHeaders 
      });
    } else if (path.startsWith('/api/tasks/') && request.method === 'GET') {
      const taskId = path.split('/').pop();
      const task = await cronManager.getTask(taskId);
      if (!task || task.userId !== user.email) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }
      return new Response(JSON.stringify({ task }), { headers: corsHeaders });
    } else if (path.startsWith('/api/tasks/') && request.method === 'PUT') {
      const taskId = path.split('/').pop();
      const updates = await request.json();
      const task = await cronManager.getTask(taskId);
      if (!task || task.userId !== user.email) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }
      const updatedTask = await cronManager.updateTask(taskId, updates);
      return new Response(JSON.stringify({ task: updatedTask }), { headers: corsHeaders });
    } else if (path.startsWith('/api/tasks/') && request.method === 'DELETE') {
      const taskId = path.split('/').pop();
      const task = await cronManager.getTask(taskId);
      if (!task || task.userId !== user.email) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }
      await cronManager.deleteTask(taskId);
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } else if (path.startsWith('/api/tasks/') && request.method === 'POST') {
      const taskId = path.split('/').pop();
      const action = url.searchParams.get('action');
      const task = await cronManager.getTask(taskId);
      if (!task || task.userId !== user.email) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }
      
      if (action === 'pause') {
        const updatedTask = await cronManager.pauseTask(taskId);
        return new Response(JSON.stringify({ task: updatedTask }), { headers: corsHeaders });
      } else if (action === 'resume') {
        const updatedTask = await cronManager.resumeTask(taskId);
        return new Response(JSON.stringify({ task: updatedTask }), { headers: corsHeaders });
      } else if (action === 'trigger') {
        const result = await cronManager.triggerTask(taskId);
        return new Response(JSON.stringify({ 
          success: result.success, 
          error: result.error 
        }), { headers: corsHeaders });
      }
    } else if (path.startsWith('/api/tasks/') && path.endsWith('/logs')) {
      const taskId = path.split('/')[3];
      const task = await cronManager.getTask(taskId);
      if (!task || task.userId !== user.email) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const logs = await cronManager.getTaskLogs(taskId, limit);
      return new Response(JSON.stringify({ logs }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Get due tasks for execution
async function getDueTasks(env) {
  const cronManager = new ServerCronManager(env);
  const now = Date.now();
  const dueTasks = [];

  // Note: This is a simplified implementation
  // In production, you should use a more efficient method
  // such as maintaining an index of due tasks
  
  return dueTasks;
}

// Authenticate user from request
async function authenticateUser(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const valid = await verifyIdToken(env, token);
    
    if (!valid) {
      return null;
    }

    // Get user info from token
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.users?.[0] || null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

async function verifyIdToken(env, idToken) {
  if (!idToken) return false;
  const cacheKey = `t:${idToken.slice(0, 25)}`;
  const cached = TOKEN_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expires > now) return true;

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (resp.ok) {
      // cache for 5 minutes
      TOKEN_CACHE.set(cacheKey, { ok: true, expires: now + 5 * 60 * 1000 });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
