// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  ssr: false,

  // 开发服务器配置 - 端口30100
  devServer: {
    port: 30100,
    host: '0.0.0.0'
  },

  // 生产环境配置
  nitro: {
    minify: true,
    preset: process.env.NODE_ENV === 'production' ? 'node-server' : undefined,
    experimental: {
      wasm: false
    },
    esbuild: {
      options: {
        target: 'node18'
      }
    },
    rollupConfig: {
      external: [],
      output: {
        inlineDynamicImports: false
      }
    },
    moduleSideEffects: [],
    prerender: {
      routes: ['/']
    }
  },

  // CSS框架配置
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
    '~/assets/styles/variables.scss',
    '~/assets/styles/responsive.scss'
  ],

  // 构建配置
  build: {
    transpile: ['vuetify'],
    analyze: process.env.ANALYZE === 'true'
  },

  // 性能优化
  experimental: {
    payloadExtraction: false
  },

  // Vite配置
  vite: {
    ssr: {
      noExternal: ['vuetify']
    },
    build: {
      chunkSizeWarningLimit: 1000
    }
  },

  // 模块配置
  modules: [
    '@nuxt/eslint'
  ],

  // 应用配置
  app: {
    baseURL: '/topfac/',
    head: {
      title: '说出来的网络拓扑',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '数据统计展示系统 - Google Dashboard风格' }
      ]
    }
  },

  // 运行时配置
  runtimeConfig: {
    // 服务器端配置
    private: {
      apiSecret: '123'
    },
    // 客户端配置
    public: {
      topologyApiUrl: process.env.TOPOLOGY_API_URL || ''  // 同域部署，使用相对路径
    }
  },

  // 组件配置
  components: {
    global: true,
    dirs: ['~/components']
  },

  // 自动导入
  imports: {
    autoImport: true
  },

  // TypeScript配置
  typescript: {
    typeCheck: false
  },

  // 插件配置
  plugins: [
    { src: '~/plugins/01.vuetify.client.ts', mode: 'client' },
    { src: '~/plugins/topology-api.client.ts', mode: 'client' }
  ]
})