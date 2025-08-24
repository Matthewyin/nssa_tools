<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          任务调度器
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          手动触发任务调度器，检查和执行待执行的任务
        </p>
      </div>

      <!-- 调度器控制面板 -->
      <div class="apple-card p-6 mb-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            调度器控制
          </h2>
          <div class="flex items-center space-x-4">
            <button
              @click="runScheduler"
              :disabled="isRunning"
              class="apple-button-primary"
            >
              <span v-if="isRunning" class="material-symbols-outlined animate-spin mr-2">refresh</span>
              <span v-else class="material-symbols-outlined mr-2">play_arrow</span>
              {{ isRunning ? '运行中...' : '手动执行调度' }}
            </button>
          </div>
        </div>

        <!-- 状态信息 -->
        <div v-if="lastResult" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ lastResult.executedCount || 0 }}
              </div>
              <div class="text-sm text-blue-700 dark:text-blue-300">执行任务数</div>
            </div>
            
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ successCount }}
              </div>
              <div class="text-sm text-green-700 dark:text-green-300">成功任务</div>
            </div>
            
            <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ lastResult.errors?.length || 0 }}
              </div>
              <div class="text-sm text-red-700 dark:text-red-300">失败任务</div>
            </div>
          </div>

          <!-- 执行结果详情 -->
          <div v-if="lastResult.executedTasks?.length > 0" class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              执行结果
            </h3>
            
            <div class="space-y-2">
              <div
                v-for="task in lastResult.executedTasks"
                :key="task.id"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <span
                    :class="[
                      'w-2 h-2 rounded-full',
                      task.success ? 'bg-green-500' : 'bg-red-500'
                    ]"
                  ></span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ task.name }}
                  </span>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  下次: {{ formatNextRun(task.nextRun) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="lastResult.errors?.length > 0" class="space-y-4">
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-100">
              执行错误
            </h3>
            
            <div class="space-y-2">
              <div
                v-for="error in lastResult.errors"
                :key="error.taskId"
                class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div class="font-medium text-red-900 dark:text-red-100">
                  {{ error.taskName }}
                </div>
                <div class="text-sm text-red-700 dark:text-red-300">
                  {{ error.error }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-center space-x-2">
            <span class="material-symbols-outlined text-red-600 dark:text-red-400 text-sm">error</span>
            <span class="text-red-700 dark:text-red-300 text-sm">{{ error }}</span>
          </div>
        </div>
      </div>

      <!-- 说明信息 -->
      <div class="apple-card p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          关于任务调度器
        </h2>
        
        <div class="space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong>手动调度</strong>：点击"手动执行调度"按钮可以立即检查并执行所有待执行的任务。
          </p>
          
          <p>
            <strong>自动调度</strong>：在生产环境中，建议使用以下方式实现自动调度：
          </p>
          
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li><strong>Firebase Functions + Cloud Scheduler</strong>：设置定时触发器每分钟调用调度器API</li>
            <li><strong>外部Cron服务</strong>：使用系统cron或其他调度服务定期调用 <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">/api/cron/scheduler</code></li>
            <li><strong>第三方服务</strong>：使用Vercel Cron、GitHub Actions等服务定时触发</li>
          </ul>
          
          <p>
            <strong>注意</strong>：当前实现是基于服务端的任务执行，比客户端执行更可靠和安全。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

// 页面元数据
useHead({
  title: '任务调度器 - NSSA工具集',
  meta: [
    { name: 'description', content: '手动触发和管理定时任务调度器' }
  ]
})

// 响应式数据
const isRunning = ref(false)
const error = ref('')
const lastResult = ref<any>(null)

// 计算属性
const successCount = computed(() => {
  if (!lastResult.value?.executedTasks) return 0
  return lastResult.value.executedTasks.filter((task: any) => task.success).length
})

// 方法
const runScheduler = async () => {
  if (isRunning.value) return

  isRunning.value = true
  error.value = ''

  try {
    // 在开发环境使用简化版调度器
    const config = useRuntimeConfig()
    const apiEndpoint = config.public.dev ? '/api/cron/scheduler-dev' : '/api/cron/scheduler'

    const response = await $fetch(apiEndpoint, {
      method: 'POST'
    })

    lastResult.value = response
    console.log('调度器执行结果:', response)

  } catch (err: any) {
    error.value = err.message || '调度器执行失败'
    console.error('调度器执行失败:', err)
  } finally {
    isRunning.value = false
  }
}

// 格式化下次运行时间
const formatNextRun = (timestamp: number): string => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}

// 页面初始化
onMounted(() => {
  console.log('任务调度器页面已加载')
})
</script>
