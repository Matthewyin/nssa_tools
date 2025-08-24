export interface TopologyProject {
  id?: string
  name: string
  description?: string
  originalText: string
  convertedText: string
  topologyData?: any
  drawioXml?: string
  status: 'draft' | 'active' | 'archived'
  versions: number
  devices: number
  connections: number
  createdAt: number
  updatedAt: number
}

export const useTopfac = () => {
  const projects = ref<TopologyProject[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // AI转换
  const convertWithAI = async (text: string, provider: string, apiKey: string) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch('/api/topfac/convert', {
        method: 'POST',
        body: {
          text,
          provider,
          apiKey
        }
      })

      if (response.success) {
        return { success: true, result: response.result }
      } else {
        throw new Error('AI转换失败')
      }
    } catch (err: any) {
      error.value = err.message || 'AI转换失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 生成拓扑图
  const generateTopology = async (convertedText: string) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch('/api/topfac/generate', {
        method: 'POST',
        body: {
          convertedText
        }
      })

      if (response.success) {
        return { 
          success: true, 
          topology: response.topology,
          drawioXml: response.drawioXml
        }
      } else {
        throw new Error('拓扑生成失败')
      }
    } catch (err: any) {
      error.value = err.message || '拓扑生成失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 保存项目到localStorage (临时方案，后续可迁移到Firestore)
  const saveProject = (project: Omit<TopologyProject, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const projects = getStoredProjects()
      const now = Date.now()
      
      const newProject: TopologyProject = {
        ...project,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      }

      projects.push(newProject)
      localStorage.setItem('topfac_projects', JSON.stringify(projects))
      
      // 更新本地状态
      loadProjects()
      
      return { success: true, project: newProject }
    } catch (err: any) {
      error.value = err.message || '保存项目失败'
      return { success: false, error: error.value }
    }
  }

  // 更新项目
  const updateProject = (projectId: string, updates: Partial<TopologyProject>) => {
    try {
      const projects = getStoredProjects()
      const index = projects.findIndex(p => p.id === projectId)
      
      if (index === -1) {
        throw new Error('项目不存在')
      }

      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: Date.now()
      }

      localStorage.setItem('topfac_projects', JSON.stringify(projects))
      
      // 更新本地状态
      loadProjects()
      
      return { success: true, project: projects[index] }
    } catch (err: any) {
      error.value = err.message || '更新项目失败'
      return { success: false, error: error.value }
    }
  }

  // 删除项目
  const deleteProject = (projectId: string) => {
    try {
      const projects = getStoredProjects()
      const filteredProjects = projects.filter(p => p.id !== projectId)
      
      localStorage.setItem('topfac_projects', JSON.stringify(filteredProjects))
      
      // 更新本地状态
      loadProjects()
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || '删除项目失败'
      return { success: false, error: error.value }
    }
  }

  // 加载项目列表
  const loadProjects = () => {
    try {
      const stored = getStoredProjects()
      projects.value = stored.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (err: any) {
      error.value = err.message || '加载项目失败'
    }
  }

  // 获取存储的项目
  const getStoredProjects = (): TopologyProject[] => {
    if (process.client) {
      const stored = localStorage.getItem('topfac_projects')
      return stored ? JSON.parse(stored) : []
    }
    return []
  }

  // 生成ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 下载DrawIO文件
  const downloadDrawIO = (project: TopologyProject) => {
    if (!project.drawioXml) {
      error.value = '没有可下载的拓扑图'
      return
    }

    const blob = new Blob([project.drawioXml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}.drawio`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导出项目
  const exportProject = (project: TopologyProject) => {
    const exportData = {
      project,
      exportTime: new Date().toISOString(),
      version: '1.0'
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}-export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入项目
  const importProject = (file: File): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          
          if (data.project) {
            const result = saveProject({
              ...data.project,
              name: `${data.project.name} (导入)`
            })
            resolve(result)
          } else {
            resolve({ success: false, error: '无效的项目文件' })
          }
        } catch (err: any) {
          resolve({ success: false, error: '文件解析失败' })
        }
      }
      
      reader.onerror = () => {
        resolve({ success: false, error: '文件读取失败' })
      }
      
      reader.readAsText(file)
    })
  }

  // 获取项目统计
  const getProjectStats = computed(() => {
    const total = projects.value.length
    const active = projects.value.filter(p => p.status === 'active').length
    const draft = projects.value.filter(p => p.status === 'draft').length
    const archived = projects.value.filter(p => p.status === 'archived').length
    
    return { total, active, draft, archived }
  })

  return {
    projects: readonly(projects),
    loading: readonly(loading),
    error: readonly(error),
    getProjectStats,
    convertWithAI,
    generateTopology,
    saveProject,
    updateProject,
    deleteProject,
    loadProjects,
    downloadDrawIO,
    exportProject,
    importProject
  }
}
