import indexHtml from './index.html';
import styleCss from './css/style.css';

// Firebase Auth配置将从环境变量中读取

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 处理静态资源
    if (url.pathname === '/' || url.pathname === '/index.html') {
      // 动态替换HTML中的Firebase配置占位符
      let html = indexHtml;
      html = html.replace('__FIREBASE_API_KEY__', env.FIREBASE_API_KEY);
      html = html.replace('__FIREBASE_AUTH_DOMAIN__', env.FIREBASE_AUTH_DOMAIN);
      html = html.replace('__FIREBASE_PROJECT_ID__', env.FIREBASE_PROJECT_ID);
      html = html.replace('__FIREBASE_STORAGE_BUCKET__', env.FIREBASE_STORAGE_BUCKET);
      html = html.replace('__FIREBASE_MESSAGING_SENDER_ID__', env.FIREBASE_MESSAGING_SENDER_ID);
      html = html.replace('__FIREBASE_APP_ID__', env.FIREBASE_APP_ID);
      
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }
    if (url.pathname === '/css/style.css') {
      return new Response(styleCss, { headers: { 'Content-Type': 'text/css' } });
    }
    
    // 处理Firebase Auth代理请求
    if (url.pathname.startsWith('/auth/')) {
      return handleAuthProxy(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  },
};

// 处理Firebase Auth代理请求
async function handleAuthProxy(request, env) {
  try {
    const url = new URL(request.url);
    const authPath = url.pathname.replace('/auth/', '');
    
    // 构建Firebase Auth API URL
    const firebaseAuthUrl = `https://identitytoolkit.googleapis.com/v1/${authPath}?key=${env.FIREBASE_API_KEY}`;
    
    // 转发请求到Firebase Auth API
    const response = await fetch(firebaseAuthUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: request.method !== 'GET' ? await request.text() : undefined
    });
    
    // 返回Firebase Auth API的响应
    const responseData = await response.json();
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // 允许跨域请求
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      status: response.status
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}