<template>
  <div class="topology-editor">
    <!-- 加载状态 -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 60vh;">
      <div class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        />
        <p class="text-body-1 text-grey-darken-1 mt-4">加载项目中...</p>
      </div>
    </div>
    
    <!-- 项目不存在 -->
    <div v-else-if="!project" class="text-center pa-12">
      <v-icon size="80" color="grey-lighten-1" class="mb-4">
        mdi-folder-remove-outline
      </v-icon>
      <h3 class="text-h5 text-grey-darken-1 mb-2">项目不存在</h3>
      <p class="text-body-1 text-grey-darken-1 mb-4">
        请检查项目ID是否正确，或者项目可能已被删除
      </p>
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-arrow-left"
        @click="$router.push('/topology-projects')"
      >
        返回项目列表
      </v-btn>
    </div>
    
    <!-- 编辑器界面 -->
    <div v-else class="editor-container">
      <!-- 顶部工具栏 -->
      <v-app-bar
        color="white"
        elevation="1"
        height="64"
        class="editor-toolbar"
      >
        <div class="d-flex align-center w-100 px-4">
          <!-- 返回按钮 -->
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            class="mr-3"
            @click="$router.push('/topology-projects')"
          />

          <!-- 项目图标和信息 -->
          <v-icon class="mr-2" color="primary">mdi-sitemap</v-icon>
          <div>
            <div class="text-h6 font-weight-bold">{{ project.project_name }}</div>
            <div class="text-caption text-grey-darken-1">
              当前版本：v{{ currentVersion?.version || 0 }}
              <span v-if="currentVersion?.status" class="mx-1">•</span>
              <span v-if="currentVersion?.status">{{ getVersionStatusText(currentVersion.status as VersionStatus) }}</span>
            </div>
          </div>

          <v-spacer />

          <!-- 操作按钮组 -->
          <div class="d-flex align-center">
            <!-- 版本选择按钮 -->
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  variant="outlined"
                  class="mr-3 version-selector-btn"
                  v-bind="props"
                  append-icon="mdi-chevron-down"
                >
                  {{ currentVersionText }}
                </v-btn>
              </template>
              <v-list density="compact" min-width="200">
                <v-list-item
                  v-for="version in versionOptions"
                  :key="version.value"
                  :value="version.value"
                  @click="selectVersion(version.value)"
                >
                  <v-list-item-title>{{ version.title }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <!-- 保存按钮 -->
            <v-btn
              variant="outlined"
              prepend-icon="mdi-content-save"
              class="mr-3"
              :loading="saving"
              @click="saveCurrentVersion"
            >
              保存
            </v-btn>

            <!-- 生成拓扑图圆形按钮 -->
            <v-btn
              icon
              color="primary"
              size="large"
              class="generate-btn"
              :loading="processing"
              @click="processWorkflow"
            >
              <v-icon size="24">mdi-play</v-icon>
              <v-tooltip activator="parent" location="bottom">
                生成拓扑图
              </v-tooltip>
            </v-btn>
          </div>
        </div>
      </v-app-bar>
      
      <!-- 主编辑区域 -->
      <div class="editor-content">
        <v-row no-gutters style="height: 100%;">
          <!-- 左侧：文本编辑器 -->
          <v-col cols="12" lg="4" class="editor-panel">
            <div class="panel-header">
              <h3 class="text-h6 font-weight-bold">拓扑文本编辑</h3>
              <div class="d-flex align-center">
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-robot"
                  @click="showAIPanel = !showAIPanel"
                  :color="showAIPanel ? 'primary' : 'default'"
                >
                  AI转换
                </v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-help-circle-outline"
                  @click="showFormatHelp = true"
                >
                  格式说明
                </v-btn>
              </div>
            </div>

            <!-- AI智能转换面板 -->
            <div v-if="showAIPanel" class="ai-panel">
              <AIConversionPanel
                ref="aiConversionPanelRef"
                v-model="textContent"
                @converted="onAIConverted"
                @openConfig="showAIConfigDialog = true"
              />
            </div>

            <div class="text-editor">
              <v-textarea
                v-model="textContent"
                placeholder="请输入网络拓扑描述文本..."
                variant="outlined"
                hide-details
                rows="25"
                auto-grow
                class="editor-textarea"
                @input="onTextChange"
              />
            </div>
          </v-col>
          
          <!-- 右侧：预览和结果 -->
          <v-col cols="12" lg="8" class="preview-panel">
            <div class="panel-header">
              <h3 class="text-h6 font-weight-bold">预览和结果</h3>
              <div class="d-flex align-center">
                <!-- 这里可以添加右侧的操作按钮 -->
              </div>
            </div>
            <v-tabs v-model="activeTab" class="preview-tabs">
              <v-tab value="preview">拓扑生成</v-tab>
              <v-tab value="data">解析数据</v-tab>
              <v-tab value="xml">XML代码</v-tab>
              <v-tab value="history">版本历史</v-tab>
            </v-tabs>
            
            <v-tabs-window v-model="activeTab" class="preview-content">
              <!-- 拓扑预览 -->
              <v-tabs-window-item value="preview" class="preview-tab">
                <!-- 原有的拓扑预览组件 -->
                <TopologyPreview
                  :xml-content="currentVersion?.xml_content"
                  :parsed-data="currentVersion?.parsed_data"
                  :loading="processing"
                  :version-id="currentVersion?._id"
                  :processing-steps="processingSteps"
                  @download="downloadTopology"
                />
              </v-tabs-window-item>
              
              <!-- 解析数据 -->
              <v-tabs-window-item value="data" class="data-tab">
                <ParsedDataViewer
                  :parsed-data="currentVersion?.parsed_data"
                  :loading="processing"
                />
              </v-tabs-window-item>
              
              <!-- XML代码 -->
              <v-tabs-window-item value="xml" class="xml-tab">
                <XmlCodeViewer
                  :xml-content="currentVersion?.xml_content"
                  :loading="processing"
                  @download="downloadTopology"
                />
              </v-tabs-window-item>



              <!-- 版本历史 -->
              <v-tabs-window-item value="history" class="history-tab">
                <VersionHistory
                  :project-id="projectId"
                  :current-version-id="currentVersion?._id"
                  @version-selected="onVersionSelected"
                  @version-switched="onVersionSwitched"
                  @new-version-created="onNewVersionCreated"
                />
              </v-tabs-window-item>
            </v-tabs-window>
          </v-col>
        </v-row>
      </div>
    </div>
    
    <!-- 格式帮助对话框 -->
    <FormatHelpDialog v-model="showFormatHelp" />

    <!-- AI配置弹窗 -->
    <v-dialog
      v-model="showAIConfigDialog"
      max-width="800px"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-cog" class="mr-2" />
          AI配置管理
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showAIConfigDialog = false"
          />
        </v-card-title>

        <v-card-text class="pa-6">
          <AIConfigPanel
            @close="showAIConfigDialog = false"
            @configSaved="onAIConfigSaved"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 定义类型
interface Project {
  _id: string
  project_name: string
  description?: string
  [key: string]: any
}

interface ProjectVersion {
  _id: string
  version: number
  status: string
  text_content?: string
  xml_content?: string
  parsed_data?: any
  [key: string]: any
}



type VersionStatus = 'draft' | 'parsed' | 'generated' | 'published';

// 页面元数据
definePageMeta({
  title: '拓扑编辑器',
  description: '编辑和生成网络拓扑图'
})

// 路由
const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const saving = ref(false)
const processing = ref(false)

const project = ref<Project | null>(null)
const versions = ref<ProjectVersion[]>([])
const currentVersion = ref<ProjectVersion | null>(null)
const selectedVersionId = ref('')
const textContent = ref('')
const activeTab = ref('preview')
const showFormatHelp = ref(false)
const showAIPanel = ref(false)
const showAIConfigDialog = ref(false)

// AI转换面板的引用
const aiConversionPanelRef = ref(null)


// 简化的处理状态（移除AI步骤追踪）
const currentVersionId = ref('')
const processingSteps = ref<any[]>([])

// 计算属性
const versionOptions = computed(() => {
  return versions.value.map(version => ({
    title: `v${version.version} - ${getVersionStatusText(version.status as VersionStatus)}`,
    value: version._id
  }))
})

// 当前版本显示文本
const currentVersionText = computed(() => {
  if (!currentVersion.value) return '选择版本'
  return `v${currentVersion.value.version} - ${getVersionStatusText(currentVersion.value.status as VersionStatus)}`
})

// 获取项目ID
const projectId = computed(() => route.params.id as string)

// 加载项目数据
const loadProject = async () => {
  loading.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    
    // 加载项目基本信息
    const projectResponse = await $topologyApi.projects.getById(projectId.value)
    if (!projectResponse.data) throw new Error('项目数据加载失败')
    project.value = projectResponse.data
    
    // 加载项目版本列表
    const versionsResponse = await $topologyApi.projects.getVersions(projectId.value)
    if (!versionsResponse.data?.versions) throw new Error('项目版本列表加载失败')
    versions.value = versionsResponse.data.versions
    
    // 修复逻辑：优先选择正在处理中的版本，而不是最新版本
    if (versions.value.length > 0) {
      let targetVersion = null

      // 选择最新版本（简化逻辑，移除AI处理状态检查）
      targetVersion = versions.value[0]
      console.log('选择最新版本:', targetVersion._id, 'v' + targetVersion.version)

      selectedVersionId.value = targetVersion._id
      await loadVersion(targetVersion._id)
    }
  } catch (error) {
    console.error('加载项目失败:', error)
    project.value = null
  } finally {
    loading.value = false
  }
}

// 加载版本数据
const loadVersion = async (versionId: string) => {
  if (!versionId) return;

  try {
    const { $topologyApi } = useNuxtApp();

    // 加载版本详情（简化版本，无AI步骤）
    const versionResponse = await $topologyApi.versions.getById(versionId);

    // 更新版本信息
    if (!versionResponse.data) throw new Error('版本详情加载失败')
    currentVersion.value = versionResponse.data;
    textContent.value = versionResponse.data.text_content || '';

  } catch (error) {
    console.error('加载版本失败:', error);
  }
};

// 选择版本（用于按钮式选择器）
const selectVersion = async (versionId: string) => {
  selectedVersionId.value = versionId
  await loadVersion(versionId)
}

// 保存当前版本
const saveCurrentVersion = async () => {
  if (!currentVersion.value) return
  
  saving.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    await $topologyApi.versions.update(currentVersion.value._id, {
      text_content: textContent.value
    })
    
    // 重新加载版本数据
    await loadVersion(currentVersion.value._id)
  } catch (error) {
    console.error('保存版本失败:', error)
  } finally {
    saving.value = false
  }
}

// 处理完整工作流（简化版本，无AI步骤监控）
const processWorkflow = async () => {
  if (!textContent.value.trim()) {
    // 显示提示：请先输入文本内容
    return
  }

  console.log('主页面: 开始处理工作流')

  // 设置处理状态
  processing.value = true
  processingSteps.value = [] // 重置步骤数据

  // 切换到预览标签以显示生成过程
  activeTab.value = 'preview'

  try {
    const { $topologyApi } = useNuxtApp()

    console.log('主页面: 调用后端工作流API')

    // 在发送到后端之前，对文本内容进行大小写标准化处理
    const processedTextContent = textContent.value.toUpperCase()

    // 执行完整工作流（新的3步本地处理）
    const response = await $topologyApi.projects.processWorkflow(projectId.value, {
      text_content: processedTextContent
    })

    console.log('主页面: 工作流处理完成', response)

    if (response.success && response.data?.version_id) {
      // 保存步骤数据（在重新加载之前）
      const completedSteps = response.data.processing_steps || []

      // 设置新版本
      currentVersionId.value = response.data.version_id
      selectedVersionId.value = response.data.version_id

      // 重新加载项目数据以获取最新版本
      await loadProject()

      // 选择新创建的版本
      await loadVersion(response.data.version_id)

      // 在重新加载后恢复步骤数据
      processingSteps.value = completedSteps
      console.log('主页面: 恢复步骤数据:', processingSteps.value)

      console.log('主页面: 工作流完成，版本ID:', response.data.version_id)
    } else {
      throw new Error(response.error || '处理失败')
    }

  } catch (error) {
    console.error('处理工作流失败:', error)
    // 可以在这里显示错误提示
  } finally {
    // 重置处理状态
    processing.value = false
  }
}




// 步骤状态相关方法
const getStepIcon = (status: string) => {
  const iconMap = {
    'pending': 'mdi-clock-outline',
    'processing': 'mdi-loading',
    'completed': 'mdi-check',
    'failed': 'mdi-alert-circle'
  }
  return iconMap[status] || 'mdi-help-circle'
}

const getStepColor = (status: string) => {
  const colorMap = {
    'pending': 'grey-lighten-1',
    'processing': 'primary',
    'completed': 'success',
    'failed': 'error'
  }
  return colorMap[status] || 'grey'
}

const getStepIconColor = (status: string) => {
  return status === 'pending' ? 'grey-darken-1' : 'white'
}

const getStatusText = (status: string) => {
  const statusMap = {
    'pending': '等待中',
    'processing': '处理中',
    'completed': '已完成',
    'failed': '失败'
  }
  return statusMap[status] || '未知'
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 计算属性
const isComplete = computed(() => overallStatus.value?.status === 'completed')
const hasFailed = computed(() => processingSteps.value.some((step: any) => step.status === 'failed'))
const totalDuration = computed(() => {
  return processingSteps.value.reduce((sum: number, step: any) => sum + (step.duration || 0), 0)
})



type StepStatus = 'pending' | 'processing' | 'completed' | 'failed';

const getStepStatusInfo = (status: StepStatus | string) => {
  const statusMap: Record<StepStatus, { color: string, icon: string, text: string }> = {
    pending: { color: 'grey', icon: 'mdi-circle-outline', text: '待处理' },
    processing: { color: 'blue', icon: 'mdi-autorenew', text: '处理中' },
    completed: { color: 'green', icon: 'mdi-check-circle', text: '已完成' },
    failed: { color: 'red', icon: 'mdi-alert-circle', text: '失败' }
  };
  return statusMap[status as StepStatus] || statusMap.pending;
};


// 下载拓扑图
const downloadTopology = async () => {
  if (!currentVersion.value?.xml_content) return
  
  try {
    const { $topologyApi } = useNuxtApp()
    await $topologyApi.download(currentVersion.value._id)
  } catch (error) {
    console.error('下载失败:', error)
  }
}

// 文本变化处理 - 移除实时大小写转换，保持用户输入
const onTextChange = () => {
  // 不再进行实时大小写转换，让用户自由编辑
  // 大小写转换将在生成拓扑图时进行
}



// AI转换完成处理
const onAIConverted = (result: any) => {
  console.log('AI转换完成:', result)

  // 自动保存当前版本（如果有的话）
  if (currentVersion.value) {
    saveCurrentVersion()
  }

  // 关闭AI面板
  showAIPanel.value = false

  // 可以显示成功提示
  // 这里应该使用全局通知组件
  console.log('AI转换的文本已应用到编辑器')
}

// AI配置保存完成处理
const onAIConfigSaved = async (configData: any) => {
  console.log('AI配置保存完成:', configData)

  // 刷新AI转换面板的配置状态
  if (aiConversionPanelRef.value && aiConversionPanelRef.value.refreshConfigStatus) {
    await aiConversionPanelRef.value.refreshConfigStatus()
  }

  // 关闭配置对话框
  showAIConfigDialog.value = false

  console.log('AI配置状态已更新，用户可以继续使用AI转换功能')
}

// 获取版本状态文本
const getVersionStatusText = (status: VersionStatus | string) => {
  const statusMap: Record<VersionStatus, string> = {
    draft: '草稿',
    parsed: '已解析',
    generated: '已生成',
    published: '已发布'
  };
  return statusMap[status as VersionStatus] || '未知状态';
};

// 版本历史事件处理
const onVersionSelected = (version: any) => {
  // 预览版本内容，但不切换当前版本
  console.log('预览版本:', version)
}

const onVersionSwitched = async (version: any) => {
  // 切换到指定版本
  selectedVersionId.value = version._id
  await loadVersion(version._id)

  // 切换到预览标签
  activeTab.value = 'preview'
}

const onNewVersionCreated = async () => {
  // 创建新版本
  if (!textContent.value.trim()) {
    // 显示提示：请先输入文本内容
    return
  }

  try {
    const { $topologyApi } = useNuxtApp()

    // 在创建版本时对文本内容进行大小写标准化处理
    const processedTextContent = textContent.value.toUpperCase()

    const response = await $topologyApi.projects.createVersion(projectId.value, {
      text_content: processedTextContent
    })

    // 重新加载项目数据
    await loadProject()

    // 选择新创建的版本
    selectedVersionId.value = response.data._id
    await loadVersion(response.data._id)

  } catch (error) {
    console.error('创建版本失败:', error)
  }
}



// 组件挂载
onMounted(() => {
  console.log('页面挂载，开始加载项目数据...')
  loadProject()
})

// 监听文本变化
watch(textContent, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    // 文本变化时的处理逻辑
  }
});
</script>

<style scoped>
.topology-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  flex-shrink: 0;
}

.editor-content {
  flex: 1;
  overflow: hidden;
  background: #fafafa;
}

.editor-panel,
.preview-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  background: #fafafa;
}

.preview-panel {
  border-right: none;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background: #fafafa;
  min-height: 64px;
  flex-shrink: 0;
}

.panel-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
}

.ai-panel {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background: #f8f9fa;
}

.text-editor {
  flex: 1;
  padding: 16px;
}

.editor-textarea {
  height: 100%;
}

.editor-textarea :deep(.v-field__input) {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.validation-result {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.preview-tabs {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
}

.preview-tabs :deep(.v-tab) {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  text-transform: none;
  letter-spacing: normal;
  min-height: 48px;
}

.preview-tabs :deep(.v-tab--selected) {
  color: rgb(25, 118, 210);
}

/* 确保左侧按钮与右侧标签页字体一致 */
.panel-header .v-btn {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  text-transform: none;
  letter-spacing: normal;
}

.preview-content {
  flex: 1;
  overflow: hidden;
}

.suggestions-tab {
  height: 100%;
  overflow: auto;
}

/* 拓扑生成、XML选项卡、版本历史选项卡和解析数据选项卡不设置overflow，让内部组件处理滚动 */
.preview-tab,
.xml-tab,
.history-tab,
.data-tab {
  height: 100%;
  overflow: hidden;
}

/* 工具栏样式 */
.editor-toolbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.editor-toolbar .v-toolbar__content {
  padding: 0 !important;
  height: 64px !important;
  display: flex !important;
  align-items: center !important;
}

/* 工具栏内容容器居中对齐 */
.editor-toolbar .d-flex {
  align-items: center !important;
  height: 100%;
}

/* 确保所有工具栏元素垂直居中 */
.editor-toolbar .v-select,
.editor-toolbar .v-btn,
.editor-toolbar .v-icon,
.editor-toolbar div {
  align-self: center;
}

/* 生成拓扑图圆形按钮样式 */
.generate-btn {
  border-radius: 50% !important;
  width: 48px !important;
  height: 48px !important;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3) !important;
  transition: all 0.3s ease !important;
  align-self: center !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.generate-btn:hover {
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4) !important;
  transform: translateY(-1px);
}

.generate-btn:active {
  transform: translateY(0);
}

.generate-btn .v-icon {
  align-self: center;
}

/* 工具栏项目信息区域 */
.editor-toolbar .text-h6 {
  line-height: 1.2;
  margin-bottom: 2px;
}

.editor-toolbar .text-caption {
  line-height: 1.1;
}

/* 版本选择按钮样式 */
.version-selector-btn {
  min-width: 160px !important;
  justify-content: space-between !important;
  text-transform: none !important;
  font-weight: 500 !important;
}

/* 保存按钮样式 */

/* 进度展示组件样式 */
.processing-steps-section {
  border-radius: 8px;
}

.processing-steps-list {
  background: transparent;
}

.step-item {
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s ease;
}

.step-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.step-avatar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.step-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-weight: 500;
}

.duration-text {
  color: #666;
  font-size: 12px;
}

.error-message {
  background-color: rgba(244, 67, 54, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.completion-section,
.failure-section {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.editor-toolbar .v-btn:not(.generate-btn) {
  border-radius: 8px !important;
  align-self: center;
  display: flex !important;
  align-items: center !important;
}

/* 项目信息区域对齐 */
.editor-toolbar .text-h6,
.editor-toolbar .text-caption {
  line-height: 1.2;
  margin: 0;
}

/* 返回按钮对齐 */
.editor-toolbar .v-btn[icon] {
  align-self: center;
}

@media (max-width: 1280px) {
  .editor-content .v-row {
    flex-direction: column;
  }

  .editor-panel,
  .preview-panel {
    height: 50vh;
  }

  /* 移动端工具栏调整 */
  .editor-toolbar .d-flex {
    flex-wrap: wrap;
    gap: 8px;
  }

  .editor-toolbar .v-select {
    width: 120px !important;
  }
}
</style>

