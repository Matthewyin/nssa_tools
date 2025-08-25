/**
 * Cron任务状态管理
 */
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useCronStore = defineStore('cron', () => {
  // 状态
  const tasks = ref([])
  const loading = ref(false)
  const error = ref('')

  // 获取认证store
  const authStore = useAuthStore()

  // 获取任务列表
  const fetchTasks = async () => {
    if (!authStore.isAuthenticated) {
      error.value = '用户未认证'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = ''

    try {
      const token = await authStore.getIdToken()
      if (!token) {
        throw new Error('无法获取认证令牌')
      }

      const { data } = await $fetch('/api/cron/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      tasks.value = data
      return { success: true, data }
    } catch (err) {
      error.value = err.message || '获取任务列表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 创建任务
  const createTask = async (taskData) => {
    if (!authStore.isAuthenticated) {
      error.value = '用户未认证'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = ''

    try {
      const token = await authStore.getIdToken()
      if (!token) {
        throw new Error('无法获取认证令牌')
      }

      const { data } = await $fetch('/api/cron/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: taskData
      })

      // 添加到本地列表
      tasks.value.unshift(data)
      return { success: true, data }
    } catch (err) {
      error.value = err.message || '创建任务失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新任务
  const updateTask = async (taskId, updateData) => {
    if (!authStore.isAuthenticated) {
      error.value = '用户未认证'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = ''

    try {
      const token = await authStore.getIdToken()
      if (!token) {
        throw new Error('无法获取认证令牌')
      }

      const { data } = await $fetch(`/api/cron/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: updateData
      })

      // 更新本地列表
      const index = tasks.value.findIndex(task => task.id === taskId)
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...updateData }
      }

      return { success: true, data }
    } catch (err) {
      error.value = err.message || '更新任务失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 删除任务
  const deleteTask = async (taskId) => {
    if (!authStore.isAuthenticated) {
      error.value = '用户未认证'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = ''

    try {
      const token = await authStore.getIdToken()
      if (!token) {
        throw new Error('无法获取认证令牌')
      }

      await $fetch(`/api/cron/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // 从本地列表移除
      const index = tasks.value.findIndex(task => task.id === taskId)
      if (index !== -1) {
        tasks.value.splice(index, 1)
      }

      return { success: true }
    } catch (err) {
      error.value = err.message || '删除任务失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 切换任务状态
  const toggleTaskStatus = async (taskId) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) {
      error.value = '任务不存在'
      return { success: false, error: error.value }
    }

    const newStatus = task.status === 'active' ? 'paused' : 'active'
    return await updateTask(taskId, { status: newStatus })
  }

  // 手动触发任务
  const triggerTask = async (taskId) => {
    if (!authStore.isAuthenticated) {
      error.value = '用户未认证'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = ''

    try {
      const token = await authStore.getIdToken()
      if (!token) {
        throw new Error('无法获取认证令牌')
      }

      const { data } = await $fetch(`/api/cron/tasks/${taskId}/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return { success: true, data }
    } catch (err) {
      error.value = err.message || '触发任务失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取任务详情
  const getTask = async (taskId) => {
    if (!authStore.isAuthenticated) {
      error.value = '用户未认证'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = ''

    try {
      const token = await authStore.getIdToken()
      if (!token) {
        throw new Error('无法获取认证令牌')
      }

      const { data } = await $fetch(`/api/cron/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return { success: true, data }
    } catch (err) {
      error.value = err.message || '获取任务详情失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = ''
  }

  // 重置状态
  const reset = () => {
    tasks.value = []
    loading.value = false
    error.value = ''
  }

  return {
    // 状态
    tasks: readonly(tasks),
    loading: readonly(loading),
    error: readonly(error),

    // 方法
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    triggerTask,
    getTask,
    clearError,
    reset
  }
})
