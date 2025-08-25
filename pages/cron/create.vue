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
          创建定时任务
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          配置新的定时任务，支持HTTP请求和企业微信Webhook
        </p>
      </div>

      <!-- 任务表单 -->
      <div class="apple-card p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 基本信息 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">基本信息</h3>
            
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                任务名称 *
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="apple-input"
                placeholder="请输入任务名称"
              >
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                任务描述
              </label>
              <textarea
                id="description"
                v-model="form.description"
                rows="3"
                class="apple-input"
                placeholder="请输入任务描述（可选）"
              ></textarea>
            </div>
          </div>

          <!-- 调度配置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">调度配置</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                调度类型
              </label>
              <div class="grid grid-cols-2 gap-4">
                <label class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    v-model="form.scheduleType"
                    type="radio"
                    value="simple"
                    class="text-blue-600"
                  >
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">简单间隔</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">按固定间隔执行</div>
                  </div>
                </label>
                <label class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    v-model="form.scheduleType"
                    type="radio"
                    value="cron"
                    class="text-blue-600"
                  >
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">Cron表达式</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">高级调度规则</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- 简单间隔配置 -->
            <div v-if="form.scheduleType === 'simple'" class="grid grid-cols-2 gap-4">
              <div>
                <label for="interval" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  间隔数值
                </label>
                <input
                  id="interval"
                  v-model.number="form.interval"
                  type="number"
                  min="1"
                  required
                  class="apple-input"
                  placeholder="1"
                >
              </div>
              <div>
                <label for="unit" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  时间单位
                </label>
                <select id="unit" v-model="form.unit" class="apple-input">
                  <option value="minutes">分钟</option>
                  <option value="hours">小时</option>
                  <option value="days">天</option>
                </select>
              </div>
            </div>

            <!-- Cron表达式配置 -->
            <div v-if="form.scheduleType === 'cron'">
              <label for="cronExpression" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cron表达式
              </label>
              <input
                id="cronExpression"
                v-model="form.cronExpression"
                type="text"
                required
                class="apple-input"
                placeholder="0 */5 * * * *"
              >
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                格式：秒 分 时 日 月 周，例如：0 */5 * * * * (每5分钟执行一次)
              </p>
            </div>
          </div>

          <!-- HTTP配置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">HTTP配置</h3>
            
            <div>
              <label for="url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                请求URL *
              </label>
              <input
                id="url"
                v-model="form.url"
                type="url"
                required
                class="apple-input"
                placeholder="https://example.com/webhook"
              >
            </div>

            <div>
              <label for="method" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                请求方法
              </label>
              <select id="method" v-model="form.method" class="apple-input">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label for="headers" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                请求头 (JSON格式)
              </label>
              <textarea
                id="headers"
                v-model="form.headers"
                rows="3"
                class="apple-input"
                placeholder='{"Content-Type": "application/json"}'
              ></textarea>
            </div>

            <div v-if="['POST', 'PUT'].includes(form.method)">
              <label for="body" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                请求体
              </label>
              <textarea
                id="body"
                v-model="form.body"
                rows="4"
                class="apple-input"
                placeholder='{"message": "Hello World"}'
              ></textarea>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">
            {{ error }}
          </div>

          <!-- 提交按钮 -->
          <div class="flex items-center justify-end space-x-4">
            <NuxtLink to="/cron" class="apple-button-secondary">
              取消
            </NuxtLink>
            <button
              type="submit"
              :disabled="loading"
              class="apple-button-primary"
            >
              <span v-if="loading" class="material-symbols-outlined animate-spin mr-2">refresh</span>
              <span v-else class="material-symbols-outlined mr-2">save</span>
              {{ loading ? '创建中...' : '创建任务' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useCronStore } from '~/stores/cron'

// 页面元数据
useHead({
  title: '创建定时任务 - NSSA工具集',
  meta: [
    { name: 'description', content: '创建新的定时任务，支持HTTP请求和企业微信Webhook' }
  ]
})

// 使用状态管理
const authStore = useAuthStore()
const cronStore = useCronStore()

// 认证检查
const { isAuthenticated } = storeToRefs(authStore)

// 如果未认证，重定向到登录页
if (!isAuthenticated.value) {
  await navigateTo('/cron')
}

// 表单数据
const form = reactive({
  name: '',
  description: '',
  scheduleType: 'simple',
  interval: 5,
  unit: 'minutes',
  cronExpression: '',
  url: '',
  method: 'POST',
  headers: '{"Content-Type": "application/json"}',
  body: ''
})

// 状态
const loading = ref(false)
const error = ref('')

// 处理表单提交
const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    // 验证表单数据
    if (!form.name || !form.url) {
      throw new Error('请填写必填字段')
    }

    // 解析headers
    let headers = {}
    if (form.headers.trim()) {
      try {
        headers = JSON.parse(form.headers)
      } catch (e) {
        throw new Error('请求头格式错误，请使用有效的JSON格式')
      }
    }

    // 构建任务数据
    const taskData = {
      name: form.name,
      description: form.description,
      url: form.url,
      method: form.method,
      headers,
      body: form.body,
      cronExpression: form.scheduleType === 'cron' 
        ? form.cronExpression 
        : generateCronFromSimple(form.interval, form.unit)
    }

    // 使用状态管理创建任务
    const result = await cronStore.createTask(taskData)

    if (result.success) {
      // 创建成功，跳转到任务列表
      await navigateTo('/cron')
    } else {
      throw new Error(result.error)
    }
  } catch (err: any) {
    error.value = err.message || '创建任务失败'
  } finally {
    loading.value = false
  }
}

// 将简单间隔转换为Cron表达式
function generateCronFromSimple(interval: number, unit: string): string {
  switch (unit) {
    case 'minutes':
      return `0 */${interval} * * * *`
    case 'hours':
      return `0 0 */${interval} * * *`
    case 'days':
      return `0 0 0 */${interval} * *`
    default:
      return `0 */${interval} * * * *`
  }
}
</script>
