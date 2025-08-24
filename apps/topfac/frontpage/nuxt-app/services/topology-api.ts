/**
 * Text-Topology-Service API 客户端
 */

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error_code?: string
  timestamp?: string
  request_id?: string
}

interface Project {
  _id: string
  project_name: string
  description?: string
  status: string
  created_at: string
  updated_at: string
  current_version: number
  version_count: number
  latest_version?: {
    version: number
    created_at: string
    status: string
    has_xml: boolean
  }
}

interface ProjectVersion {
  _id: string
  project_id: string
  version: number
  text_content: string
  parsed_data?: any
  xml_content?: string
  created_at: string
  file_size: number
  status: string
}

interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort_by?: string
}

interface ProjectListResponse {
  projects: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface VersionListResponse {
  versions: ProjectVersion[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

class TopologyApiClient {
  private baseURL: string
  private $fetch: any

  constructor(baseURL: string, $fetch: any) {
    this.baseURL = baseURL
    this.$fetch = $fetch
  }

  // 项目管理 API
  projects = {
    // 获取项目列表
    getList: async (params: PaginationParams = {}): Promise<ApiResponse<ProjectListResponse>> => {
      return await this.$fetch('/api/projects', {
        baseURL: this.baseURL,
        method: 'GET',
        params
      })
    },

    // 获取项目详情
    getById: async (id: string): Promise<ApiResponse<Project>> => {
      return await this.$fetch(`/api/projects/${id}`, {
        baseURL: this.baseURL,
        method: 'GET'
      })
    },

    // 创建项目
    create: async (data: {
      project_name: string
      description?: string
      text_content?: string
    }): Promise<ApiResponse<Project>> => {
      return await this.$fetch('/api/projects', {
        baseURL: this.baseURL,
        method: 'POST',
        body: data
      })
    },

    // 更新项目
    update: async (id: string, data: {
      project_name?: string
      description?: string
      status?: string
    }): Promise<ApiResponse<Project>> => {
      return await this.$fetch(`/api/projects/${id}`, {
        baseURL: this.baseURL,
        method: 'PUT',
        body: data
      })
    },

    // 删除项目
    delete: async (id: string): Promise<ApiResponse> => {
      return await this.$fetch(`/api/projects/${id}`, {
        baseURL: this.baseURL,
        method: 'DELETE'
      })
    },

    // 硬删除项目
    hardDelete: async (id: string): Promise<ApiResponse> => {
      return await this.$fetch(`/api/projects/${id}/hard`, {
        baseURL: this.baseURL,
        method: 'DELETE'
      })
    },

    // 恢复项目
    restore: async (id: string): Promise<ApiResponse> => {
      return await this.$fetch(`/api/projects/${id}/restore`, {
        baseURL: this.baseURL,
        method: 'PATCH'
      })
    },

    // 批量删除项目
    batchDelete: async (data: {
      project_ids: string[]
      hard_delete?: boolean
    }): Promise<ApiResponse<{
      success: Array<{
        project_id: string
        project_name: string
        type: string
        deleted_versions?: number
        deleted_projects?: number
      }>
      failed: Array<{
        project_id: string
        error: string
      }>
      total: number
    }>> => {
      return await this.$fetch('/api/projects/batch-delete', {
        baseURL: this.baseURL,
        method: 'POST',
        body: data
      })
    },

    // 获取项目版本列表
    getVersions: async (id: string, params: PaginationParams = {}): Promise<ApiResponse<VersionListResponse>> => {
      return await this.$fetch(`/api/projects/${id}/versions`, {
        baseURL: this.baseURL,
        method: 'GET',
        params
      })
    },

    // 创建项目新版本
    createVersion: async (id: string, data: {
      text_content: string
    }): Promise<ApiResponse<ProjectVersion>> => {
      return await this.$fetch(`/api/projects/${id}/versions`, {
        baseURL: this.baseURL,
        method: 'POST',
        body: data
      })
    },

    // 处理完整工作流
    processWorkflow: async (id: string, data: {
      text_content: string
    }): Promise<ApiResponse<{
      version_id: string
      version: number
      parsed_data: any
      xml_generated: boolean
      xml_length: number
    }>> => {
      return await this.$fetch(`/api/projects/${id}/process`, {
        baseURL: this.baseURL,
        method: 'POST',
        body: data
      })
    },

    // 获取项目统计
    getStatistics: async (): Promise<ApiResponse<{
      total: number
      active: number
      archived: number
      deleted: number
    }>> => {
      return await this.$fetch('/api/projects/statistics', {
        baseURL: this.baseURL,
        method: 'GET'
      })
    }
  }

  // 版本管理 API
  versions = {
    // 获取版本详情
    getById: async (id: string): Promise<ApiResponse<ProjectVersion>> => {
      return await this.$fetch(`/api/versions/${id}`, {
        baseURL: this.baseURL,
        method: 'GET'
      })
    },

    // 更新版本
    update: async (id: string, data: {
      text_content?: string
      parsed_data?: any
      xml_content?: string
      status?: string
    }): Promise<ApiResponse<ProjectVersion>> => {
      return await this.$fetch(`/api/versions/${id}`, {
        baseURL: this.baseURL,
        method: 'PUT',
        body: data
      })
    },

    // 删除版本
    delete: async (id: string): Promise<ApiResponse> => {
      return await this.$fetch(`/api/versions/${id}`, {
        baseURL: this.baseURL,
        method: 'DELETE'
      })
    },


  }

  // 文本解析 API
  parse = async (data: {
    text_content: string
  }): Promise<ApiResponse<{
    topology_name: string
    regions: any[]
    components: any[]
    connections: any[]
  }>> => {
    return await this.$fetch('/api/parse', {
      baseURL: this.baseURL,
      method: 'POST',
      body: data
    })
  }



  // XML生成 API
  generate = async (data: {
    parsed_data: any
  }): Promise<ApiResponse<{
    xml_content: string
    xml_length: number
  }>> => {
    return await this.$fetch('/api/generate', {
      baseURL: this.baseURL,
      method: 'POST',
      body: data
    })
  }

  // 文件下载 API
  download = async (versionId: string): Promise<void> => {
    const response = await this.$fetch(`/api/download/${versionId}`, {
      baseURL: this.baseURL,
      method: 'GET',
      responseType: 'blob'
    })
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'application/xml' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `topology-${versionId}.drawio`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // 模板管理 API
  templates = {
    // 获取模板列表
    getList: async (params: {
      page?: number
      limit?: number
      category?: string
      search?: string
      sort_by?: string
    } = {}): Promise<ApiResponse<{
      templates: any[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>> => {
      return await this.$fetch('/api/templates', {
        baseURL: this.baseURL,
        method: 'GET',
        params
      })
    },

    // 获取模板分类
    getCategories: async (): Promise<ApiResponse<{
      category: string
      template_count: number
      total_usage: number
    }[]>> => {
      return await this.$fetch('/api/templates/categories', {
        baseURL: this.baseURL,
        method: 'GET'
      })
    },

    // 获取热门模板
    getPopular: async (limit: number = 10): Promise<ApiResponse<any[]>> => {
      return await this.$fetch('/api/templates/popular', {
        baseURL: this.baseURL,
        method: 'GET',
        params: { limit }
      })
    },

    // 创建模板
    create: async (data: {
      template_name: string
      category: string
      description?: string
      default_attributes?: any
      tags?: string[]
      is_public?: boolean
    }): Promise<ApiResponse<any>> => {
      return await this.$fetch('/api/templates', {
        baseURL: this.baseURL,
        method: 'POST',
        body: data
      })
    },

    // 更新模板
    update: async (id: string, data: {
      template_name?: string
      description?: string
      default_attributes?: any
      tags?: string[]
      is_public?: boolean
    }): Promise<ApiResponse<any>> => {
      return await this.$fetch(`/api/templates/${id}`, {
        baseURL: this.baseURL,
        method: 'PUT',
        body: data
      })
    },

    // 删除模板
    delete: async (id: string): Promise<ApiResponse> => {
      return await this.$fetch(`/api/templates/${id}`, {
        baseURL: this.baseURL,
        method: 'DELETE'
      })
    },

    // 增加使用次数
    incrementUsage: async (id: string): Promise<ApiResponse> => {
      return await this.$fetch(`/api/templates/${id}/usage`, {
        baseURL: this.baseURL,
        method: 'POST'
      })
    }
  }



  // 系统状态 API
  status = async (): Promise<ApiResponse<{
    database: {
      connected: boolean
      uri: string
    }
    gemini_api: {
      success: boolean
      message: string
      model: string
      response?: string
    }
    project_statistics: {
      total: number
      active: number
      archived: number
      deleted: number
    }
    service_info: {
      name: string
      version: string
      port: number
    }
  }>> => {
    return await this.$fetch('/api/status', {
      baseURL: this.baseURL,
      method: 'GET'
    })
  }

  // 健康检查 API
  health = async (): Promise<{
    status: string
    service: string
    port: number
    database: string
    timestamp: string
  }> => {
    return await this.$fetch('/health', {
      baseURL: this.baseURL,
      method: 'GET'
    })
  }
}
export { TopologyApiClient }
export type { 
  Project, 
  ProjectVersion, 
  ProjectListResponse, 
  VersionListResponse, 
  PaginationParams,
  ApiResponse 
}

