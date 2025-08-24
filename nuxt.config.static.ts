// 静态生成专用配置 - 完全避免服务端依赖
export default defineNuxtConfig({
  // 静态生成模式
  nitro: {
    preset: 'static'
  },
  
  // 禁用SSR
  ssr: false,
  
  // 基础配置
  target: 'static',
  
  // 禁用TypeScript检查
  typescript: {
    typeCheck: false,
    strict: false
  },
  
  // 基础CSS
  css: [
    '@/assets/css/main.css'
  ],
  
  // 最小模块集
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  
  // 运行时配置（客户端）
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.FIREBASE_APP_ID || ''
    }
  },
  
  // 生成配置
  generate: {
    routes: [
      '/',
      '/cron',
      '/topfac',
      '/admin/test'
    ]
  },
  
  // 兼容性
  compatibilityDate: '2024-08-24'
})
