export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // simple in-memory cache for token validations within isolate lifetime
    env.__TOKEN_CACHE__ ||= new Map();

    // Allow health check quickly
    if (url.pathname === "/_health") {
      return new Response("ok", { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
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
      const headers = new Headers({ Location: "/auth/login" });
      headers.append("Set-Cookie", `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
      return new Response(null, { status: 302, headers });
    }

    // Determine if request path should bypass auth
    const bypass = (env.AUTH_BYPASS || "").split(",").map(p => p.trim()).filter(Boolean);
    const isBypass = bypass.some(prefix => url.pathname === prefix || url.pathname.startsWith(prefix + "/"));

    // Simple cookie-based gate with token validation
    const cookieName = env.SESSION_COOKIE_NAME || "nssatools_session";
    const cookies = Object.fromEntries((request.headers.get("Cookie") || "").split(";").map(c => c.trim().split("=")).filter(([k]) => k));
    const session = cookies[cookieName];

    // If not bypass and no session, redirect to login
    if (!isBypass && !session) {
      const loginUrl = new URL("/auth/login", url.origin);
      loginUrl.searchParams.set("redirect", url.pathname + url.search);
      return Response.redirect(loginUrl.toString(), 302);
    }

    // If session present, verify token (with cache)
    if (!isBypass && session) {
      const valid = await verifyIdToken(env, session);
      if (!valid) {
        const loginUrl = new URL("/auth/login", url.origin);
        loginUrl.searchParams.set("redirect", url.pathname + url.search);
        return Response.redirect(loginUrl.toString(), 302);
      }
    }

    // Serve static assets from repository root
    // Blocklist: do not expose sensitive files
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
  }
};

async function verifyIdToken(env, idToken) {
  if (!idToken) return false;
  const cacheKey = `t:${idToken.slice(0, 25)}`;
  const cached = env.__TOKEN_CACHE__.get(cacheKey);
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
      env.__TOKEN_CACHE__.set(cacheKey, { ok: true, expires: now + 5 * 60 * 1000 });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
