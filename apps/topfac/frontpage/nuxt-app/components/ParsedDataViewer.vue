<template>
  <div class="parsed-data-viewer">
    <!-- 加载状态 -->
    <div v-if="loading" class="data-loading">
      <div class="text-center pa-8">
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
        />
        <p class="text-body-2 text-grey-darken-1 mt-4">解析数据中...</p>
      </div>
    </div>
    
    <!-- 无数据状态 -->
    <div v-else-if="!parsedData" class="data-empty">
      <div class="text-center pa-12">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          mdi-database-outline
        </v-icon>
        <h4 class="text-h6 text-grey-darken-1 mb-2">暂无解析数据</h4>
        <p class="text-body-2 text-grey-darken-1 mb-4">
          请先输入拓扑文本并进行解析
        </p>
      </div>
    </div>
    
    <!-- 解析数据展示 -->
    <div v-else class="data-content">
      <!-- 数据概览 - 固定区域 -->
      <div class="data-header">
        <div class="pa-4">
          <!-- 数据概览 -->
          <div class="data-overview mb-6">
          <h3 class="text-h6 font-weight-bold mb-4">解析数据概览</h3>
          <v-row>
            <v-col cols="6" md="2">
              <v-card variant="outlined" class="text-center pa-3">
                <v-icon color="purple" size="32" class="mb-2">mdi-earth</v-icon>
                <div class="text-h6 font-weight-bold">{{ environmentCount }}</div>
                <div class="text-caption text-grey-darken-1">环境</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="2">
              <v-card variant="outlined" class="text-center pa-3">
                <v-icon color="primary" size="32" class="mb-2">mdi-domain</v-icon>
                <div class="text-h6 font-weight-bold">{{ datacenterCount }}</div>
                <div class="text-caption text-grey-darken-1">数据中心</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="2">
              <v-card variant="outlined" class="text-center pa-3">
                <v-icon color="info" size="32" class="mb-2">mdi-folder-outline</v-icon>
                <div class="text-h6 font-weight-bold">{{ areaCount }}</div>
                <div class="text-caption text-grey-darken-1">网络区域</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="2">
              <v-card variant="outlined" class="text-center pa-3">
                <v-icon color="success" size="32" class="mb-2">mdi-router</v-icon>
                <div class="text-h6 font-weight-bold">{{ componentCount }}</div>
                <div class="text-caption text-grey-darken-1">设备</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="2">
              <v-card variant="outlined" class="text-center pa-3">
                <v-icon color="warning" size="32" class="mb-2">mdi-connection</v-icon>
                <div class="text-h6 font-weight-bold">{{ connectionCount }}</div>
                <div class="text-caption text-grey-darken-1">连接</div>
              </v-card>
            </v-col>
          </v-row>
        </div>

          <!-- 详细数据标签页 -->
          <v-tabs v-model="activeTab" class="mb-4" show-arrows>
            <v-tab value="environments">环境</v-tab>
            <v-tab value="datacenters">数据中心</v-tab>
            <v-tab value="areas">网络区域</v-tab>
            <v-tab value="devices">设备</v-tab>
            <v-tab value="connections">连接</v-tab>
            <v-tab value="raw">原始数据</v-tab>
          </v-tabs>
        </div>
      </div>

      <!-- 选项卡内容 - 可滚动区域 -->
      <div class="data-tabs-content">
        <v-tabs-window v-model="activeTab">
          <!-- 环境 -->
          <v-tabs-window-item value="environments">
            <div class="environments-section tab-content-container">
              <div v-if="!parsedData.environments || parsedData.environments.length === 0" class="text-center pa-8">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-earth</v-icon>
                <p class="text-body-2 text-grey-darken-1">暂无环境数据</p>
              </div>

              <div v-else>
                <v-card
                  v-for="(environment, index) in parsedData.environments"
                  :key="`env-${index}`"
                  variant="outlined"
                  class="mb-3"
                >
                  <v-card-title class="d-flex align-center">
                    <v-icon class="mr-2" color="purple">mdi-earth</v-icon>
                    {{ environment.environment_name || `环境 ${index + 1}` }}
                    <v-spacer />
                    <v-chip size="small" color="purple" variant="outlined">
                      环境
                    </v-chip>
                  </v-card-title>

                  <v-card-text>
                    <div class="mb-2">
                      <strong>数据中心数量：</strong>{{ environment.datacenters?.length || 0 }}
                    </div>

                    <div v-if="environment.datacenters && environment.datacenters.length > 0" class="mb-2">
                      <strong>包含数据中心：</strong>
                      <v-chip
                        v-for="datacenter in environment.datacenters"
                        :key="datacenter.datacenter_name"
                        size="small"
                        variant="outlined"
                        color="primary"
                        class="mr-1 mt-1"
                      >
                        {{ datacenter.datacenter_name }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- 数据中心 -->
          <v-tabs-window-item value="datacenters">
            <div class="datacenters-section tab-content-container">
              <div v-if="flatDatacenters.length === 0" class="text-center pa-8">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-domain</v-icon>
                <p class="text-body-2 text-grey-darken-1">暂无数据中心数据</p>
              </div>

              <div v-else>
                <v-card
                  v-for="(datacenter, index) in flatDatacenters"
                  :key="`dc-${index}`"
                  variant="outlined"
                  class="mb-3"
                >
                  <v-card-title class="d-flex align-center">
                    <v-icon class="mr-2" color="primary">mdi-domain</v-icon>
                    {{ datacenter.datacenter_name || `数据中心 ${index + 1}` }}
                    <v-spacer />
                    <v-chip size="small" color="primary" variant="outlined">
                      数据中心
                    </v-chip>
                  </v-card-title>

                  <v-card-text>
                    <div class="mb-2">
                      <strong>所属环境：</strong>
                      <v-chip size="small" color="purple" variant="outlined">
                        {{ datacenter.environment_name }}
                      </v-chip>
                    </div>

                    <div class="mb-2">
                      <strong>完整路径：</strong>{{ datacenter.environment_name }}/{{ datacenter.datacenter_name }}
                    </div>

                    <div class="mb-2">
                      <strong>区域数量：</strong>{{ datacenter.areas?.length || 0 }}
                    </div>

                    <div v-if="datacenter.areas && datacenter.areas.length > 0" class="mb-2">
                      <strong>包含区域：</strong>
                      <v-chip
                        v-for="area in datacenter.areas"
                        :key="area.area_name"
                        size="small"
                        variant="outlined"
                        color="info"
                        class="mr-1 mt-1"
                      >
                        {{ area.area_name }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- 网络区域 -->
          <v-tabs-window-item value="areas">
            <div class="areas-section tab-content-container">
              <div v-if="flatAreas.length === 0" class="text-center pa-8">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-folder-outline</v-icon>
                <p class="text-body-2 text-grey-darken-1">暂无网络区域数据</p>
              </div>

              <div v-else>
                <v-card
                  v-for="(area, index) in flatAreas"
                  :key="`area-${index}`"
                  variant="outlined"
                  class="mb-3"
                >
                  <v-card-title class="d-flex align-center">
                    <v-icon class="mr-2" color="info">mdi-folder-outline</v-icon>
                    {{ area.area_name || `区域 ${index + 1}` }}
                    <v-spacer />
                    <v-chip size="small" color="info" variant="outlined">
                      网络区域
                    </v-chip>
                  </v-card-title>

                  <v-card-text>
                    <div class="mb-2">
                      <strong>所属环境：</strong>
                      <v-chip size="small" color="purple" variant="outlined">
                        {{ area.environment_name }}
                      </v-chip>
                    </div>

                    <div class="mb-2">
                      <strong>所属数据中心：</strong>
                      <v-chip size="small" color="primary" variant="outlined">
                        {{ area.datacenter_name }}
                      </v-chip>
                    </div>

                    <div class="mb-2">
                      <strong>完整路径：</strong>{{ area.environment_name }}/{{ area.datacenter_name }}/{{ area.area_name }}
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- 设备 -->
          <v-tabs-window-item value="devices">
            <div class="devices-section tab-content-container">
              <div v-if="!parsedData.components || parsedData.components.length === 0" class="text-center pa-8">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-router-outline</v-icon>
                <p class="text-body-2 text-grey-darken-1">暂无设备数据</p>
              </div>

              <div v-else>
                <v-card
                  v-for="(component, index) in parsedData.components"
                  :key="`device-${index}`"
                  variant="outlined"
                  class="mb-3"
                >
                  <v-card-title class="d-flex align-center">
                    <v-icon class="mr-2" color="success">mdi-router</v-icon>
                    {{ component.name || `设备 ${index + 1}` }}
                    <v-spacer />
                    <v-chip
                      v-if="component.type"
                      size="small"
                      color="success"
                      variant="outlined"
                    >
                      {{ component.type }}
                    </v-chip>
                  </v-card-title>

                  <v-card-text>
                    <div v-if="component.full_path || component.path" class="mb-2">
                      <strong>完整路径：</strong>{{ component.full_path || component.path }}
                    </div>

                    <div v-if="component.environment_path" class="mb-2">
                      <strong>所属环境：</strong>
                      <v-chip size="small" color="purple" variant="outlined">
                        {{ component.environment_path }}
                      </v-chip>
                    </div>

                    <div v-if="component.datacenter_path" class="mb-2">
                      <strong>所属数据中心：</strong>
                      <v-chip size="small" color="primary" variant="outlined">
                        {{ component.datacenter_path.split('/').pop() }}
                      </v-chip>
                    </div>

                    <div v-if="component.area_path" class="mb-2">
                      <strong>所属区域：</strong>
                      <v-chip size="small" color="info" variant="outlined">
                        {{ component.area_path.split('/').pop() }}
                      </v-chip>
                    </div>

                    <div v-if="component.category" class="mb-2">
                      <strong>设备类别：</strong>
                      <v-chip size="small" color="success" variant="outlined">
                        {{ getCategoryName(component.category) }}
                      </v-chip>
                    </div>

                    <!-- 如果有额外属性，显示它们 -->
                    <div v-if="component.attributes && Object.keys(component.attributes).length > 0" class="mb-2">
                      <strong>设备属性：</strong>
                      <div class="attributes-text mt-1">
                        <pre class="text-content">{{ JSON.stringify(component.attributes, null, 2) }}</pre>
                      </div>
                    </div>

                    <!-- 显示可扩展的字段提示 -->
                    <div class="mt-3 pa-2" style="background-color: #f5f5f5; border-radius: 4px;">
                      <v-icon size="16" color="info" class="mr-1">mdi-information-outline</v-icon>
                      <span class="text-caption text-grey-darken-1">
                        当前从文本中提取的基础信息。如需IP地址、型号等详细信息，可扩展输入格式。
                      </span>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- 连接 -->
          <v-tabs-window-item value="connections">
            <div class="connections-section tab-content-container">
              <div v-if="!parsedData.connections || parsedData.connections.length === 0" class="text-center pa-8">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-connection</v-icon>
                <p class="text-body-2 text-grey-darken-1">暂无连接数据</p>
              </div>

              <div v-else>
                <v-card
                  v-for="(connection, index) in parsedData.connections"
                  :key="`conn-${index}`"
                  variant="outlined"
                  class="mb-3"
                >
                  <v-card-title class="d-flex align-center">
                    <v-icon class="mr-2" color="warning">mdi-connection</v-icon>
                    连接 {{ index + 1 }}
                    <v-spacer />
                    <v-chip
                      v-if="connection.type"
                      size="small"
                      color="warning"
                      variant="outlined"
                    >
                      {{ connection.type }}
                    </v-chip>
                  </v-card-title>

                  <v-card-text>
                    <div class="connection-flow mb-3">
                      <div class="d-flex align-center">
                        <v-chip color="primary" variant="flat" class="mr-2">
                          {{ connection.source_path || connection.source || '源设备' }}
                        </v-chip>
                        <v-icon class="mx-2">mdi-arrow-right</v-icon>
                        <v-chip color="secondary" variant="flat" class="ml-2">
                          {{ connection.target_path || connection.target || '目标设备' }}
                        </v-chip>
                      </div>
                    </div>

                    <div v-if="connection.bandwidth" class="mb-2">
                      <strong>带宽：</strong>{{ connection.bandwidth }}
                    </div>

                    <div v-if="connection.ports" class="mb-2">
                      <strong>端口：</strong>{{ connection.ports }}
                    </div>

                    <div v-if="connection.description" class="mb-2">
                      <strong>描述：</strong>{{ connection.description }}
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-tabs-window-item>

          
          <!-- 原始数据 -->
          <v-tabs-window-item value="raw">
            <div class="raw-data-section tab-content-container">
              <v-card variant="outlined">
                <v-card-title class="d-flex align-center">
                  <v-icon class="mr-2" color="grey-darken-1">mdi-code-json</v-icon>
                  原始JSON数据
                  <v-spacer />
                  <v-btn
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-content-copy"
                    @click="copyToClipboard"
                  >
                    复制
                  </v-btn>
                </v-card-title>
                
                <v-card-text>
                  <div class="raw-json-text">
                    <pre class="json-content">{{ JSON.stringify(parsedData, null, 2) }}</pre>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 定义 props
interface Props {
  parsedData?: any
  loading?: boolean
}

const props = defineProps<Props>()

// 响应式数据
const activeTab = ref('environments')

// 计算属性：统计各种数据
// 环境数量
const environmentCount = computed(() => {
  if (props.parsedData?.statistics?.environment_count !== undefined) {
    return props.parsedData.statistics.environment_count
  }
  return (props.parsedData?.environments || []).length
})

// 数据中心数量（考虑不同环境下的同名数据中心）
const datacenterCount = computed(() => {
  if (props.parsedData?.statistics?.datacenter_count !== undefined) {
    return props.parsedData.statistics.datacenter_count
  }

  let count = 0
  if (props.parsedData?.environments) {
    for (const env of props.parsedData.environments) {
      count += (env.datacenters || []).length
    }
  }
  return count
})

// 扁平化的数据中心列表（包含环境信息）
const flatDatacenters = computed(() => {
  const result = []
  if (props.parsedData?.environments) {
    for (const env of props.parsedData.environments) {
      if (env.datacenters) {
        for (const dc of env.datacenters) {
          result.push({
            ...dc,
            environment_name: env.environment_name
          })
        }
      }
    }
  }
  return result
})

// 扁平化的区域列表（包含环境和数据中心信息）
const flatAreas = computed(() => {
  const result = []
  if (props.parsedData?.environments) {
    for (const env of props.parsedData.environments) {
      if (env.datacenters) {
        for (const dc of env.datacenters) {
          if (dc.areas) {
            for (const area of dc.areas) {
              result.push({
                ...area,
                environment_name: env.environment_name,
                datacenter_name: dc.datacenter_name
              })
            }
          }
        }
      }
    }
  }
  return result
})

// 网络区域数量（考虑4层级结构）
const areaCount = computed(() => {
  if (props.parsedData?.statistics?.area_count !== undefined) {
    return props.parsedData.statistics.area_count
  }

  let count = 0
  if (props.parsedData?.environments) {
    for (const env of props.parsedData.environments) {
      if (env.datacenters) {
        for (const dc of env.datacenters) {
          count += (dc.areas || []).length
        }
      }
    }
  }
  return count
})

const componentCount = computed(() => {
  // 优先使用后端返回的统计信息
  if (props.parsedData?.statistics?.component_count !== undefined) {
    return props.parsedData.statistics.component_count
  }
  
  // 如果没有统计信息，使用原有的计算逻辑作为备用
  return (props.parsedData?.components || []).length
})

const connectionCount = computed(() => {
  // 优先使用后端返回的统计信息
  if (props.parsedData?.statistics?.connection_count !== undefined) {
    return props.parsedData.statistics.connection_count
  }
  
  // 如果没有统计信息，使用原有的计算逻辑作为备用
  return (props.parsedData?.connections || []).length
})

const regionsByType = computed(() => {
  if (!props.parsedData || !props.parsedData.regions) return { regions: [], areas: [] }
  
  const regions = []
  const areas = []
  
  for (const region of props.parsedData.regions) {
    if (region.type === 'region') {
      regions.push(region)
    } else if (region.type === 'area') {
      areas.push(region)
    } else if (!region.type) {
      // 处理没有type字段的情况
      if (!region.parent || region.parent === null) {
        regions.push(region)
        // 同时处理sub_regions
        if (region.sub_regions && Array.isArray(region.sub_regions)) {
          areas.push(...region.sub_regions)
        }
      } else {
        areas.push(region)
      }
    }
  }
  
  return { regions, areas }
})

// 获取设备类别中文名称
const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    'access': '接入设备',
    'core': '核心设备',
    'network': '网络设备',
    'security': '安全设备',
    'storage': '存储设备',
    'compute': '计算设备'
  }
  return categoryMap[category] || category
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!props.parsedData) return

  try {
    await navigator.clipboard.writeText(JSON.stringify(props.parsedData, null, 2))
    // 显示成功提示
  } catch (error) {
    console.error('复制失败:', error)
    // 显示错误提示
  }
}
</script>

<style scoped>
.parsed-data-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 确保容器有明确的高度限制 */
  overflow: hidden;
}

.data-loading,
.data-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.data-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 确保内容区域能够正确计算高度 */
  min-height: 0;
}

.data-header {
  flex-shrink: 0;
  background: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.data-tabs-content {
  flex: 1;
  overflow: hidden;
  /* 确保选项卡内容区域能够正确计算高度 */
  min-height: 0;
}

/* 为所有选项卡内容容器设置统一的滚动样式 */
.tab-content-container {
  height: 100%;
  overflow: auto;
  /* 设置最大高度，确保容器内滚动 */
  max-height: calc(100vh - 400px);
  min-height: 400px;
  /* 确保容器有明确的边界和适当的内边距 */
  padding: 16px;
  background: white;
  border-radius: 4px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  /* 确保滚动条样式一致 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

/* WebKit浏览器的滚动条样式 */
.tab-content-container::-webkit-scrollbar {
  width: 8px;
}

.tab-content-container::-webkit-scrollbar-track {
  background: transparent;
}

.tab-content-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.tab-content-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.data-overview .v-card {
  border-radius: 8px !important;
}

.connection-flow {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.attributes-text {
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  max-height: 200px;
  overflow: auto;
  /* 确保滚动条样式与其他容器一致 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

/* 属性文本容器的滚动条样式 */
.attributes-text::-webkit-scrollbar {
  width: 8px;
}

.attributes-text::-webkit-scrollbar-track {
  background: transparent;
}

.attributes-text::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.attributes-text::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.text-content {
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

.ip-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #2d3748;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.raw-json-text {
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  /* 移除固定高度，让父容器控制滚动 */
  height: calc(100% - 32px);
  overflow: auto;
  /* 确保滚动条样式与其他选项卡一致 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

/* 原始数据JSON容器的滚动条样式 */
.raw-json-text::-webkit-scrollbar {
  width: 8px;
}

.raw-json-text::-webkit-scrollbar-track {
  background: transparent;
}

.raw-json-text::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.raw-json-text::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.json-content {
  margin: 0;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: #2d3748;
  background: transparent;
}

.v-card {
  border-radius: 8px !important;
}

.v-btn {
  border-radius: 6px !important;
}

.v-chip {
  border-radius: 6px !important;
}
</style>
