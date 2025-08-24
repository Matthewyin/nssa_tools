#!/usr/bin/env node

/**
 * 静态文件服务器
 * 用于在生产环境中提供Nuxt静态构建文件
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 配置
const PORT = process.env.PORT || 30000;
const HOST = process.env.HOST || '0.0.0.0';
const STATIC_DIR = path.join(__dirname, '../.output/public');

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.ico': 'image/x-icon'
};

// 获取文件的MIME类型
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// 检查文件是否存在
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 解析URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // 处理根路径
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // 构建文件路径
  let filePath = path.join(STATIC_DIR, pathname);

  // 检查文件是否存在
  if (!fileExists(filePath)) {
    // 如果是SPA路由，返回index.html
    if (!pathname.includes('.')) {
      filePath = path.join(STATIC_DIR, 'index.html');
    }
    
    // 如果index.html也不存在，返回404
    if (!fileExists(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - 页面未找到</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>404 - 页面未找到</h1>
          <p>请求的页面不存在</p>
          <p><a href="/">返回首页</a></p>
        </body>
        </html>
      `);
      return;
    }
  }

  // 读取文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>500 - 服务器错误</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>500 - 服务器错误</h1>
          <p>读取文件时发生错误</p>
          <p><a href="/">返回首页</a></p>
        </body>
        </html>
      `);
      return;
    }

    // 设置响应头
    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600' // 缓存1小时
    });
    
    // 发送文件内容
    res.end(data);
  });
});

// 启动服务器
server.listen(PORT, HOST, () => {
  console.log('🚀 静态文件服务器启动成功！');
  console.log(`🌐 服务地址: http://${HOST}:${PORT}`);
  console.log(`📁 静态文件目录: ${STATIC_DIR}`);
  console.log('按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});
