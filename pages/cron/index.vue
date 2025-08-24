<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 认证检查 -->
    <div v-if="!isAuthenticated" class="min-h-screen flex items-center justify-center px-4">
      <div class="apple-card p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-apple mx-auto mb-4 flex items-center justify-center">
            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">schedule</span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            定时任务管理
          </h2>
          <p class="text-gray-600 dark:text-gray-300">
            请登录以使用定时任务功能
          </p>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              邮箱地址
            </label>
            <input
              id="email"
              v-model="loginForm.email"
              type="email"
              required
              class="apple-input"
              placeholder="your@email.com"
            >
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密码
            </label>
            <input
              id="password"
              v-model="loginForm.password"
              type="password"
              required
              class="apple-input"
              placeholder="请输入密码"
            >
          </div>

          <!-- 错误信息 -->
          <div v-if="authError" class="text-red-600 dark:text-red-400 text-sm text-center">
            {{ authError }}
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="loading"
            class="apple-button-primary w-full"
          >
            <span v-if="loading" class="material-symbols-outlined animate-spin mr-2">refresh</span>
            <span v-else class="material-symbols-outlined mr-2">login</span>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>需要管理员创建账号才能使用此功能</p>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div v-else class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          定时任务管理
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          管理企业微信Webhook定时任务，支持灵活的调度规则
        </p>
      </div>

      <!-- 用户信息栏 -->
      <div class="apple-card p-4 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">person</span>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ getUserInfo?.email }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                已登录
              </p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="apple-button-secondary"
          >
            <span class="material-symbols-outlined mr-2">logout</span>
            退出登录
          </button>
        </div>
      </div>

      <!-- 任务列表区域 -->
      <div class="apple-card p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            任务列表
          </h2>
          <div class="flex items-center space-x-4">
            <NuxtLink to="/cron/scheduler" class="apple-button-secondary">
              <span class="material-symbols-outlined mr-2">schedule</span>
              调度器
            </NuxtLink>
            <button @click="exportTasks" class="apple-button-secondary">
              <span class="material-symbols-outlined mr-2">download</span>
              导出
            </button>
            <input
              ref="importInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="importTasks"
            >
            <button @click="triggerImport" class="apple-button-secondary">
              <span class="material-symbols-outlined mr-2">upload</span>
              导入
            </button>
            <button @click="openCreateModal" class="apple-button-primary">
              <span class="material-symbols-outlined mr-2">add</span>
              创建任务
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="tasksLoading" class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span class="material-symbols-outlined text-gray-400 text-2xl animate-spin">refresh</span>
          </div>
          <p class="text-gray-500 dark:text-gray-400">加载任务中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="tasks.length === 0" class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span class="material-symbols-outlined text-gray-400 text-2xl">schedule</span>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            暂无任务
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            点击"创建任务"来添加您的第一个定时任务
          </p>
          <button @click="openCreateModal" class="apple-button-primary">
            <span class="material-symbols-outlined mr-2">add</span>
            创建第一个任务
          </button>
        </div>

        <!-- 任务列表 -->
        <div v-else class="space-y-4">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="apple-card p-4 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center justify-between">
              <!-- 任务信息 -->
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ task.name }}
                  </h3>
                  <span
                    :class="[
                      'px-2 py-1 text-xs rounded-full',
                      task.isActive
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                    ]"
                  >
                    {{ task.isActive ? '运行中' : '已暂停' }}
                  </span>
                </div>

                <p v-if="task.description" class="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {{ task.description }}
                </p>

                <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <div class="flex items-center space-x-4">
                    <span>{{ getScheduleText(task) }}</span>
                    <span v-if="task.nextRun">
                      下次: {{ formatNextRun(task.nextRun) }}
                    </span>
                  </div>
                  <div class="flex items-center space-x-4">
                    <span>执行: {{ task.runCount || 0 }} 次</span>
                    <span v-if="task.failureCount">
                      失败: {{ task.failureCount }} 次
                    </span>
                    <span v-if="task.lastRun">
                      最后: {{ formatLastRun(task.lastRun) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex items-center space-x-2">
                <button
                  @click="toggleTask(task)"
                  :class="[
                    'px-3 py-1 text-sm rounded-lg transition-colors',
                    task.isActive
                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800'
                      : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                  ]"
                >
                  {{ task.isActive ? '暂停' : '启动' }}
                </button>

                <button
                  @click="executeTaskNow(task)"
                  class="px-3 py-1 text-sm rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  立即执行
                </button>

                <button
                  @click="openEditModal(task)"
                  class="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  编辑
                </button>

                <button
                  @click="confirmDeleteTask(task)"
                  class="px-3 py-1 text-sm rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 任务表单弹窗 -->
      <TaskForm
        v-if="showTaskForm"
        :task="editingTask"
        :is-edit="!!editingTask"
        @close="closeTaskForm"
        @submit="handleTaskSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { Task } from '~/composables/useTasks'

// 页面元数据
useHead({
  title: '定时任务管理 - NSSA工具集',
  meta: [
    { name: 'description', content: '企业微信Webhook定时任务管理工具，支持灵活的调度规则和任务监控' }
  ]
})

// 认证相关
const { isAuthenticated, getUserInfo, login, logout, loading, error: authError } = useAuth()

// 任务管理
const {
  tasks,
  loading: tasksLoading,
  error: tasksError,
  subscribeToTasks,
  toggleTaskStatus,
  executeTask,
  deleteTask
} = useTasks()

// 登录表单
const loginForm = reactive({
  email: '',
  password: ''
})

// 任务表单状态
const showTaskForm = ref(false)
const editingTask = ref<Task | null>(null)
const importInput = ref<HTMLInputElement>()

// 处理登录
const handleLogin = async () => {
  const result = await login(loginForm.email, loginForm.password)
  if (result.success) {
    // 登录成功后订阅任务更新
    subscribeToTasks()
  }
}

// 处理登出
const handleLogout = async () => {
  const result = await logout()
  if (result.success) {
    console.log('登出成功')
  }
}

// 打开创建任务弹窗
const openCreateModal = () => {
  editingTask.value = null
  showTaskForm.value = true
}

// 打开编辑任务弹窗
const openEditModal = (task: Task) => {
  editingTask.value = task
  showTaskForm.value = true
}

// 关闭任务表单
const closeTaskForm = () => {
  showTaskForm.value = false
  editingTask.value = null
}

// 处理任务提交
const handleTaskSubmit = () => {
  // 表单组件会自动处理保存，这里只需要关闭弹窗
  closeTaskForm()
}

// 切换任务状态
const toggleTask = async (task: Task) => {
  const result = await toggleTaskStatus(task.id!)
  if (!result.success) {
    console.error('切换任务状态失败:', result.error)
  }
}

// 立即执行任务
const executeTaskNow = async (task: Task) => {
  const result = await executeTask(task)
  if (result.success) {
    console.log('任务执行成功')
  } else {
    console.error('任务执行失败:', result.error)
  }
}

// 确认删除任务
const confirmDeleteTask = async (task: Task) => {
  if (confirm(`确定要删除任务"${task.name}"吗？此操作不可撤销。`)) {
    const result = await deleteTask(task.id!)
    if (!result.success) {
      console.error('删除任务失败:', result.error)
    }
  }
}

// 获取调度描述文本
const getScheduleText = (task: Task): string => {
  if (task.scheduleType === 'simple') {
    return `每 ${task.interval} ${task.unit === 'minutes' ? '分钟' : task.unit === 'hours' ? '小时' : '天'}`
  } else {
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    const days = task.days?.map(d => dayNames[parseInt(d)]).join(', ') || ''
    return `每周 ${days} ${task.time}`
  }
}

// 格式化下次运行时间
const formatNextRun = (timestamp: number): string => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}

// 格式化最后运行时间
const formatLastRun = (timestamp: number): string => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}

// 导出任务
const exportTasks = () => {
  const data = {
    tasks: tasks.value,
    exportTime: new Date().toISOString(),
    version: '1.0'
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasks-${dayjs().format('YYYY-MM-DD')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 触发导入
const triggerImport = () => {
  importInput.value?.click()
}

// 导入任务
const importTasks = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      console.log('导入的任务数据:', data)
      // TODO: 实现任务导入逻辑
    } catch (error) {
      console.error('导入失败:', error)
    }
  }
  reader.readAsText(file)
}

// 页面初始化
onMounted(async () => {
  // 如果已登录，订阅任务更新
  if (isAuthenticated.value) {
    subscribeToTasks()
  }
})

// 监听认证状态变化
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    subscribeToTasks()
  }
})
</script>
