<template>
  <div class="version-history">
    <!-- 版本历史标题 -->
    <div class="version-header d-flex align-center justify-space-between mb-4">
      <h3 class="text-h6 font-weight-bold">
        <v-icon class="mr-2" color="info">mdi-history</v-icon>
        版本历史
      </h3>
      
      <div class="d-flex align-center">
        <v-btn
          variant="outlined"
          size="small"
          prepend-icon="mdi-refresh"
          @click="loadVersions"
          :loading="loading"
          class="mr-2"
        >
          刷新
        </v-btn>
        
        <v-btn
          color="primary"
          size="small"
          prepend-icon="mdi-plus"
          @click="createNewVersion"
        >
          新建版本
        </v-btn>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
      <p class="text-body-2 text-grey-darken-1 mt-4">加载版本历史中...</p>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="versions.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-history
      </v-icon>
      <h4 class="text-h6 text-grey-darken-1 mb-2">暂无版本历史</h4>
      <p class="text-body-2 text-grey-darken-1 mb-4">
        开始创建您的第一个版本
      </p>
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-plus"
        @click="createNewVersion"
      >
        创建版本
      </v-btn>
    </div>
    
    <!-- 版本列表 -->
    <div v-else class="versions-list">
      <!-- 版本网格布局 -->
      <v-row class="version-grid">
        <v-col
          v-for="(version, index) in sortedVersions"
          :key="version._id"
          cols="12"
          sm="6"
          md="3"
          class="version-col"
        >
          <v-card
            class="version-card"
            :class="{ 'current-version': version._id === currentVersionId }"
            variant="outlined"
            @click="selectVersion(version)"
          >
            <!-- 版本头部 -->
            <v-card-title class="d-flex align-center pa-4">
              <div class="flex-grow-1">
                <div class="d-flex align-center">
                  <h4 class="text-h6 font-weight-bold mr-2">
                    v{{ version.version }}
                  </h4>
                  
                  <v-chip
                    :color="getVersionStatusColor(version.status)"
                    variant="flat"
                    size="small"
                    class="text-white mr-2"
                  >
                    {{ getVersionStatusText(version.status) }}
                  </v-chip>
                  
                  <v-chip
                    v-if="version._id === currentVersionId"
                    color="success"
                    variant="outlined"
                    size="small"
                  >
                    当前版本
                  </v-chip>
                </div>
                
                <p class="text-body-2 text-grey-darken-1 mb-0 mt-1">
                  {{ formatDate(version.created_at) }}
                </p>
              </div>
              
              <!-- 版本操作菜单 -->
              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    v-bind="props"
                    @click.stop
                  />
                </template>
                
                <v-list density="compact">
                  <v-list-item
                    v-if="version._id !== currentVersionId"
                    prepend-icon="mdi-check"
                    title="切换到此版本"
                    @click="switchToVersion(version)"
                  />
                  <v-list-item
                    prepend-icon="mdi-content-copy"
                    title="复制版本"
                    @click="duplicateVersion(version)"
                  />
                  <v-list-item
                    prepend-icon="mdi-download"
                    title="下载"
                    @click="downloadVersion(version)"
                    :disabled="!version.xml_content"
                  />
                  <v-divider />
                  <v-list-item
                    prepend-icon="mdi-delete"
                    title="删除版本"
                    class="text-error"
                    @click="deleteVersion(version)"
                    :disabled="version._id === currentVersionId || versions.length === 1"
                  />
                </v-list>
              </v-menu>
            </v-card-title>
            
            <!-- 版本内容 -->
            <v-card-text class="pa-4 pt-0">
              <!-- 版本统计 -->
              <div class="version-stats mb-3">
                <v-row dense>
                  <v-col cols="4">
                    <div class="stat-item">
                      <div class="text-caption text-grey-darken-1">文本长度</div>
                      <div class="text-body-2 font-weight-medium">
                        {{ formatTextLength(version.text_content?.length || 0) }}
                      </div>
                    </div>
                  </v-col>
                  
                  <v-col cols="4">
                    <div class="stat-item">
                      <div class="text-caption text-grey-darken-1">文件大小</div>
                      <div class="text-body-2 font-weight-medium">
                        {{ formatFileSize(version.file_size || 0) }}
                      </div>
                    </div>
                  </v-col>
                  
                  <v-col cols="4">
                    <div class="stat-item">
                      <div class="text-caption text-grey-darken-1">处理状态</div>
                      <div class="text-body-2 font-weight-medium">
                        {{ version.xml_content ? '已生成' : '未生成' }}
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </div>
              
              <!-- 版本变更摘要 -->
              <div v-if="version.change_summary" class="change-summary mb-3">
                <div class="text-caption text-grey-darken-1 mb-1">变更摘要：</div>
                <p class="text-body-2">{{ version.change_summary }}</p>
              </div>
              
              <!-- 解析数据预览 -->
              <div v-if="version.parsed_data" class="parsed-preview">
                <div class="text-caption text-grey-darken-1 mb-2">解析结果：</div>
                <div class="d-flex align-center flex-wrap">
                  <v-chip
                    size="x-small"
                    variant="outlined"
                    color="purple"
                    class="mr-1 mb-1"
                  >
                    {{ getEnvironmentCount(version.parsed_data) }} 环境
                  </v-chip>

                  <v-chip
                    size="x-small"
                    variant="outlined"
                    color="info"
                    class="mr-1 mb-1"
                  >
                    {{ getDatacenterCount(version.parsed_data) }} 数据中心
                  </v-chip>

                  <v-chip
                    size="x-small"
                    variant="outlined"
                    color="warning"
                    class="mr-1 mb-1"
                  >
                    {{ getAreaCount(version.parsed_data) }} 网络区域
                  </v-chip>

                  <v-chip
                    size="x-small"
                    variant="outlined"
                    color="success"
                    class="mr-1 mb-1"
                  >
                    {{ getComponentCount(version.parsed_data) }} 设备
                  </v-chip>

                  <v-chip
                    size="x-small"
                    variant="outlined"
                    color="orange"
                    class="mr-1 mb-1"
                  >
                    {{ getConnectionCount(version.parsed_data) }} 连接
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 分页 -->
      <div v-if="pagination.pages > 1" class="d-flex justify-center mt-6">
        <v-pagination
          v-model="pagination.page"
          :length="pagination.pages"
          :total-visible="5"
          @update:model-value="loadVersions"
        />
      </div>
    </div>
    
    <!-- 版本比较对话框 -->
    <VersionCompareDialog
      v-model="showCompareDialog"
      :versions="selectedVersionsForCompare"
      @close="showCompareDialog = false"
    />
    
    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          确认删除版本
        </v-card-title>
        <v-card-text>
          确定要删除版本 v{{ deletingVersion?.version }} 吗？
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

// 定义 props
interface Props {
  projectId: string
  currentVersionId?: string
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  versionSelected: [version: any]
  versionSwitched: [version: any]
  newVersionCreated: []
}>()

// 响应式数据
const loading = ref(false)
const deleting = ref(false)
const versions = ref([])
const showCompareDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedVersionsForCompare = ref([])
const deletingVersion = ref(null)

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 16, // 增加每页显示数量以适应4列布局
  total: 0,
  pages: 0
})

// 计算属性：按版本号降序排序的版本列表
const sortedVersions = computed(() => {
  return [...versions.value].sort((a, b) => {
    // 按版本号降序排序（新版本在前）
    return (b.version || 0) - (a.version || 0)
  })
})

// 加载版本列表
const loadVersions = async () => {
  loading.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    const response = await $topologyApi.projects.getVersions(props.projectId, {
      page: pagination.page,
      limit: pagination.limit
    })
    
    versions.value = response.data.versions
    pagination.total = response.data.pagination.total
    pagination.pages = response.data.pagination.pages
  } catch (error) {
    console.error('加载版本历史失败:', error)
  } finally {
    loading.value = false
  }
}

// 选择版本
const selectVersion = (version: any) => {
  emit('versionSelected', version)
}

// 切换到版本
const switchToVersion = (version: any) => {
  emit('versionSwitched', version)
}

// 创建新版本
const createNewVersion = () => {
  emit('newVersionCreated')
}

// 复制版本
const duplicateVersion = async (version: any) => {
  try {
    const { $topologyApi } = useNuxtApp()
    await $topologyApi.projects.createVersion(props.projectId, {
      text_content: version.text_content,
      change_summary: `复制自版本 v${version.version}`
    })
    
    await loadVersions()
  } catch (error) {
    console.error('复制版本失败:', error)
  }
}

// 下载版本
const downloadVersion = async (version: any) => {
  try {
    const { $topologyApi } = useNuxtApp()
    await $topologyApi.download(version._id)
  } catch (error) {
    console.error('下载版本失败:', error)
  }
}

// 删除版本
const deleteVersion = (version: any) => {
  deletingVersion.value = version
  showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!deletingVersion.value) return
  
  deleting.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    await $topologyApi.versions.delete(deletingVersion.value._id)
    
    await loadVersions()
    showDeleteDialog.value = false
    deletingVersion.value = null
  } catch (error) {
    console.error('删除版本失败:', error)
  } finally {
    deleting.value = false
  }
}

// 获取版本状态颜色
const getVersionStatusColor = (status: string) => {
  const colors = {
    'draft': 'grey',
    'parsed': 'info',
    'generated': 'success',
    'published': 'primary'
  }
  return colors[status] || 'grey'
}

// 获取版本状态图标
const getVersionStatusIcon = (status: string) => {
  const icons = {
    'draft': 'mdi-file-document-outline',
    'parsed': 'mdi-cog',
    'generated': 'mdi-check-circle',
    'published': 'mdi-publish'
  }
  return icons[status] || 'mdi-help'
}

// 获取版本状态文本
const getVersionStatusText = (status: string) => {
  const texts = {
    'draft': '草稿',
    'parsed': '已解析',
    'generated': '已生成',
    'published': '已发布'
  }
  return texts[status] || '未知'
}

// 格式化日期为北京时间
const formatDate = (dateString: string) => {
  if (!dateString) return ''

  // 确保时间字符串被正确识别为UTC时间
  let utcTimeString = dateString
  if (!dateString.endsWith('Z') && !dateString.includes('+')) {
    // 如果没有时区标识，添加Z表示UTC时间
    utcTimeString = dateString + 'Z'
  }

  const date = new Date(utcTimeString)

  // 直接使用 toLocaleString 转换为北京时间，然后手动格式化
  const beijingTimeString = date.toLocaleString('sv-SE', {
    timeZone: 'Asia/Shanghai'
  })

  // sv-SE 格式返回 "YYYY-MM-DD HH:mm:ss"，正好是我们需要的格式
  return beijingTimeString
}

// 格式化文本长度
const formatTextLength = (length: number) => {
  if (length < 1000) {
    return `${length} 字符`
  } else {
    return `${(length / 1000).toFixed(1)}K 字符`
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 数据统计函数（与ParsedDataViewer保持一致）
const getEnvironmentCount = (parsedData: any) => {
  if (parsedData?.statistics?.environment_count !== undefined) {
    return parsedData.statistics.environment_count
  }
  return (parsedData?.environments || []).length
}

const getDatacenterCount = (parsedData: any) => {
  if (parsedData?.statistics?.datacenter_count !== undefined) {
    return parsedData.statistics.datacenter_count
  }

  let count = 0
  if (parsedData?.environments) {
    for (const env of parsedData.environments) {
      count += (env.datacenters || []).length
    }
  }
  return count
}

const getAreaCount = (parsedData: any) => {
  if (parsedData?.statistics?.area_count !== undefined) {
    return parsedData.statistics.area_count
  }

  let count = 0
  if (parsedData?.environments) {
    for (const env of parsedData.environments) {
      if (env.datacenters) {
        for (const dc of env.datacenters) {
          count += (dc.areas || []).length
        }
      }
    }
  }
  return count
}

const getComponentCount = (parsedData: any) => {
  if (parsedData?.statistics?.component_count !== undefined) {
    return parsedData.statistics.component_count
  }
  return (parsedData?.components || []).length
}

const getConnectionCount = (parsedData: any) => {
  if (parsedData?.statistics?.connection_count !== undefined) {
    return parsedData.statistics.connection_count
  }
  return (parsedData?.connections || []).length
}

// 组件挂载
onMounted(() => {
  loadVersions()
})
</script>

<style scoped>
.version-history {
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 确保容器有明确的高度限制 */
  overflow: hidden;
}

.version-header {
  flex-shrink: 0;
  padding: 16px;
  background: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.versions-list {
  flex: 1;
  overflow: auto;
  /* 设置最大高度，确保容器内滚动 */
  max-height: calc(100vh - 350px);
  /* 确保列表容器能够正确计算高度 */
  min-height: 0;
  padding: 16px;
}

.version-grid {
  margin: 0;
  /* 确保网格布局正确显示 */
}

.version-col {
  padding: 8px;
  /* 确保版本卡片之间有适当间距 */
}

.version-card {
  border-radius: 12px !important;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  /* 确保卡片有明确的边界和适当的间距 */
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
  /* 确保卡片在网格中高度一致 */
  display: flex;
  flex-direction: column;
}

.version-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  transform: translateY(-2px);
}

.version-card.current-version {
  border-color: #1976D2 !important;
  background: rgba(25, 118, 210, 0.02);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

.version-stats {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 12px;
}

.stat-item {
  text-align: center;
}

.change-summary {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  padding: 8px;
}

.parsed-preview {
  margin-top: 12px;
}

/* 响应式设计 */
@media (max-width: 960px) {
  .version-col {
    /* 在中等屏幕上显示2列 */
    flex: 0 0 50%;
    max-width: 50%;
  }
}

@media (max-width: 600px) {
  .version-col {
    /* 在小屏幕上显示1列 */
    flex: 0 0 100%;
    max-width: 100%;
  }

  .versions-list {
    padding: 8px;
  }

  .version-col {
    padding: 4px;
  }
}

.parsed-preview {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  padding: 8px;
}

.v-chip {
  border-radius: 6px !important;
}

.v-btn {
  border-radius: 6px !important;
}
</style>
