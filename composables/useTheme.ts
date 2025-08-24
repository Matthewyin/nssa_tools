export type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const theme = ref<Theme>('system')
  const isDark = ref(false)

  // 初始化主题
  const initTheme = () => {
    if (process.client) {
      // 从 localStorage 获取保存的主题
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        theme.value = savedTheme
      }

      // 应用主题
      applyTheme(theme.value)

      // 监听系统主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', handleSystemThemeChange)

      // 清理监听器
      onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      })
    }
  }

  // 设置主题
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    
    if (process.client) {
      localStorage.setItem('theme', newTheme)
      applyTheme(newTheme)
    }
  }

  // 应用主题
  const applyTheme = (currentTheme: Theme) => {
    if (!process.client) return

    const html = document.documentElement
    
    if (currentTheme === 'dark') {
      html.classList.add('dark')
      isDark.value = true
    } else if (currentTheme === 'light') {
      html.classList.remove('dark')
      isDark.value = false
    } else {
      // system theme
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemDark) {
        html.classList.add('dark')
        isDark.value = true
      } else {
        html.classList.remove('dark')
        isDark.value = false
      }
    }
  }

  // 处理系统主题变化
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    if (theme.value === 'system') {
      if (e.matches) {
        document.documentElement.classList.add('dark')
        isDark.value = true
      } else {
        document.documentElement.classList.remove('dark')
        isDark.value = false
      }
    }
  }

  // 切换主题
  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  // 获取主题图标
  const getThemeIcon = computed(() => {
    switch (theme.value) {
      case 'light':
        return 'light_mode'
      case 'dark':
        return 'dark_mode'
      case 'system':
        return 'brightness_auto'
      default:
        return 'brightness_auto'
    }
  })

  // 获取主题名称
  const getThemeName = computed(() => {
    switch (theme.value) {
      case 'light':
        return '浅色模式'
      case 'dark':
        return '深色模式'
      case 'system':
        return '跟随系统'
      default:
        return '跟随系统'
    }
  })

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    getThemeIcon,
    getThemeName,
    initTheme,
    setTheme,
    toggleTheme
  }
}
