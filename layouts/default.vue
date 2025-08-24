<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- 导航栏 -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo 和标题 -->
          <div class="flex items-center space-x-4">
            <NuxtLink to="/" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined text-white text-lg">hub</span>
              </div>
              <span class="text-xl font-semibold text-gray-900 dark:text-white">NSSA工具集</span>
            </NuxtLink>
          </div>

          <!-- 导航菜单 -->
          <div class="hidden md:flex items-center space-x-6">
            <NuxtLink
              to="/"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === '/' }"
            >
              首页
            </NuxtLink>
            <NuxtLink
              to="/cron"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path.startsWith('/cron') }"
            >
              定时任务
            </NuxtLink>
            <NuxtLink
              to="/topfac"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path.startsWith('/topfac') }"
            >
              拓扑生成
            </NuxtLink>
            <!-- 开发环境显示测试链接 -->
            <NuxtLink
              v-if="$config.public.dev"
              to="/admin/test"
              class="nav-link text-orange-600 dark:text-orange-400"
              :class="{ 'nav-link-active': $route.path.startsWith('/admin') }"
            >
              系统测试
            </NuxtLink>
          </div>

          <!-- 右侧操作区 -->
          <div class="flex items-center space-x-4">
            <!-- 主题切换 -->
            <button
              @click="toggleTheme"
              class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :title="getThemeName"
            >
              <span class="material-symbols-outlined">{{ getThemeIcon }}</span>
            </button>

            <!-- 用户信息 -->
            <div v-if="isAuthenticated" class="flex items-center space-x-3">
              <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ getUserInfo?.email }}
              </span>
              <button
                @click="handleLogout"
                class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                退出
              </button>
            </div>

            <!-- 移动端菜单按钮 -->
            <button
              @click="toggleMobileMenu"
              class="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span class="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>

        <!-- 移动端菜单 -->
        <div v-if="showMobileMenu" class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex flex-col space-y-2">
            <NuxtLink 
              to="/" 
              class="mobile-nav-link"
              @click="closeMobileMenu"
            >
              首页
            </NuxtLink>
            <NuxtLink 
              to="/cron" 
              class="mobile-nav-link"
              @click="closeMobileMenu"
            >
              定时任务
            </NuxtLink>
            <NuxtLink 
              to="/topfac" 
              class="mobile-nav-link"
              @click="closeMobileMenu"
            >
              拓扑生成
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 NSSA工具集. All rights reserved.</p>
        </div>
      </div>
    </footer>

    <!-- Firebase配置指南 -->
    <FirebaseSetupGuide />

    <!-- Firebase状态指示器 -->
    <FirebaseStatus />
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, getUserInfo, logout } = useAuth()
const { toggleTheme, getThemeIcon, getThemeName, initTheme } = useTheme()

const showMobileMenu = ref(false)

// 初始化主题
onMounted(() => {
  initTheme()
})

// 切换移动端菜单
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

// 关闭移动端菜单
const closeMobileMenu = () => {
  showMobileMenu.value = false
}

// 处理登出
const handleLogout = async () => {
  const result = await logout()
  if (result.success) {
    await navigateTo('/')
  }
}

// 监听路由变化，关闭移动端菜单
watch(() => useRoute().path, () => {
  showMobileMenu.value = false
})
</script>

<style scoped>
.nav-link {
  @apply px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200;
}

.nav-link-active {
  @apply text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20;
}

.mobile-nav-link {
  @apply block px-3 py-2 rounded-lg text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200;
}
</style>
