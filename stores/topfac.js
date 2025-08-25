/**
 * Topfac项目状态管理
 */
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useTopfacStore = defineStore('topfac', () => {
  // 状态
  const projects = ref([])
  const currentProject = ref(null)
  const versions = ref([])
  const loading = ref(false)
  const error = ref('')

  // 获取认证store
  const authStore = useAuthStore()

  // 获取项目列表
  const fetchProjects = async () => {
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

      const { data } = await $fetch('/api/topfac/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      projects.value = data
      return { success: true, data }
    } catch (err) {
      error.value = err.message || '获取项目列表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 创建项目
  const createProject = async (projectData) => {
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

      const { data } = await $fetch('/api/topfac/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: projectData
      })

      // 添加到本地列表
      projects.value.unshift(data)
      return { success: true, data }
    } catch (err) {
      error.value = err.message || '创建项目失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新项目
  const updateProject = async (projectId, updateData) => {
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

      const { data } = await $fetch(`/api/topfac/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: updateData
      })

      // 更新本地列表
      const index = projects.value.findIndex(project => project.id === projectId)
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], ...updateData }
      }

      // 更新当前项目
      if (currentProject.value && currentProject.value.id === projectId) {
        currentProject.value = { ...currentProject.value, ...updateData }
      }

      return { success: true, data }
    } catch (err) {
      error.value = err.message || '更新项目失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // AI转换文本
  const convertWithAI = async (conversionData) => {
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

      const { data } = await $fetch('/api/topfac/ai/convert', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: conversionData
      })

      return { success: true, data }
    } catch (err) {
      error.value = err.message || 'AI转换失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 创建项目版本
  const createVersion = async (projectId, versionData) => {
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

      const { data } = await $fetch(`/api/topfac/projects/${projectId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: versionData
      })

      // 添加到版本列表
      versions.value.unshift(data)
      return { success: true, data }
    } catch (err) {
      error.value = err.message || '创建版本失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取项目版本列表
  const fetchVersions = async (projectId) => {
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

      const { data } = await $fetch(`/api/topfac/projects/${projectId}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      versions.value = data
      return { success: true, data }
    } catch (err) {
      error.value = err.message || '获取版本列表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 设置当前项目
  const setCurrentProject = (project) => {
    currentProject.value = project
  }

  // 清除错误
  const clearError = () => {
    error.value = ''
  }

  // 重置状态
  const reset = () => {
    projects.value = []
    currentProject.value = null
    versions.value = []
    loading.value = false
    error.value = ''
  }

  return {
    // 状态
    projects: readonly(projects),
    currentProject: readonly(currentProject),
    versions: readonly(versions),
    loading: readonly(loading),
    error: readonly(error),

    // 方法
    fetchProjects,
    createProject,
    updateProject,
    convertWithAI,
    createVersion,
    fetchVersions,
    setCurrentProject,
    clearError,
    reset
  }
})
