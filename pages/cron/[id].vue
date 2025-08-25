<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <div class="flex items-center space-x-4 mb-4">
          <NuxtLink to="/cron" class="apple-button-secondary">
            <span class="material-symbols-outlined mr-2">arrow_back</span>
            返回
          </NuxtLink>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          任务详情
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          查看和管理定时任务的详细信息
        </p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span class="material-symbols-outlined text-gray-400 text-2xl animate-spin">refresh</span>
        </div>
        <p class="text-gray-500 dark:text-gray-400">加载任务详情中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-12">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span class="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">error</span>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          加载失败
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ error }}
        </p>
        <button @click="fetchTask" class="apple-button-primary">
          重试
        </button>
      </div>

      <!-- 任务详情 -->
      <div v-else-if="task" class="space-y-6">
        <!-- 任务基本信息 -->
        <div class="apple-card p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              基本信息
            </h2>
            <div class="flex items-center space-x-2">
              <span
                :class="[
                  'px-3 py-1 text-sm rounded-full',
                  task.status === 'active'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                ]"
              >
                {{ task.status === 'active' ? '运行中' : '已暂停' }}
              </span>
              <button
                @click="toggleTaskStatus"
                :class="[
                  'px-3 py-1 text-sm rounded-lg transition-colors',
                  task.status === 'active'
                    ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200'
                    : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200'
                ]"
              >
                {{ task.status === 'active' ? '暂停' : '启动' }}
              </button>
              <button
                @click="triggerTask"
                class="px-3 py-1 text-sm rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 transition-colors"
              >
                立即执行
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">{{ task.name }}</h3>
              <p v-if="task.description" class="text-gray-600 dark:text-gray-300 mb-4">
                {{ task.description }}
              </p>
              <div class="space-y-2 text-sm">
                <div class="flex items-center space-x-2">
                  <span class="text-gray-500 dark:text-gray-400">URL:</span>
                  <span class="text-gray-900 dark:text-white font-mono">{{ task.url }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-gray-500 dark:text-gray-400">方法:</span>
                  <span class="text-gray-900 dark:text-white">{{ task.method }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-gray-500 dark:text-gray-400">Cron:</span>
                  <span class="text-gray-900 dark:text-white font-mono">{{ task.cronExpression }}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-md font-medium text-gray-900 dark:text-white mb-2">统计信息</h4>
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500 dark:text-gray-400">创建时间:</span>
                  <span class="text-gray-900 dark:text-white">{{ formatDate(task.createdAt) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500 dark:text-gray-400">最后执行:</span>
                  <span class="text-gray-900 dark:text-white">
                    {{ task.lastExecuted ? formatDate(task.lastExecuted) : '从未执行' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500 dark:text-gray-400">执行次数:</span>
                  <span class="text-gray-900 dark:text-white">{{ executionCount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 执行历史 -->
        <div class="apple-card p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              执行历史
            </h2>
            <button @click="fetchExecutions" class="apple-button-secondary">
              <span class="material-symbols-outlined mr-2">refresh</span>
              刷新
            </button>
          </div>

          <!-- 执行历史加载状态 -->
          <div v-if="executionsLoading" class="text-center py-8">
            <span class="material-symbols-outlined text-gray-400 text-xl animate-spin">refresh</span>
            <p class="text-gray-500 dark:text-gray-400 mt-2">加载执行历史中...</p>
          </div>

          <!-- 执行历史列表 -->
          <div v-else-if="executions.length > 0" class="space-y-3">
            <div
              v-for="execution in executions"
              :key="execution.id"
              class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div class="flex items-center space-x-4">
                <div
                  :class="[
                    'w-3 h-3 rounded-full',
                    execution.status === 'success'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  ]"
                ></div>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ execution.status === 'success' ? '执行成功' : '执行失败' }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(execution.startTime) }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ execution.duration }}ms
                </div>
                <div v-if="execution.error" class="text-xs text-red-600 dark:text-red-400">
                  {{ execution.error }}
                </div>
              </div>
            </div>
          </div>

          <!-- 无执行历史 -->
          <div v-else class="text-center py-8">
            <span class="material-symbols-outlined text-gray-400 text-2xl">history</span>
            <p class="text-gray-500 dark:text-gray-400 mt-2">暂无执行历史</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

// 页面元数据
useHead({
  title: '任务详情 - NSSA工具集',
  meta: [
    { name: 'description', content: '查看和管理定时任务的详细信息' }
  ]
})

// 认证检查
const { isAuthenticated } = useAuth()

// 如果未认证，重定向到登录页
if (!isAuthenticated.value) {
  await navigateTo('/cron')
}

// 路由参数
const route = useRoute()
const taskId = route.params.id as string

// 状态
const loading = ref(true)
const error = ref('')
const task = ref<any>(null)
const executions = ref<any[]>([])
const executionsLoading = ref(false)

// 计算属性
const executionCount = computed(() => executions.value.length)

// 获取任务详情
const fetchTask = async () => {
  loading.value = true
  error.value = ''

  try {
    const { data } = await $fetch(`/api/cron/tasks/${taskId}`)
    task.value = data
  } catch (err: any) {
    error.value = err.message || '获取任务详情失败'
  } finally {
    loading.value = false
  }
}

// 获取执行历史
const fetchExecutions = async () => {
  if (!task.value) return

  executionsLoading.value = true

  try {
    const { data } = await $fetch(`/api/cron/tasks/${taskId}/executions`)
    executions.value = data
  } catch (err: any) {
    console.error('获取执行历史失败:', err)
  } finally {
    executionsLoading.value = false
  }
}

// 切换任务状态
const toggleTaskStatus = async () => {
  if (!task.value) return

  try {
    const newStatus = task.value.status === 'active' ? 'paused' : 'active'
    await $fetch(`/api/cron/tasks/${taskId}`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    
    task.value.status = newStatus
  } catch (err: any) {
    console.error('切换任务状态失败:', err)
  }
}

// 手动触发任务
const triggerTask = async () => {
  if (!task.value) return

  try {
    await $fetch(`/api/cron/tasks/${taskId}/trigger`, {
      method: 'POST'
    })
    
    // 刷新执行历史
    await fetchExecutions()
  } catch (err: any) {
    console.error('触发任务失败:', err)
  }
}

// 格式化日期
const formatDate = (date: any): string => {
  if (!date) return '未知'
  return dayjs(date.toDate ? date.toDate() : date).format('YYYY-MM-DD HH:mm:ss')
}

// 页面初始化
onMounted(async () => {
  await fetchTask()
  if (task.value) {
    await fetchExecutions()
  }
})
</script>
