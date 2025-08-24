<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click="closeModal">
    <div class="apple-card max-w-2xl w-full max-h-[90vh] overflow-y-auto" @click.stop>
      <div class="p-6">
        <!-- 标题 -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ isEdit ? '编辑任务' : '创建新任务' }}
          </h2>
          <button
            @click="closeModal"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 基本信息 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">基本信息</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                任务名称 *
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                class="apple-input"
                placeholder="例如：每日数据同步"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                任务描述
              </label>
              <textarea
                v-model="form.description"
                rows="2"
                class="apple-input"
                placeholder="任务描述（可选）"
              ></textarea>
            </div>
          </div>

          <!-- Webhook配置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Webhook配置</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Webhook URL *
              </label>
              <input
                v-model="form.url"
                type="url"
                required
                class="apple-input"
                placeholder="https://qyapi.weixin.qq.com/..."
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                请求方法
              </label>
              <select v-model="form.method" class="apple-input">
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                请求体 (Request Body)
              </label>
              <textarea
                v-model="form.body"
                rows="4"
                class="apple-input"
                placeholder='例如：{"msgtype": "text", "text": {"content": "你好"}}'
              ></textarea>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JSON格式，GET请求时忽略
              </p>
            </div>
          </div>

          <!-- 调度配置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">调度配置</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                调度类型
              </label>
              <select v-model="form.scheduleType" class="apple-input">
                <option value="simple">简单间隔</option>
                <option value="advanced">高级定时 (类Cron)</option>
              </select>
            </div>

            <!-- 简单调度 -->
            <div v-if="form.scheduleType === 'simple'" class="space-y-4">
              <div class="flex items-center space-x-4">
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    执行间隔
                  </label>
                  <input
                    v-model.number="form.interval"
                    type="number"
                    min="1"
                    class="apple-input"
                    placeholder="5"
                  >
                </div>
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    时间单位
                  </label>
                  <select v-model="form.unit" class="apple-input">
                    <option value="minutes">分钟</option>
                    <option value="hours">小时</option>
                    <option value="days">天</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 高级调度 -->
            <div v-else class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  执行日期 (每周)
                </label>
                <div class="grid grid-cols-4 gap-2">
                  <label v-for="(day, index) in weekDays" :key="index" class="flex items-center space-x-2">
                    <input
                      v-model="form.days"
                      type="checkbox"
                      :value="index.toString()"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    >
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ day }}</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  执行时间
                </label>
                <input
                  v-model="form.time"
                  type="time"
                  class="apple-input"
                >
              </div>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">
            {{ error }}
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              @click="closeModal"
              class="apple-button-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="apple-button-primary"
            >
              <span v-if="loading" class="material-symbols-outlined animate-spin mr-2">refresh</span>
              {{ loading ? '保存中...' : (isEdit ? '保存更改' : '创建任务') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/composables/useTasks'

interface Props {
  task?: Task | null
  isEdit?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  submit: [task: Partial<Task>]
}>()

const { createTask, updateTask } = useTasks()

// 表单数据
const form = reactive({
  name: '',
  description: '',
  url: '',
  method: 'POST' as 'GET' | 'POST' | 'PUT' | 'DELETE',
  body: '',
  scheduleType: 'simple' as 'simple' | 'advanced',
  interval: 5,
  unit: 'minutes' as 'minutes' | 'hours' | 'days',
  days: [] as string[],
  time: '09:00',
  isActive: true
})

const loading = ref(false)
const error = ref<string | null>(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 初始化表单
const initForm = () => {
  if (props.task && props.isEdit) {
    Object.assign(form, {
      name: props.task.name,
      description: props.task.description || '',
      url: props.task.url,
      method: props.task.method,
      body: props.task.body || '',
      scheduleType: props.task.scheduleType,
      interval: props.task.interval || 5,
      unit: props.task.unit || 'minutes',
      days: props.task.days || [],
      time: props.task.time || '09:00',
      isActive: props.task.isActive
    })
  }
}

// 验证JSON格式
const isValidJson = (str: string): boolean => {
  if (!str.trim()) return true
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    error.value = null
    
    // 验证请求体JSON格式
    if (form.body && form.method !== 'GET' && !isValidJson(form.body)) {
      error.value = '请求体不是有效的JSON格式'
      return
    }

    // 验证高级调度配置
    if (form.scheduleType === 'advanced' && form.days.length === 0) {
      error.value = '请至少选择一个执行日期'
      return
    }

    loading.value = true

    const taskData = {
      name: form.name,
      description: form.description,
      url: form.url,
      method: form.method,
      body: form.body,
      scheduleType: form.scheduleType,
      interval: form.scheduleType === 'simple' ? form.interval : undefined,
      unit: form.scheduleType === 'simple' ? form.unit : undefined,
      days: form.scheduleType === 'advanced' ? form.days : undefined,
      time: form.scheduleType === 'advanced' ? form.time : undefined,
      isActive: form.isActive
    }

    let result
    if (props.isEdit && props.task?.id) {
      result = await updateTask(props.task.id, taskData)
    } else {
      result = await createTask(taskData)
    }

    if (result.success) {
      emit('submit', taskData)
      closeModal()
    } else {
      error.value = result.error || '操作失败'
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 初始化
onMounted(() => {
  initForm()
})

// 监听任务变化
watch(() => props.task, () => {
  initForm()
}, { deep: true })
</script>
