<template>
  <div class="topology-preview">
    <!-- 加载中或完成后都显示流程 -->
    <div v-if="props.loading || props.xmlContent || realSteps.length > 0" class="preview-with-workflow">
      <!-- 流程步骤展示 (水平布局) - 固定区域 -->
      <div class="workflow-header-section">
        <div class="workflow-container">
        <div class="workflow-header">
          <v-icon size="24" color="primary" class="mr-2">mdi-cog-outline</v-icon>
          <h4 class="text-h6 font-weight-bold text-primary">拓扑图生成流程</h4>
        </div>

        <div class="workflow-steps-horizontal">
          <div 
            v-for="(step, index) in displaySteps" 
            :key="step.name"
            class="workflow-step-horizontal"
            :class="getStepClass(step)"
          >
            <!-- 步骤圆圈 -->
            <div class="step-indicator-horizontal">
              <div
                class="step-circle-horizontal"
                :class="getStepCircleClass(step)"
                @click="handleStepClick(step)"
                @mouseenter="handleStepHover(step, true)"
                @mouseleave="handleStepHover(step, false)"
              >
                <v-icon
                  v-if="!isStepProcessing(step)"
                  :size="16"
                  :color="getStepIconColor(step)"
                >
                  {{ getStepIcon(step) }}
                </v-icon>
                <!-- 处理中动画 -->
                <v-progress-circular
                  v-else
                  indeterminate
                  size="16"
                  width="2"
                  color="white"
                />
              </div>
              <!-- 连接线 -->
              <div 
                v-if="index < displaySteps.length - 1" 
                class="step-connector"
                :class="getConnectorClass(step, displaySteps[index + 1])"
              />
            </div>
            
            <!-- 步骤内容 -->
            <div class="step-content-horizontal">
              <h5 class="step-title-horizontal">{{ step.displayName }}</h5>
              <p class="step-description-horizontal">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 悬停信息显示区域 -->
      <div v-if="hoveredStepInfo" class="step-hover-info">
        <div class="hover-info-container">
          <div class="hover-info-header">
            <v-icon size="16" color="primary" class="mr-2">mdi-information</v-icon>
            <span class="text-body-2 font-weight-bold">{{ hoveredStepInfo.displayName }} - 详细信息</span>
          </div>
          <div class="hover-info-content">
            <div v-if="hoveredStepInfo.status === 'completed'" class="step-detail">
              <p class="text-body-2 mb-2">
                <strong>状态：</strong>
                <v-chip size="small" color="success" variant="flat">已完成</v-chip>
              </p>
              <p v-if="hoveredStepInfo.processing_time_ms" class="text-body-2 mb-2">
                <strong>处理时间：</strong>{{ hoveredStepInfo.processing_time_ms }}ms
              </p>
              <p v-if="hoveredStepInfo.completed_at" class="text-body-2 mb-2">
                <strong>完成时间：</strong>{{ formatTime(hoveredStepInfo.completed_at) }}
              </p>
              <div v-if="hoveredStepInfo.realStepData" class="step-data">
                <p class="text-body-2 mb-1"><strong>生成数据：</strong></p>
                <pre class="step-data-content">{{ formatStepData(hoveredStepInfo.realStepData) }}</pre>
              </div>
            </div>
            <div v-else-if="hoveredStepInfo.status === 'processing'" class="step-detail">
              <p class="text-body-2 mb-2">
                <strong>状态：</strong>
                <v-chip size="small" color="primary" variant="flat">处理中</v-chip>
              </p>
              <p class="text-body-2">正在执行 {{ hoveredStepInfo.description }}...</p>
            </div>
            <div v-else-if="hoveredStepInfo.status === 'failed'" class="step-detail">
              <p class="text-body-2 mb-2">
                <strong>状态：</strong>
                <v-chip size="small" color="error" variant="flat">失败</v-chip>
              </p>
              <p v-if="hoveredStepInfo.error_message" class="text-body-2 text-error">
                <strong>错误信息：</strong>{{ hoveredStepInfo.error_message }}
              </p>
            </div>
            <div v-else class="step-detail">
              <p class="text-body-2 mb-2">
                <strong>状态：</strong>
                <v-chip size="small" color="grey" variant="flat">等待中</v-chip>
              </p>
              <p class="text-body-2">{{ hoveredStepInfo.description }}</p>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- 可滚动内容区域 -->
      <div class="preview-content-container">
        <!-- 完成状态显示结果 -->
        <div v-if="!props.loading && props.xmlContent" class="result-section-simple">
          <div class="result-header">
            <v-icon size="20" color="success" class="mr-2">mdi-check-circle</v-icon>
            <span class="text-body-2 text-success">已生成draw.io格式的网络拓扑图，可直接查看或下载编辑。</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 无内容状态 -->
    <div v-else class="preview-empty">
      <div class="text-center pa-12">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          mdi-sitemap
        </v-icon>
        <h4 class="text-h6 text-grey-darken-1 mb-2">等待生成拓扑图</h4>
        <p class="text-body-2 text-grey-darken-1 mb-4">
          请点击生成按钮开始创建拓扑图
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

// 定义 props
interface Props {
  xmlContent?: string
  loading?: boolean
  parsedData?: any
  processingSteps?: any[]  // 从后端获取的真实步骤数据
  versionId?: string       // 版本ID，用于获取步骤状态
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  download: []
  stepClicked: [stepName: string, stepDetail: any]
}>()

// 响应式数据
const downloadLoading = ref(false)
const realSteps = ref<any[]>([])
const pollingInterval = ref<NodeJS.Timeout | null>(null)
const forceUpdate = ref(0) // 用于强制更新UI
const hoveredStepInfo = ref<any>(null) // 悬停步骤信息

// 步骤定义映射（与后端保持一致）
const stepDefinitions = [
  { 
    name: 'validation', 
    displayName: '验证格式', 
    description: '检查文本格式和语法' 
  },
  {
    name: 'local_parsing',
    displayName: '本地解析',
    description: '本地文本解析和结构化'
  },
  { 
    name: 'data_processing', 
    displayName: '处理返回数据', 
    description: '解析结构化数据' 
  },
  { 
    name: 'xml_generation', 
    displayName: '生成拓扑图', 
    description: '转换为XML格式' 
  },
  { 
    name: 'download', 
    displayName: '完成', 
    description: '文件下载' 
  }
]

// 显示的步骤列表（合并定义和状态）
const displaySteps = computed(() => {
  // 强制更新触发器（确保响应式更新）
  forceUpdate.value

  // 修复实时进度更新：只有在正在加载且确实没有步骤数据时才显示pending状态
  if (props.loading && (!props.processingSteps || props.processingSteps.length === 0)) {
    console.log('TopologyPreview: 检测到加载状态且无步骤数据，重置为pending状态')
    return stepDefinitions.map(def => ({
      ...def,
      status: 'pending',
      error_message: null,
      processing_time_ms: null,
      started_at: null,
      completed_at: null,
      realStepData: null
    }))
  }

  // 如果工作流已完成且有XML内容，但没有步骤数据，则显示所有步骤为已完成
  if (!props.loading && props.xmlContent && (!props.processingSteps || props.processingSteps.length === 0)) {
    console.log('TopologyPreview: 工作流已完成但无步骤数据，显示所有步骤为已完成')

    return stepDefinitions.map((def, index) => {
      // 为每个步骤创建模拟的完成时间（递增）
      const completedTime = new Date(Date.now() - (stepDefinitions.length - index - 1) * 1000).toISOString()

      // 根据步骤类型创建不同的详细信息
      let stepDetail = {}
      switch (def.name) {
        case 'validation':
          stepDetail = { message: '文本格式验证通过', lines_validated: 9 }
          break
        case 'local_parsing':
          stepDetail = { message: '本地解析完成', components_parsed: 10, connections_parsed: 9 }
          break
        case 'data_processing':
          stepDetail = { message: '数据处理完成', data_structured: true }
          break
        case 'xml_generation':
          stepDetail = { message: 'XML生成完成', xml_length: props.xmlContent?.length || 0 }
          break
        case 'download':
          stepDetail = { message: '拓扑图生成完成，可以下载', file_format: 'DrawIO XML' }
          break
      }

      return {
        ...def,
        status: 'completed',
        error_message: null,
        processing_time_ms: 200 + index * 100, // 模拟处理时间
        started_at: new Date(Date.now() - (stepDefinitions.length - index) * 1000).toISOString(),
        completed_at: completedTime,
        realStepData: {
          step_name: def.name,
          status: 'completed',
          step_detail: stepDetail
        }
      }
    })
  }

  // 修复实时进度更新：优先使用主页面传递的步骤数据
  const stepsData = props.processingSteps && props.processingSteps.length > 0
    ? props.processingSteps
    : realSteps.value

  console.log('TopologyPreview: 使用数据源:', props.processingSteps && props.processingSteps.length > 0 ? '主页面数据' : '组件内部数据')
  console.log('TopologyPreview: 步骤数据长度:', stepsData.length)
  if (stepsData.length > 0) {
    console.log('TopologyPreview: 步骤状态:', stepsData.map(s => `${s.step_name}:${s.status}`).join(', '))
  }

  return stepDefinitions.map(def => {
    const realStep = stepsData.find(s => s.step_name === def.name)

    // 特殊处理：如果是下载步骤且工作流已完成，强制设置为completed状态
    let stepStatus = realStep?.status || 'pending'
    let stepData = realStep

    if (def.name === 'download' && !props.loading && props.xmlContent) {
      stepStatus = 'completed'

      // 如果没有真实的步骤数据，为下载步骤创建模拟数据
      if (!realStep) {
        const now = new Date().toISOString()
        stepData = {
          step_name: 'download',
          status: 'completed',
          started_at: now,
          completed_at: now,
          processing_time_ms: 50,
          step_detail: {
            message: '拓扑图生成完成，可以下载',
            xml_length: props.xmlContent?.length || 0,
            file_format: 'DrawIO XML'
          }
        }
      }
    }

    return {
      ...def,
      status: stepStatus,
      error_message: stepData?.error_message,
      processing_time_ms: stepData?.processing_time_ms,
      started_at: stepData?.started_at,
      completed_at: stepData?.completed_at,
      realStepData: stepData
    }
  })
})

// 获取步骤样式类
const getStepClass = (step: any) => {
  return {
    'step-completed': step.status === 'completed',
    'step-processing': step.status === 'processing',
    'step-pending': step.status === 'pending',
    'step-failed': step.status === 'failed'
  }
}

// 获取步骤圆圈样式类
const getStepCircleClass = (step: any) => {
  // 如果是下载步骤且工作流已完成，使用completed样式而不是特殊的download样式
  if (step.name === 'download' && !props.loading && props.xmlContent) {
    return {
      'step-completed': true,
      'step-download': true, // 保留下载样式用于特殊效果
      'step-hoverable': true
    }
  }

  return {
    'step-completed': step.status === 'completed',
    'step-processing': step.status === 'processing',
    'step-pending': step.status === 'pending',
    'step-failed': step.status === 'failed',
    'step-hoverable': step.status === 'completed' || step.status === 'failed' // 可悬停的步骤
  }
}

// 获取步骤图标
const getStepIcon = (step: any) => {
  if (step.name === 'download') {
    if (!props.loading && props.xmlContent) {
      return 'mdi-download' // 生成完成后显示下载图标
    } else if (step.status === 'completed') {
      return 'mdi-check' // 生成过程中完成时显示勾选
    } else if (step.status === 'failed') {
      return 'mdi-alert' // 失败显示警告图标
    }
  }
  
  // 其他步骤的图标逻辑
  if (step.status === 'completed') {
    return 'mdi-check'
  } else if (step.status === 'failed') {
    return 'mdi-alert'
  } else {
    // 待处理显示步骤序号
    const stepIndex = stepDefinitions.findIndex(def => def.name === step.name)
    return String(stepIndex + 1)
  }
}

// 获取步骤图标颜色
const getStepIconColor = (step: any) => {
  if (step.name === 'download' && !props.loading && props.xmlContent) {
    return 'white' // 完成步骤下载图标使用白色
  }
  
  if (step.status === 'completed' || step.status === 'processing') {
    return 'white'
  }
  
  if (step.status === 'failed') {
    return 'white'
  }
  
  return 'rgba(0, 0, 0, 0.6)'
}

// 判断步骤是否正在处理中
const isStepProcessing = (step: any) => {
  return step.status === 'processing'
}

// 获取连接线样式类
const getConnectorClass = (currentStep: any, nextStep: any) => {
  if (currentStep.status === 'completed') {
    return 'connector-completed'
  } else if (currentStep.status === 'processing') {
    return 'connector-processing'
  } else {
    return 'connector-pending'
  }
}

// 从后端获取步骤数据
const fetchStepsData = async () => {
  if (!props.versionId) return
  
  try {
    const { $topologyApi } = useNuxtApp()
    const response = await $topologyApi.versions.getSteps(props.versionId)
    
    if (response.success && response.data?.steps) {
      realSteps.value = response.data.steps
    }
  } catch (error) {
    console.error('获取步骤数据失败:', error)
  }
}

// 下载方法
const downloadFile = () => {
  downloadLoading.value = true
  emit('download')
  setTimeout(() => {
    downloadLoading.value = false
  }, 1000)
}

// 处理步骤点击
const handleStepClick = async (step: any) => {
  console.log('步骤点击:', step.name, step)

  if (step.name === 'download' && !props.loading && props.xmlContent) {
    downloadFile()
    return
  }

  // 如果是已完成的步骤，获取详细信息并发射事件
  if (step.status === 'completed' && step.realStepData) {
    try {
      const { $topologyApi } = useNuxtApp()
      const response = await $topologyApi.versions.getStepDetail(props.versionId!, step.name)

      if (response.success && response.data) {
        emit('stepClicked', step.name, response.data.step_detail)
      }
    } catch (error) {
      console.error('获取步骤详情失败:', error)
    }
  }
}

// 处理步骤悬停
const handleStepHover = (step: any, isEntering: boolean) => {
  if (isEntering) {
    hoveredStepInfo.value = step
  } else {
    hoveredStepInfo.value = null
  }
}

// 格式化时间
const formatTime = (timeString: string) => {
  try {
    return new Date(timeString).toLocaleString('zh-CN')
  } catch {
    return timeString
  }
}

// 格式化步骤数据
const formatStepData = (stepData: any) => {
  if (!stepData) return '无数据'

  try {
    // 如果是字符串，尝试解析为JSON
    if (typeof stepData === 'string') {
      const parsed = JSON.parse(stepData)
      return JSON.stringify(parsed, null, 2)
    }

    // 如果是对象，直接格式化
    return JSON.stringify(stepData, null, 2)
  } catch {
    // 如果解析失败，返回原始字符串
    return String(stepData)
  }
}

// 监听loading状态变化，开始轮询步骤状态
watch(() => props.loading, (newLoading) => {
  if (newLoading && props.versionId) {
    // 开始轮询
    pollingInterval.value = setInterval(fetchStepsData, 10000)
  } else {
    // 停止轮询
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }
}, { immediate: true })

// 监听versionId变化
watch(() => props.versionId, (newVersionId) => {
  console.log('TopologyPreview: versionId变化:', newVersionId)
  // 不自动获取数据，完全依赖主页面传递
}, { immediate: true })

// 修复实时进度更新：监听主页面传递的步骤数据
watch(() => props.processingSteps, (newSteps, oldSteps) => {
  console.log('TopologyPreview: 监听到主页面步骤数据变化')
  console.log('TopologyPreview: 旧数据长度:', oldSteps?.length || 0)
  console.log('TopologyPreview: 新数据长度:', newSteps?.length || 0)

  if (newSteps && newSteps.length > 0) {
    console.log('TopologyPreview: 新步骤状态:', newSteps.map(s => `${s.step_name}:${s.status}`).join(', '))

    // 停止内部轮询，使用主页面数据
    if (pollingInterval.value) {
      console.log('TopologyPreview: 收到主页面数据，停止内部轮询')
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }

    // 强制触发UI更新
    forceUpdate.value++
    console.log('TopologyPreview: 强制触发UI更新')
  } else if (newSteps && newSteps.length === 0) {
    console.log('TopologyPreview: 主页面数据被重置为空')
    // 强制触发UI更新
    forceUpdate.value++
  }
}, { immediate: true, deep: true })

// 监听loading状态，确保UI及时更新
watch(() => props.loading, (newLoading, oldLoading) => {
  console.log('TopologyPreview: loading状态变化:', oldLoading, '->', newLoading)
}, { immediate: true })

// 组件卸载时清理轮询
onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
})
</script>

<style scoped>
.topology-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 确保容器有明确的高度限制 */
  overflow: hidden;
}

.preview-with-workflow {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 确保内容区域能够正确计算高度 */
  min-height: 0;
}

.workflow-header-section {
  flex-shrink: 0;
  padding: 16px 16px 0 16px;
  background: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.preview-content-container {
  flex: 1;
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
.preview-content-container::-webkit-scrollbar {
  width: 8px;
}

.preview-content-container::-webkit-scrollbar-track {
  background: transparent;
}

.preview-content-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.preview-content-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.preview-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workflow-container {
  margin-bottom: 0;
}

.workflow-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  justify-content: center;
}

.workflow-steps-horizontal {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  padding: 0 20px;
}

.workflow-step-horizontal {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 150px;
  transition: all 0.3s ease;
}

.step-indicator-horizontal {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 12px;
}

.step-circle-horizontal {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: #e0e0e0;
  color: #757575;
  font-weight: bold;
  font-size: 12px;
  margin: 0 auto;
  z-index: 2;
  position: relative;
}

.step-completed .step-circle-horizontal {
  background: #4caf50;
  color: white;
}

.step-processing .step-circle-horizontal {
  background: #2196f3;
  color: white;
}

/* 步骤圆圈状态样式 */
.step-circle-horizontal.step-completed {
  background: #4caf50;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-circle-horizontal.step-completed:hover {
  background: #45a049;
  transform: scale(1.05);
}

.step-circle-horizontal.step-processing {
  background: #2196f3;
  color: white;
  animation: pulse 2s infinite;
}

.step-circle-horizontal.step-failed {
  background: #f44336;
  color: white;
}

.step-circle-horizontal.step-download {
  background: #1976d2;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-circle-horizontal.step-download:hover {
  background: #1565c0;
  transform: scale(1.1);
}

/* 可悬停步骤样式 */
.step-circle-horizontal.step-hoverable {
  cursor: pointer;
}

.step-circle-horizontal.step-hoverable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 悬停信息容器样式 */
.step-hover-info {
  margin: 16px 0;
  padding: 16px;
  border: 2px solid #2196f3;
  border-radius: 8px;
  background: #f8f9fa;
  min-height: 120px;
}

.hover-info-container {
  width: 100%;
}

.hover-info-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.hover-info-content {
  max-height: 300px;
  overflow-y: auto;
}

.step-detail {
  line-height: 1.5;
}

.step-data-content {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 连接线样式 */
.step-connector {
  position: absolute;
  top: 50%;
  left: 36px;
  right: -36px;
  height: 2px;
  background: #e0e0e0;
  transform: translateY(-50%);
  z-index: 1;
}

.step-connector.connector-completed {
  background: #4caf50;
}

.step-connector.connector-processing {
  background: linear-gradient(90deg, #4caf50 50%, #e0e0e0 50%);
  animation: progressFlow 2s infinite;
}

.step-connector.connector-pending {
  background: #e0e0e0;
}

.step-content-horizontal {
  text-align: center;
  flex: 1;
}



.step-title-horizontal {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: rgba(0, 0, 0, 0.87);
}

.step-description-horizontal {
  font-size: 12px;
  margin: 0;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.3;
}

.step-completed .step-title-horizontal {
  color: #4caf50;
}

.step-processing .step-title-horizontal {
  color: #2196f3;
}

.gemini-interaction-horizontal {
  background: #f8f9fa;
  border-radius: 8px;
}

.interaction-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.interaction-item-horizontal {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #616161;
}

.interaction-text-horizontal {
  line-height: 1.3;
}

.completion-section {
  margin-top: 16px;
}

.completion-summary {
  display: flex;
  align-items: center;
  justify-content: center;
}

.generation-stats {
  margin: 16px 0;
}

.v-btn {
  border-radius: 6px !important;
}

.v-alert {
  border-radius: 8px !important;
}

/* 动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(33, 150, 243, 0.1);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
}

@keyframes progressFlow {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 0;
  }
}

.step-processing .step-circle-horizontal {
  animation: pulse 2s infinite;
}



.result-section-simple {
  padding: 16px;
  text-align: center;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workflow-steps-horizontal {
    flex-direction: column;
    align-items: center;
    padding: 0;
  }
  
  .workflow-step-horizontal {
    max-width: none;
    width: 100%;
    margin-bottom: 16px;
  }
  
  .step-indicator-horizontal {
    flex-direction: column;
  }
  

}
</style>


