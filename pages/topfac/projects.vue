<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            项目管理
          </h1>
          <p class="text-gray-600 dark:text-gray-300">
            管理您的网络拓扑项目和版本历史
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <NuxtLink to="/topfac" class="apple-button-secondary">
            <span class="material-symbols-outlined mr-2">arrow_back</span>
            返回
          </NuxtLink>
          <button @click="createNewProject" class="apple-button-primary">
            <span class="material-symbols-outlined mr-2">add</span>
            新建项目
          </button>
        </div>
      </div>

      <!-- 项目列表 -->
      <div class="apple-card p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            我的项目
          </h2>
          <div class="flex items-center space-x-4">
            <!-- 搜索框 -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索项目..."
                class="apple-input pl-10 w-64"
              >
              <span class="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                search
              </span>
            </div>
            <!-- 排序选择 -->
            <select v-model="sortBy" class="apple-input">
              <option value="updated">最近更新</option>
              <option value="created">创建时间</option>
              <option value="name">项目名称</option>
            </select>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="projects.length === 0" class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span class="material-symbols-outlined text-gray-400 text-2xl">folder</span>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            暂无项目
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            创建您的第一个网络拓扑项目
          </p>
          <button @click="createNewProject" class="apple-button-primary">
            <span class="material-symbols-outlined mr-2">add</span>
            创建项目
          </button>
        </div>

        <!-- 项目网格 -->
        <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="project in filteredProjects"
            :key="project.id"
            class="apple-card p-6 cursor-pointer group hover:shadow-apple-lg transition-all duration-200"
            @click="openProject(project)"
          >
            <!-- 项目图标和状态 -->
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-apple flex items-center justify-center">
                <span class="material-symbols-outlined text-white">hub</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  {{ project.status }}
                </span>
                <button
                  @click.stop="showProjectMenu(project)"
                  class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span class="material-symbols-outlined text-gray-400">more_vert</span>
                </button>
              </div>
            </div>

            <!-- 项目信息 -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ project.name }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                {{ project.description || '暂无描述' }}
              </p>
            </div>

            <!-- 项目统计 -->
            <div class="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ project.versions }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">版本</div>
              </div>
              <div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ project.devices }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">设备</div>
              </div>
              <div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ project.connections }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">连接</div>
              </div>
            </div>

            <!-- 时间信息 -->
            <div class="text-xs text-gray-500 dark:text-gray-400">
              <div>创建: {{ formatDate(project.createdAt) }}</div>
              <div>更新: {{ formatDate(project.updatedAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useTopfacStore } from '~/stores/topfac'

// 页面元数据
useHead({
  title: '项目管理 - 智能网络拓扑生成',
  meta: [
    { name: 'description', content: '管理网络拓扑项目，查看版本历史和项目统计' }
  ]
})

// 使用状态管理
const authStore = useAuthStore()
const topfacStore = useTopfacStore()

// 状态
const { projects, loading } = storeToRefs(topfacStore)
const { isAuthenticated } = storeToRefs(authStore)

// 响应式数据
const searchQuery = ref('')
const sortBy = ref('updated')

// 计算属性
const filteredProjects = computed(() => {
  let filtered = projects.value

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(project =>
      project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'created':
        return b.createdAt - a.createdAt
      case 'updated':
      default:
        return b.updatedAt - a.updatedAt
    }
  })

  return filtered
})

// 方法
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const createNewProject = () => {
  navigateTo('/topfac/editor')
}

const openProject = (project: any) => {
  navigateTo(`/topfac/editor?project=${project.id}`)
}

const showProjectMenu = (project: any) => {
  // 显示项目操作菜单
  const actions = [
    { label: '编辑', action: () => openProject(project) },
    { label: '导出', action: () => exportProject(project) },
    { label: '删除', action: () => confirmDeleteProject(project) }
  ]

  // TODO: 实现上下文菜单
  console.log('项目操作:', project.name, actions)
}

const confirmDeleteProject = async (project: any) => {
  if (confirm(`确定要删除项目"${project.name}"吗？此操作不可撤销。`)) {
    // TODO: 实现删除项目功能
    console.log('删除项目:', project.name)
  }
}

const exportProject = (project: any) => {
  // TODO: 实现导出项目功能
  console.log('导出项目:', project.name)
}

// 页面初始化
onMounted(async () => {
  // 初始化认证状态
  authStore.initAuth()

  // 如果已登录，获取项目列表
  if (isAuthenticated.value) {
    await topfacStore.fetchProjects()
  }
})

// 监听认证状态变化
watch(isAuthenticated, async (authenticated) => {
  if (authenticated) {
    await topfacStore.fetchProjects()
  } else {
    topfacStore.reset()
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
