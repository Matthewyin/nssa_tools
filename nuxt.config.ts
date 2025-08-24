// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // 模块配置
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],

  // TypeScript 配置
  typescript: {
    strict: false,
    typeCheck: false
  },

  // 实验性功能配置
  experimental: {
    // 禁用oxc-parser，使用传统解析器
    oxcParser: false
  },

  // 构建配置
  build: {
    transpile: []
  },

  // Vite配置
  vite: {
    // 强制使用esbuild而不是oxc
    esbuild: {
      target: 'es2020'
    },
    optimizeDeps: {
      // 排除有问题的依赖
      exclude: ['oxc-parser', 'oxc-walker']
    }
  },

  // Nitro配置
  nitro: {
    esbuild: {
      options: {
        target: 'es2020'
      }
    }
  },

  // CSS 配置
  css: [
    '~/assets/css/main.css'
  ],

  // 应用配置
  app: {
    head: {
      title: 'NSSA工具集',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'NSSA工具集 - 集成定时任务和网络拓扑生成工具' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200' }
      ]
    }
  },

  // 运行时配置
  runtimeConfig: {
    // 私有配置（仅服务端可用）
    firebaseAdminPrivateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    firebaseAdminClientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    firebaseAdminProjectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    
    // 公共配置（客户端和服务端都可用）
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID
    }
  },

  // 服务端渲染配置
  ssr: true,

  // 构建配置
  build: {
    transpile: ['firebase']
  },

  // 开发服务器配置
  devServer: {
    port: 3000,
    host: '0.0.0.0'
  },

  // Vite 配置
  vite: {
    server: {
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/apps/**']
      }
    }
  },

  // Tailwind CSS 配置
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.js'
  },

  // 兼容性配置
  compatibilityDate: '2024-11-01'
})
