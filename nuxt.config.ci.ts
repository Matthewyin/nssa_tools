// CI环境专用的简化Nuxt配置
// 避免oxc-parser和其他可能的构建问题

export default defineNuxtConfig({
  // 基础配置
  ssr: true,
  
  // 禁用可能有问题的功能
  typescript: {
    typeCheck: false,
    strict: false
  },
  
  // 简化的CSS配置
  css: [
    '@/assets/css/main.css'
  ],
  
  // 基础模块
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  
  // 运行时配置
  runtimeConfig: {
    // 服务端环境变量
    firebaseAdminPrivateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    firebaseAdminClientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    firebaseAdminProjectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    
    // 公开环境变量
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID
    }
  },
  
  // 构建配置
  build: {
    transpile: []
  },
  
  // Nitro配置
  nitro: {
    preset: 'firebase',
    esbuild: {
      options: {
        target: 'es2020'
      }
    }
  },
  
  // 兼容性配置
  compatibilityDate: '2024-08-24'
})
