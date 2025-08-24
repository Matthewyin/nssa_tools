<template>
  <div class="topology-projects-page">
    <div class="topology-projects">
    <!-- 页面标题和操作栏 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold text-grey-darken-2 mb-2">
          网络拓扑项目管理
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          管理和编辑网络拓扑项目，支持AI智能解析和可视化生成
        </p>
      </div>
      
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-plus"
        @click="showCreateDialog = true"
        elevation="2"
      >
        新建项目
      </v-btn>
    </div>

    <!-- 项目列表 -->
    <v-card elevation="1">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-folder-multiple-outline</v-icon>
        项目列表
        <v-spacer />

        <!-- 批量操作按钮 -->
        <div v-if="selectedProjects.length > 0" class="mr-4">
          <v-btn
            color="warning"
            variant="outlined"
            size="small"
            prepend-icon="mdi-delete-multiple"
            class="mr-2"
            @click="showBatchDeleteDialog = true"
          >
            批量删除 ({{ selectedProjects.length }})
          </v-btn>

          <v-btn
            v-if="hasDeletedProjects"
            color="success"
            variant="outlined"
            size="small"
            prepend-icon="mdi-restore"
            class="mr-2"
            @click="batchRestore"
          >
            批量恢复 ({{ deletedSelectedCount }})
          </v-btn>

          <v-btn
            variant="text"
            size="small"
            @click="clearSelection"
          >
            取消选择
          </v-btn>
        </div>

        <v-chip
          :color="projects.length > 0 ? 'primary' : 'grey'"
          variant="outlined"
          size="small"
        >
          共 {{ pagination.total }} 个项目
        </v-chip>
      </v-card-title>
      
      <v-divider />
      
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center pa-8">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        />
        <p class="text-body-1 text-grey-darken-1 mt-4">加载项目中...</p>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="projects.length === 0" class="text-center pa-12">
        <v-icon size="80" color="grey-lighten-1" class="mb-4">
          mdi-folder-open-outline
        </v-icon>
        <h3 class="text-h6 text-grey-darken-1 mb-2">暂无项目</h3>
        <p class="text-body-2 text-grey-darken-1 mb-4">
          开始创建您的第一个网络拓扑项目
        </p>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="showCreateDialog = true"
        >
          创建项目
        </v-btn>
      </div>
      
      <!-- 批量选择控制 -->
      <div v-if="projects.length > 0" class="pa-4 pb-0">
        <div class="d-flex align-center">
          <v-checkbox
            v-model="selectAll"
            :indeterminate="selectedProjects.length > 0 && selectedProjects.length < projects.length"
            label="全选"
            hide-details
            @change="toggleSelectAll"
          />
          <v-spacer />
          <v-btn-toggle
            v-model="viewMode"
            mandatory
            variant="outlined"
            size="small"
          >
            <v-btn value="all" size="small">
              全部 ({{ allProjectsCount }})
            </v-btn>
            <v-btn value="active" size="small">
              活跃 ({{ activeProjectsCount }})
            </v-btn>
            <v-btn value="deleted" size="small">
              已删除 ({{ deletedProjectsCount }})
            </v-btn>
          </v-btn-toggle>
        </div>
      </div>

      <!-- 项目网格 -->
      <div v-if="filteredProjects.length > 0" class="pa-4">
        <v-row>
          <v-col
            v-for="project in filteredProjects"
            :key="project.id"
            cols="12"
            md="6"
            lg="4"
          >
            <ProjectCard
              :project="project"
              :selected="selectedProjects.includes(project.id)"
              @edit="editProject"
              @delete="deleteProject"
              @view="viewProject"
              @duplicate="duplicateProject"
              @toggle-select="toggleProjectSelection"
            />
          </v-col>
        </v-row>
        
        <!-- 分页 -->
        <div v-if="pagination.pages > 1" class="d-flex justify-center mt-6">
          <v-pagination
            v-model="pagination.page"
            :length="pagination.pages"
            :total-visible="7"
            @update:model-value="loadProjects"
          />
        </div>
      </div>
    </v-card>

    <!-- 创建/编辑项目对话框 -->
    <ProjectDialog
      v-model="showCreateDialog"
      :project="editingProject"
      @saved="onProjectSaved"
    />

    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          确认删除项目
        </v-card-title>
        <v-card-text>
          确定要删除项目 "{{ deletingProject?.project_name }}" 吗？
          <br>
          <span class="text-error">此操作不可撤销。</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            :loading="deleting"
            @click="confirmDelete"
          >
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 批量删除确认对话框 -->
    <v-dialog v-model="showBatchDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          批量删除项目
        </v-card-title>
        <v-card-text>
          <p class="mb-4">
            确定要删除选中的 {{ selectedProjects.length }} 个项目吗？
          </p>

          <v-radio-group v-model="batchDeleteMode" hide-details>
            <v-radio
              label="软删除（可恢复）"
              value="soft"
              color="warning"
            />
            <v-radio
              label="硬删除（永久删除，不可恢复）"
              value="hard"
              color="error"
            />
          </v-radio-group>

          <v-alert
            v-if="batchDeleteMode === 'hard'"
            type="error"
            variant="tonal"
            class="mt-4"
          >
            <strong>警告：</strong>硬删除操作不可撤销，将永久删除项目及其所有版本数据。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showBatchDeleteDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            :color="batchDeleteMode === 'hard' ? 'error' : 'warning'"
            variant="text"
            :loading="batchDeleting"
            @click="confirmBatchDelete"
          >
            {{ batchDeleteMode === 'hard' ? '永久删除' : '删除' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 页面元数据
definePageMeta({
  title: '网络拓扑项目管理',
  description: '管理和编辑网络拓扑项目'
})

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const deleting = ref(false)
const projects = ref([])

// 对话框状态
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingProject = ref(null)
const deletingProject = ref(null)

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0,
  pages: 0
})

// 批量操作相关
const selectedProjects = ref([])
const selectAll = ref(false)
const showBatchDeleteDialog = ref(false)
const batchDeleteMode = ref('soft')
const batchDeleting = ref(false)
const viewMode = ref('all')



// 计算属性
const filteredProjects = computed(() => {
  if (viewMode.value === 'all') return projects.value
  if (viewMode.value === 'active') return projects.value.filter(p => p.status !== 'deleted')
  if (viewMode.value === 'deleted') return projects.value.filter(p => p.status === 'deleted')
  return projects.value
})

const allProjectsCount = computed(() => projects.value.length)
const activeProjectsCount = computed(() => projects.value.filter(p => p.status !== 'deleted').length)
const deletedProjectsCount = computed(() => projects.value.filter(p => p.status === 'deleted').length)

const hasDeletedProjects = computed(() => {
  return selectedProjects.value.some(id => {
    const project = projects.value.find(p => p.id === id)
    return project && project.status === 'deleted'
  })
})

const deletedSelectedCount = computed(() => {
  return selectedProjects.value.filter(id => {
    const project = projects.value.find(p => p.id === id)
    return project && project.status === 'deleted'
  }).length
})

// 加载项目列表
const loadProjects = async () => {
  loading.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    const response = await $topologyApi.projects.getList({
      page: pagination.page,
      limit: pagination.limit,
      status: 'active'
    })

    projects.value = response.data.projects
    pagination.total = response.data.pagination.total
    pagination.pages = response.data.pagination.pages
  } catch (error) {
    console.error('加载项目失败:', error)
    // 显示错误提示
  } finally {
    loading.value = false
  }
}



// 编辑项目
const editProject = (project) => {
  editingProject.value = project
  showCreateDialog.value = true
}

// 查看项目
const viewProject = (project) => {
  router.push(`/topology-editor/${project.id}`)
}

// 删除项目
const deleteProject = (project) => {
  deletingProject.value = project
  showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!deletingProject.value) return
  
  deleting.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    await $topologyApi.projects.delete(deletingProject.value.id)
    
    // 重新加载项目列表
    await loadProjects()
    
    showDeleteDialog.value = false
    deletingProject.value = null
  } catch (error) {
    console.error('删除项目失败:', error)
  } finally {
    deleting.value = false
  }
}

// 复制项目
const duplicateProject = async (project) => {
  try {
    const { $topologyApi } = useNuxtApp()
    await $topologyApi.projects.create({
      project_name: `${project.project_name} - 副本`,
      description: project.description,
      text_content: ''
    })
    
    await loadProjects()
  } catch (error) {
    console.error('复制项目失败:', error)
  }
}

// 项目保存回调
const onProjectSaved = () => {
  showCreateDialog.value = false
  editingProject.value = null
  loadProjects()
}

// 批量操作方法
const toggleProjectSelection = (projectId) => {
  const index = selectedProjects.value.indexOf(projectId)
  if (index > -1) {
    selectedProjects.value.splice(index, 1)
  } else {
    selectedProjects.value.push(projectId)
  }
  updateSelectAllState()
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedProjects.value = filteredProjects.value.map(p => p.id)
  } else {
    selectedProjects.value = []
  }
}

const updateSelectAllState = () => {
  const filteredIds = filteredProjects.value.map(p => p.id)
  const selectedInFiltered = selectedProjects.value.filter(id => filteredIds.includes(id))
  selectAll.value = selectedInFiltered.length === filteredIds.length && filteredIds.length > 0
}

const clearSelection = () => {
  selectedProjects.value = []
  selectAll.value = false
}

// 批量删除
const confirmBatchDelete = async () => {
  if (selectedProjects.value.length === 0) return

  batchDeleting.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    const result = await $topologyApi.projects.batchDelete({
      project_ids: selectedProjects.value,
      hard_delete: batchDeleteMode.value === 'hard'
    })

    console.log('批量删除结果:', result)

    // 重新加载项目列表
    await loadProjects()

    // 清除选择
    clearSelection()
    showBatchDeleteDialog.value = false

    // 显示结果通知
    if (result.data) {
      const { success, failed } = result.data
      if (failed.length > 0) {
        console.warn('部分项目删除失败:', failed)
      }
    }

  } catch (error) {
    console.error('批量删除失败:', error)
  } finally {
    batchDeleting.value = false
  }
}

// 批量恢复
const batchRestore = async () => {
  const deletedProjects = selectedProjects.value.filter(id => {
    const project = projects.value.find(p => p.id === id)
    return project && project.status === 'deleted'
  })

  if (deletedProjects.length === 0) return

  try {
    const { $topologyApi } = useNuxtApp()

    // 逐个恢复项目
    for (const projectId of deletedProjects) {
      await $topologyApi.projects.restore(projectId)
    }

    // 重新加载项目列表
    await loadProjects()

    // 清除选择
    clearSelection()

  } catch (error) {
    console.error('批量恢复失败:', error)
  }
}

// 组件挂载
onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.topology-projects-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 0;
  margin: 0;
}

.topology-projects {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.v-card {
  border-radius: 12px !important;
}

.v-btn {
  border-radius: 8px !important;
}

.v-text-field,
.v-select {
  border-radius: 8px !important;
}
</style>
