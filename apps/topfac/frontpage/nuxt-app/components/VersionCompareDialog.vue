<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="1200"
    scrollable
  >
    <v-card class="version-compare-dialog">
      <!-- 对话框标题 -->
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-3" color="primary">mdi-compare</v-icon>
        <span class="text-h5 font-weight-bold">版本比较</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>
      
      <v-divider />
      
      <!-- 版本选择 -->
      <div class="version-selector pa-4">
        <v-row>
          <v-col cols="6">
            <v-select
              v-model="selectedVersion1"
              :items="versionOptions"
              label="选择版本 1"
              variant="outlined"
              density="compact"
              @update:model-value="loadVersionData"
            />
          </v-col>
          
          <v-col cols="6">
            <v-select
              v-model="selectedVersion2"
              :items="versionOptions"
              label="选择版本 2"
              variant="outlined"
              density="compact"
              @update:model-value="loadVersionData"
            />
          </v-col>
        </v-row>
      </div>
      
      <v-divider />
      
      <!-- 比较内容 -->
      <v-card-text class="pa-0" style="height: 70vh;">
        <div v-if="loading" class="d-flex justify-center align-center" style="height: 100%;">
          <div class="text-center">
            <v-progress-circular
              indeterminate
              color="primary"
              size="48"
            />
            <p class="text-body-2 text-grey-darken-1 mt-4">加载版本数据中...</p>
          </div>
        </div>
        
        <div v-else-if="!selectedVersion1 || !selectedVersion2" class="d-flex justify-center align-center" style="height: 100%;">
          <div class="text-center">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              mdi-compare
            </v-icon>
            <h4 class="text-h6 text-grey-darken-1 mb-2">选择要比较的版本</h4>
            <p class="text-body-2 text-grey-darken-1">
              请在上方选择两个版本进行比较
            </p>
          </div>
        </div>
        
        <div v-else class="compare-content">
          <v-tabs v-model="activeTab" class="compare-tabs">
            <v-tab value="overview">概览对比</v-tab>
            <v-tab value="text">文本对比</v-tab>
            <v-tab value="data">数据对比</v-tab>
          </v-tabs>
          
          <v-tabs-window v-model="activeTab" class="compare-window">
            <!-- 概览对比 -->
            <v-tabs-window-item value="overview" class="overview-tab">
              <div class="pa-4">
                <v-row>
                  <!-- 版本1信息 -->
                  <v-col cols="6">
                    <v-card variant="outlined" class="version-info-card">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2" color="primary">mdi-numeric-1-circle</v-icon>
                        版本 v{{ version1Data?.version }}
                      </v-card-title>
                      
                      <v-card-text>
                        <div class="info-grid">
                          <div class="info-item">
                            <strong>创建时间：</strong>
                            {{ formatDate(version1Data?.created_at) }}
                          </div>
                          
                          <div class="info-item">
                            <strong>状态：</strong>
                            <v-chip
                              :color="getVersionStatusColor(version1Data?.status)"
                              variant="flat"
                              size="small"
                              class="text-white"
                            >
                              {{ getVersionStatusText(version1Data?.status) }}
                            </v-chip>
                          </div>
                          
                          <div class="info-item">
                            <strong>文本长度：</strong>
                            {{ formatTextLength(version1Data?.text_content?.length || 0) }}
                          </div>
                          
                          <div class="info-item">
                            <strong>文件大小：</strong>
                            {{ formatFileSize(version1Data?.file_size || 0) }}
                          </div>
                          
                          <div class="info-item">
                            <strong>解析状态：</strong>
                            {{ version1Data?.parsed_data ? '已解析' : '未解析' }}
                          </div>
                          
                          <div class="info-item">
                            <strong>XML状态：</strong>
                            {{ version1Data?.xml_content ? '已生成' : '未生成' }}
                          </div>
                        </div>
                        
                        <!-- 解析数据统计 -->
                        <div v-if="version1Data?.parsed_data" class="parsed-stats mt-3">
                          <h4 class="text-subtitle-1 mb-2">解析结果统计</h4>
                          <div class="d-flex align-center">
                            <v-chip
                              size="small"
                              variant="outlined"
                              color="info"
                              class="mr-1"
                            >
                              {{ (version1Data.parsed_data.regions || []).length }} 区域
                            </v-chip>
                            
                            <v-chip
                              size="small"
                              variant="outlined"
                              color="success"
                              class="mr-1"
                            >
                              {{ (version1Data.parsed_data.components || []).length }} 组件
                            </v-chip>
                            
                            <v-chip
                              size="small"
                              variant="outlined"
                              color="warning"
                            >
                              {{ (version1Data.parsed_data.connections || []).length }} 连接
                            </v-chip>
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <!-- 版本2信息 -->
                  <v-col cols="6">
                    <v-card variant="outlined" class="version-info-card">
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2" color="secondary">mdi-numeric-2-circle</v-icon>
                        版本 v{{ version2Data?.version }}
                      </v-card-title>
                      
                      <v-card-text>
                        <div class="info-grid">
                          <div class="info-item">
                            <strong>创建时间：</strong>
                            {{ formatDate(version2Data?.created_at) }}
                          </div>
                          
                          <div class="info-item">
                            <strong>状态：</strong>
                            <v-chip
                              :color="getVersionStatusColor(version2Data?.status)"
                              variant="flat"
                              size="small"
                              class="text-white"
                            >
                              {{ getVersionStatusText(version2Data?.status) }}
                            </v-chip>
                          </div>
                          
                          <div class="info-item">
                            <strong>文本长度：</strong>
                            {{ formatTextLength(version2Data?.text_content?.length || 0) }}
                          </div>
                          
                          <div class="info-item">
                            <strong>文件大小：</strong>
                            {{ formatFileSize(version2Data?.file_size || 0) }}
                          </div>
                          
                          <div class="info-item">
                            <strong>解析状态：</strong>
                            {{ version2Data?.parsed_data ? '已解析' : '未解析' }}
                          </div>
                          
                          <div class="info-item">
                            <strong>XML状态：</strong>
                            {{ version2Data?.xml_content ? '已生成' : '未生成' }}
                          </div>
                        </div>
                        
                        <!-- 解析数据统计 -->
                        <div v-if="version2Data?.parsed_data" class="parsed-stats mt-3">
                          <h4 class="text-subtitle-1 mb-2">解析结果统计</h4>
                          <div class="d-flex align-center">
                            <v-chip
                              size="small"
                              variant="outlined"
                              color="info"
                              class="mr-1"
                            >
                              {{ (version2Data.parsed_data.regions || []).length }} 区域
                            </v-chip>
                            
                            <v-chip
                              size="small"
                              variant="outlined"
                              color="success"
                              class="mr-1"
                            >
                              {{ (version2Data.parsed_data.components || []).length }} 组件
                            </v-chip>
                            
                            <v-chip
                              size="small"
                              variant="outlined"
                              color="warning"
                            >
                              {{ (version2Data.parsed_data.connections || []).length }} 连接
                            </v-chip>
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                
                <!-- 差异摘要 -->
                <div class="diff-summary mt-4">
                  <h4 class="text-h6 mb-3">差异摘要</h4>
                  <v-card variant="outlined">
                    <v-card-text>
                      <div class="summary-grid">
                        <div class="summary-item">
                          <strong>文本长度差异：</strong>
                          <span :class="getTextLengthDiffClass()">
                            {{ getTextLengthDiff() }}
                          </span>
                        </div>
                        
                        <div class="summary-item">
                          <strong>创建时间间隔：</strong>
                          {{ getTimeDiff() }}
                        </div>
                        
                        <div v-if="version1Data?.parsed_data && version2Data?.parsed_data" class="summary-item">
                          <strong>组件数量差异：</strong>
                          <span :class="getComponentCountDiffClass()">
                            {{ getComponentCountDiff() }}
                          </span>
                        </div>
                        
                        <div v-if="version1Data?.parsed_data && version2Data?.parsed_data" class="summary-item">
                          <strong>连接数量差异：</strong>
                          <span :class="getConnectionCountDiffClass()">
                            {{ getConnectionCountDiff() }}
                          </span>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </div>
            </v-tabs-window-item>
            
            <!-- 文本对比 -->
            <v-tabs-window-item value="text" class="text-tab">
              <div class="text-compare pa-4">
                <v-row>
                  <v-col cols="6">
                    <h4 class="text-h6 mb-3">
                      <v-icon class="mr-2" color="primary">mdi-numeric-1-circle</v-icon>
                      版本 v{{ version1Data?.version }} 文本
                    </h4>
                    <v-card variant="outlined" class="text-content-card">
                      <v-card-text>
                        <pre class="text-content">{{ version1Data?.text_content || '暂无内容' }}</pre>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <v-col cols="6">
                    <h4 class="text-h6 mb-3">
                      <v-icon class="mr-2" color="secondary">mdi-numeric-2-circle</v-icon>
                      版本 v{{ version2Data?.version }} 文本
                    </h4>
                    <v-card variant="outlined" class="text-content-card">
                      <v-card-text>
                        <pre class="text-content">{{ version2Data?.text_content || '暂无内容' }}</pre>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
            
            <!-- 数据对比 -->
            <v-tabs-window-item value="data" class="data-tab">
              <div class="data-compare pa-4">
                <v-row>
                  <v-col cols="6">
                    <h4 class="text-h6 mb-3">
                      <v-icon class="mr-2" color="primary">mdi-numeric-1-circle</v-icon>
                      版本 v{{ version1Data?.version }} 解析数据
                    </h4>
                    <v-card variant="outlined" class="data-content-card">
                      <v-card-text>
                        <div v-if="version1Data?.parsed_data" class="parsed-data-text">
                          <pre class="data-content">{{ JSON.stringify(version1Data.parsed_data, null, 2) }}</pre>
                        </div>
                        <div v-else class="text-center pa-4">
                          <v-icon size="48" color="grey-lighten-1" class="mb-2">
                            mdi-database-off-outline
                          </v-icon>
                          <p class="text-body-2 text-grey-darken-1">暂无解析数据</p>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <v-col cols="6">
                    <h4 class="text-h6 mb-3">
                      <v-icon class="mr-2" color="secondary">mdi-numeric-2-circle</v-icon>
                      版本 v{{ version2Data?.version }} 解析数据
                    </h4>
                    <v-card variant="outlined" class="data-content-card">
                      <v-card-text>
                        <div v-if="version2Data?.parsed_data" class="parsed-data-text">
                          <pre class="data-content">{{ JSON.stringify(version2Data.parsed_data, null, 2) }}</pre>
                        </div>
                        <div v-else class="text-center pa-4">
                          <v-icon size="48" color="grey-lighten-1" class="mb-2">
                            mdi-database-off-outline
                          </v-icon>
                          <p class="text-body-2 text-grey-darken-1">暂无解析数据</p>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-card-text>
      
      <!-- 操作按钮 -->
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="$emit('update:modelValue', false)"
        >
          关闭
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// 定义 props
interface Props {
  modelValue: boolean
  versions: any[]
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

// 响应式数据
const loading = ref(false)
const activeTab = ref('overview')
const selectedVersion1 = ref('')
const selectedVersion2 = ref('')
const version1Data = ref(null)
const version2Data = ref(null)

// 计算属性
const versionOptions = computed(() => {
  return props.versions.map(version => ({
    title: `v${version.version} - ${getVersionStatusText(version.status)}`,
    value: version._id
  }))
})

// 监听版本选择变化
watch([selectedVersion1, selectedVersion2], () => {
  loadVersionData()
})

// 加载版本数据
const loadVersionData = async () => {
  if (!selectedVersion1.value || !selectedVersion2.value) return
  
  loading.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    
    const [response1, response2] = await Promise.all([
      $topologyApi.versions.getById(selectedVersion1.value),
      $topologyApi.versions.getById(selectedVersion2.value)
    ])
    
    version1Data.value = response1.data
    version2Data.value = response2.data
  } catch (error) {
    console.error('加载版本数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 工具函数
const getVersionStatusColor = (status: string) => {
  const colors = {
    'draft': 'grey',
    'parsed': 'info',
    'generated': 'success',
    'published': 'primary'
  }
  return colors[status] || 'grey'
}

const getVersionStatusText = (status: string) => {
  const texts = {
    'draft': '草稿',
    'parsed': '已解析',
    'generated': '已生成',
    'published': '已发布'
  }
  return texts[status] || '未知'
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const formatTextLength = (length: number) => {
  if (length < 1000) {
    return `${length} 字符`
  } else {
    return `${(length / 1000).toFixed(1)}K 字符`
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 差异计算函数
const getTextLengthDiff = () => {
  if (!version1Data.value || !version2Data.value) return '0'
  
  const diff = (version2Data.value.text_content?.length || 0) - (version1Data.value.text_content?.length || 0)
  return diff > 0 ? `+${diff}` : `${diff}`
}

const getTextLengthDiffClass = () => {
  const diff = parseInt(getTextLengthDiff())
  if (diff > 0) return 'text-success'
  if (diff < 0) return 'text-error'
  return 'text-grey-darken-1'
}

const getTimeDiff = () => {
  if (!version1Data.value || !version2Data.value) return '0'
  
  const time1 = new Date(version1Data.value.created_at).getTime()
  const time2 = new Date(version2Data.value.created_at).getTime()
  const diffMs = Math.abs(time2 - time1)
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffDays > 0) return `${diffDays} 天`
  if (diffHours > 0) return `${diffHours} 小时`
  return `${diffMinutes} 分钟`
}

const getComponentCountDiff = () => {
  if (!version1Data.value?.parsed_data || !version2Data.value?.parsed_data) return '0'
  
  const count1 = (version1Data.value.parsed_data.components || []).length
  const count2 = (version2Data.value.parsed_data.components || []).length
  const diff = count2 - count1
  
  return diff > 0 ? `+${diff}` : `${diff}`
}

const getComponentCountDiffClass = () => {
  const diff = parseInt(getComponentCountDiff())
  if (diff > 0) return 'text-success'
  if (diff < 0) return 'text-error'
  return 'text-grey-darken-1'
}

const getConnectionCountDiff = () => {
  if (!version1Data.value?.parsed_data || !version2Data.value?.parsed_data) return '0'
  
  const count1 = (version1Data.value.parsed_data.connections || []).length
  const count2 = (version2Data.value.parsed_data.connections || []).length
  const diff = count2 - count1
  
  return diff > 0 ? `+${diff}` : `${diff}`
}

const getConnectionCountDiffClass = () => {
  const diff = parseInt(getConnectionCountDiff())
  if (diff > 0) return 'text-success'
  if (diff < 0) return 'text-error'
  return 'text-grey-darken-1'
}
</script>

<style scoped>
.version-compare-dialog {
  border-radius: 16px !important;
}

.version-selector {
  background: #f8f9fa;
}

.compare-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.compare-tabs {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.compare-window {
  flex: 1;
  overflow: auto;
}

.version-info-card {
  border-radius: 12px !important;
  height: 100%;
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.summary-grid {
  display: grid;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.text-content-card,
.data-content-card {
  border-radius: 8px !important;
  height: 500px;
}

.text-content {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 450px;
  overflow: auto;
}

.parsed-data-text {
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  max-height: 450px;
  overflow: auto;
}

.data-content {
  margin: 0;
  padding: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: #2d3748;
  background: transparent;
}

.v-chip {
  border-radius: 6px !important;
}

.v-btn {
  border-radius: 8px !important;
}

.v-card {
  border-radius: 8px !important;
}
</style>
