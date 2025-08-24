import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          dark: false,
          colors: {
            primary: '#1976D2',     // Google蓝色
            secondary: '#424242',   // 深灰色
            accent: '#82B1FF',      // 蓝色变体
            error: '#FF5252',       // 红色
            info: '#2196F3',        // 蓝色
            success: '#4CAF50',     // 绿色
            warning: '#FFC107',     // 黄色
            surface: '#FFFFFF',     // 表面颜色
            background: '#F5F5F5'   // 背景颜色
          }
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
}) 