<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
    <div class="text-center">
      <div class="mb-8">
        <div class="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span class="material-symbols-outlined text-red-600 dark:text-red-400 text-4xl">error</span>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {{ error.statusCode || '错误' }}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
          {{ error.statusMessage || '页面出现了问题' }}
        </p>
      </div>

      <div class="space-y-4">
        <button
          @click="handleError"
          class="apple-button-primary"
        >
          <span class="material-symbols-outlined mr-2">refresh</span>
          重试
        </button>
        
        <div>
          <NuxtLink
            to="/"
            class="apple-button-secondary"
          >
            <span class="material-symbols-outlined mr-2">home</span>
            返回首页
          </NuxtLink>
        </div>
      </div>

      <!-- 开发环境显示详细错误信息 -->
      <div v-if="$config.public.dev && error.stack" class="mt-12 text-left">
        <details class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            错误详情
          </summary>
          <pre class="text-xs text-gray-600 dark:text-gray-400 overflow-auto">{{ error.stack }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ErrorProps {
  error: {
    statusCode?: number
    statusMessage?: string
    stack?: string
  }
}

const props = defineProps<ErrorProps>()

// 页面元数据
useHead({
  title: `错误 ${props.error.statusCode || ''} - NSSA工具集`
})

// 错误处理
const handleError = async () => {
  // 清除错误并重新加载
  await clearError({ redirect: '/' })
}
</script>
