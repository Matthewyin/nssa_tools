<template>
  <div class="xml-code-viewer">
    <!-- 加载状态 -->
    <div v-if="loading" class="xml-loading">
      <div class="text-center pa-8">
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
        />
        <p class="text-body-2 text-grey-darken-1 mt-4">生成XML中...</p>
      </div>
    </div>
    
    <!-- 无内容状态 -->
    <div v-else-if="!xmlContent" class="xml-empty">
      <div class="text-center pa-12">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          mdi-code-tags
        </v-icon>
        <h4 class="text-h6 text-grey-darken-1 mb-2">暂无XML代码</h4>
        <p class="text-body-2 text-grey-darken-1 mb-4">
          请先生成拓扑图以查看XML代码
        </p>
      </div>
    </div>
    
    <!-- XML代码展示 -->
    <div v-else class="xml-content">
      <!-- 工具栏 -->
      <div class="xml-toolbar">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-code-tags</v-icon>
          <span class="text-body-1 font-weight-medium">Draw.io XML代码</span>
          <v-chip
            size="small"
            variant="outlined"
            color="primary"
            class="ml-3"
          >
            {{ formatFileSize(xmlContent.length) }}
          </v-chip>
        </div>
      </div>
      
      <!-- 代码区域 -->
      <div class="xml-code-area">
        <div class="code-header">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon size="16" class="mr-1">mdi-file-xml-outline</v-icon>
              <span class="text-caption">topology.drawio</span>
              <span class="text-caption text-grey-darken-1 ml-2">
                {{ lineCount }} 行
              </span>
            </div>
            
            <div class="d-flex align-center">
              <v-btn
                variant="outlined"
                size="small"
                prepend-icon="mdi-content-copy"
                @click="copyToClipboard"
                class="mr-2"
              >
                复制代码
              </v-btn>
              <v-btn
                icon="mdi-fullscreen"
                variant="text"
                size="x-small"
                @click="toggleFullscreen"
              />
            </div>
          </div>
        </div>
        
        <div ref="codeContainer" class="code-container" :class="{ 'fullscreen': isFullscreen }">
          <pre class="xml-text-display">{{ displayedXml }}</pre>
          
          <!-- 全屏退出按钮 -->
          <v-btn
            v-if="isFullscreen"
            icon="mdi-fullscreen-exit"
            color="white"
            class="fullscreen-exit-btn"
            @click="exitFullscreen"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 定义 props
interface Props {
  xmlContent?: string
  loading?: boolean
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  download: []
}>()

// 响应式数据
const codeContainer = ref<HTMLElement>()
const isFullscreen = ref(false)

// 计算属性
const displayedXml = computed(() => {
  if (!props.xmlContent) return ''
  return props.xmlContent
})

const lineCount = computed(() => {
  if (!displayedXml.value) return 0
  return displayedXml.value.split('\n').length
})

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 下载文件
const handleDownload = () => {
  if (!props.xmlContent) return
  
  try {
    // 创建Blob对象
    const blob = new Blob([props.xmlContent], { type: 'application/xml' })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `topology_${new Date().getTime()}.drawio`
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    // 发送下载事件
    emit('download')
  } catch (error) {
    console.error('下载失败:', error)
  }
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!displayedXml.value) return
  
  try {
    await navigator.clipboard.writeText(displayedXml.value)
    // 显示成功提示
  } catch (error) {
    console.error('复制失败:', error)
    // 显示错误提示
  }
}



// 切换全屏
const toggleFullscreen = () => {
  if (!isFullscreen.value) {
    enterFullscreen()
  } else {
    exitFullscreen()
  }
}

// 进入全屏
const enterFullscreen = () => {
  if (codeContainer.value) {
    if (codeContainer.value.requestFullscreen) {
      codeContainer.value.requestFullscreen()
    }
  }
}

// 退出全屏
const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  }
}

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 监听ESC键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isFullscreen.value) {
    exitFullscreen()
  }
}

// 组件挂载
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.xml-code-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.xml-loading,
.xml-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.xml-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* 确保内容区域有明确的高度限制 */
  height: 100%;
  overflow: hidden;
}

.xml-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background: #fafafa;
  flex-shrink: 0;
}

.xml-code-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 确保代码区域能够正确计算高度 */
  min-height: 0;
}

.code-header {
  padding: 8px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.code-container {
  flex: 1;
  overflow: auto;
  position: relative;
  background: #fafafa;
  /* 设置最大高度，确保容器内滚动 */
  max-height: calc(100vh - 300px);
  min-height: 400px;
}

.code-container.fullscreen {
  background: white;
  z-index: 9999;
  max-height: 100vh;
  min-height: 100vh;
}

.code-actions {
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: center;
}

.copy-btn {
  min-width: 120px;
}

.xml-text-display {
  margin: 0;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  background: white;
  border: none;
  white-space: pre-wrap;
  word-break: break-word;
  /* 移除 min-height: 100%，避免撑开容器 */
  color: #2d3748;
  /* 确保文本区域有明确的边界 */
  border-radius: 4px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.xml-info {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.info-item {
  margin-bottom: 8px;
  font-size: 14px;
}

.fullscreen-exit-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.7) !important;
}

.v-btn {
  border-radius: 6px !important;
}

.v-chip {
  border-radius: 6px !important;
}

.v-alert {
  border-radius: 8px !important;
}

.v-expansion-panel {
  border-radius: 8px !important;
}
</style>
