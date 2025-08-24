<template>
  <div v-if="showNotice" class="fixed top-4 right-4 z-50 max-w-sm">
    <div class="apple-card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <div class="flex items-start space-x-3">
        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">info</span>
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
            演示模式
          </h3>
          <p class="text-xs text-blue-700 dark:text-blue-200 mb-3">
            当前运行在演示模式下。要使用完整功能，请配置Firebase项目。
          </p>
          <div class="text-xs text-blue-600 dark:text-blue-300 space-y-1">
            <div>登录账号: demo@example.com</div>
            <div>登录密码: demo123</div>
          </div>
        </div>
        <button
          @click="hideNotice"
          class="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
        >
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $firebase } = useNuxtApp()
const showNotice = ref(false)

// 检查是否为演示模式
onMounted(() => {
  if ($firebase?.isDemo) {
    // 检查是否已经隐藏过提示
    const hidden = localStorage.getItem('demo_notice_hidden')
    if (!hidden) {
      showNotice.value = true
    }
  }
})

const hideNotice = () => {
  showNotice.value = false
  localStorage.setItem('demo_notice_hidden', 'true')
}
</script>
