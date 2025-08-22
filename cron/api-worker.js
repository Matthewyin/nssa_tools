/**
 * 定时任务API Worker
 * 提供任务管理的REST API接口
 */

import { ServerCronManager } from './server-cron.js';

export default {
  async fetch(request, env, ctx) {
    const cronManager = new ServerCronManager(env);
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 设置CORS头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // 处理OPTIONS请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 验证用户身份
      const user = await authenticateUser(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // 路由处理
      if (path === '/api/tasks' && request.method === 'GET') {
        return await handleGetTasks(request, cronManager, user, corsHeaders);
      } else if (path === '/api/tasks' && request.method === 'POST') {
        return await handleCreateTask(request, cronManager, user, corsHeaders);
      } else if (path.startsWith('/api/tasks/') && request.method === 'GET') {
        return await handleGetTask(request, cronManager, user, corsHeaders);
      } else if (path.startsWith('/api/tasks/') && request.method === 'PUT') {
        return await handleUpdateTask(request, cronManager, user, corsHeaders);
      } else if (path.startsWith('/api/tasks/') && request.method === 'DELETE') {
        return await handleDeleteTask(request, cronManager, user, corsHeaders);
      } else if (path.startsWith('/api/tasks/') && request.method === 'POST') {
        const taskId = path.split('/').pop();
        const action = url.searchParams.get('action');
        
        if (action === 'pause') {
          return await handlePauseTask(request, cronManager, user, taskId, corsHeaders);
        } else if (action === 'resume') {
          return await handleResumeTask(request, cronManager, user, taskId, corsHeaders);
        } else if (action === 'trigger') {
          return await handleTriggerTask(request, cronManager, user, taskId, corsHeaders);
        }
      } else if (path.startsWith('/api/tasks/') && path.endsWith('/logs')) {
        return await handleGetTaskLogs(request, cronManager, user, corsHeaders);
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
};

/**
 * 用户身份验证
 */
async function authenticateUser(request, env) {
  try {
    // 从请求头获取Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // 验证Firebase ID token
    const firebaseAuthUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`;
    const response = await fetch(firebaseAuthUrl, {
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

/**
 * 获取用户任务列表
 */
async function handleGetTasks(request, cronManager, user, headers) {
  const tasks = await cronManager.getUserTasks(user.email);
  return new Response(JSON.stringify({ tasks }), { headers });
}

/**
 * 创建新任务
 */
async function handleCreateTask(request, cronManager, user, headers) {
  const taskData = await request.json();
  
  // 验证输入数据
  if (!taskData.name || !taskData.url) {
    return new Response(JSON.stringify({ error: 'Name and URL are required' }), {
      status: 400,
      headers
    });
  }

  const task = await cronManager.createTask(user.email, taskData);
  return new Response(JSON.stringify({ task }), { 
    status: 201,
    headers 
  });
}

/**
 * 获取单个任务
 */
async function handleGetTask(request, cronManager, user, headers) {
  const taskId = request.url.split('/').pop();
  const task = await cronManager.getTask(taskId);
  
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers
    });
  }

  // 验证任务所有权
  if (task.userId !== user.email) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers
    });
  }

  return new Response(JSON.stringify({ task }), { headers });
}

/**
 * 更新任务
 */
async function handleUpdateTask(request, cronManager, user, headers) {
  const taskId = request.url.split('/').pop();
  const updates = await request.json();
  
  const task = await cronManager.getTask(taskId);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers
    });
  }

  // 验证任务所有权
  if (task.userId !== user.email) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers
    });
  }

  const updatedTask = await cronManager.updateTask(taskId, updates);
  return new Response(JSON.stringify({ task: updatedTask }), { headers });
}

/**
 * 删除任务
 */
async function handleDeleteTask(request, cronManager, user, headers) {
  const taskId = request.url.split('/').pop();
  const task = await cronManager.getTask(taskId);
  
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers
    });
  }

  // 验证任务所有权
  if (task.userId !== user.email) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers
    });
  }

  await cronManager.deleteTask(taskId);
  return new Response(JSON.stringify({ success: true }), { headers });
}

/**
 * 暂停任务
 */
async function handlePauseTask(request, cronManager, user, taskId, headers) {
  const task = await cronManager.getTask(taskId);
  if (!task || task.userId !== user.email) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers
    });
  }

  const updatedTask = await cronManager.pauseTask(taskId);
  return new Response(JSON.stringify({ task: updatedTask }), { headers });
}

/**
 * 恢复任务
 */
async function handleResumeTask(request, cronManager, user, taskId, headers) {
  const task = await cronManager.getTask(taskId);
  if (!task || task.userId !== user.email) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers
    });
  }

  const updatedTask = await cronManager.resumeTask(taskId);
  return new Response(JSON.stringify({ task: updatedTask }), { headers });
}

/**
 * 触发任务执行
 */
async function handleTriggerTask(request, cronManager, user, taskId, headers) {
  const task = await cronManager.getTask(taskId);
  if (!task || task.userId !== user.email) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers
    });
  }

  const result = await cronManager.triggerTask(taskId);
  return new Response(JSON.stringify({ 
    success: result.success, 
    error: result.error 
  }), { headers });
}

/**
 * 获取任务日志
 */
async function handleGetTaskLogs(request, cronManager, user, headers) {
  const taskId = request.url.split('/')[3]; // /api/tasks/{taskId}/logs
  const task = await cronManager.getTask(taskId);
  
  if (!task || task.userId !== user.email) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers
    });
  }

  const limit = parseInt(new URL(request.url).searchParams.get('limit') || '100');
  const logs = await cronManager.getTaskLogs(taskId, limit);
  
  return new Response(JSON.stringify({ logs }), { headers });
}