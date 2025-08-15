// Firebase配置文件 - 使用wrangler.toml中的真实配置
// 这个配置与wrangler.toml中的FIREBASE_*变量保持同步
window.__FIREBASE_CONFIG__ = {
  apiKey: "AIzaSyAQVuM1XSbFw_x3IQ0ZV98XwCWGbgFhIGM",
  authDomain: "n8n-project-460516.firebaseapp.com",
  projectId: "n8n-project-460516",
  storageBucket: "n8n-project-460516.firebasestorage.app",
  messagingSenderId: "18068529376",
  appId: "1:18068529376:web:d1fe5d7e4e53c2817a3085"
};

console.log('Firebase配置已加载:', window.__FIREBASE_CONFIG__);

// 选项2: 启用Firebase登录功能（需要真实的Firebase项目配置）
// 请将下面的示例配置替换为您的实际Firebase项目配置
/*
window.__FIREBASE_CONFIG__ = {
  apiKey: "your-real-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
*/

// 注意：使用无效的API密钥会导致Firebase错误
// 如果您看到"auth/api-key-not-valid"错误，请：
// 1. 设置为null禁用Firebase，或
// 2. 使用真实的Firebase项目配置
