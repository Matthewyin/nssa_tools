<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            拓扑编辑器
          </h1>
          <p class="text-gray-600 dark:text-gray-300">
            使用AI智能生成网络拓扑图
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <NuxtLink to="/topfac" class="apple-button-secondary">
            <span class="material-symbols-outlined mr-2">arrow_back</span>
            返回
          </NuxtLink>
          <button @click="saveCurrentProject" class="apple-button-primary">
            <span class="material-symbols-outlined mr-2">save</span>
            保存项目
          </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- 左侧：输入区域 -->
        <div class="space-y-6">
          <!-- 项目信息 -->
          <div class="apple-card p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              项目信息
            </h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  项目名称
                </label>
                <input
                  v-model="projectName"
                  type="text"
                  class="apple-input"
                  placeholder="输入项目名称"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  项目描述
                </label>
                <textarea
                  v-model="projectDescription"
                  rows="3"
                  class="apple-input"
                  placeholder="输入项目描述（可选）"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- 文本输入区域 -->
          <div class="apple-card p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              网络描述
            </h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  自然语言描述
                </label>
                <textarea
                  v-model="networkDescription"
                  rows="8"
                  class="apple-input"
                  placeholder="请用自然语言描述您的网络拓扑结构，例如：&#10;&#10;生产网的未知数据中心的内联接入区有两台路由器和两台接入交换机，路由器1连接接入交换机1和接入交换机2，路由器2也连接接入交换机1和接入交换机2。"
                ></textarea>
              </div>
              <div class="flex items-center space-x-4">
                <button
                  @click="convertWithAI"
                  :disabled="!networkDescription.trim() || isConverting"
                  class="apple-button-primary"
                >
                  <span v-if="isConverting" class="material-symbols-outlined animate-spin mr-2">refresh</span>
                  <span v-else class="material-symbols-outlined mr-2">psychology</span>
                  {{ isConverting ? 'AI转换中...' : 'AI智能转换' }}
                </button>
                <button
                  @click="generateTopology"
                  :disabled="!convertedText.trim() || isGenerating"
                  class="apple-button-secondary"
                >
                  <span v-if="isGenerating" class="material-symbols-outlined animate-spin mr-2">refresh</span>
                  <span v-else class="material-symbols-outlined mr-2">hub</span>
                  {{ isGenerating ? '生成中...' : '生成拓扑图' }}
                </button>
              </div>

              <!-- 错误信息 -->
              <div v-if="error" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div class="flex items-center space-x-2">
                  <span class="material-symbols-outlined text-red-600 dark:text-red-400 text-sm">error</span>
                  <span class="text-red-700 dark:text-red-300 text-sm">{{ error }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- AI转换结果 -->
          <div v-if="convertedText" class="apple-card p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              AI转换结果
            </h2>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ convertedText }}</pre>
            </div>
          </div>
        </div>

        <!-- 右侧：预览区域 -->
        <div class="space-y-6">
          <!-- 拓扑预览 -->
          <div class="apple-card p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              拓扑预览
            </h2>
            
            <!-- 空状态 -->
            <div v-if="!topologyData" class="text-center py-12">
              <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span class="material-symbols-outlined text-gray-400 text-2xl">hub</span>
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                等待生成拓扑图
              </h3>
              <p class="text-gray-500 dark:text-gray-400">
                请输入网络描述并点击生成按钮
              </p>
            </div>

            <!-- 拓扑数据展示 -->
            <div v-else class="space-y-4">
              <div class="grid grid-cols-2 gap-4 text-center">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {{ topologyData.environments || 0 }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-300">环境</div>
                </div>
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {{ topologyData.datacenters || 0 }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-300">数据中心</div>
                </div>
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ topologyData.areas || 0 }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-300">网络区域</div>
                </div>
                <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {{ topologyData.devices || 0 }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-300">设备</div>
                </div>
              </div>

              <div class="flex items-center space-x-4">
                <button
                  @click="downloadTopology"
                  class="apple-button-primary flex-1"
                >
                  <span class="material-symbols-outlined mr-2">download</span>
                  下载DrawIO文件
                </button>
                <button
                  @click="previewXML"
                  class="apple-button-secondary"
                >
                  <span class="material-symbols-outlined mr-2">code</span>
                  预览XML
                </button>
              </div>
            </div>
          </div>

          <!-- AI配置 -->
          <div class="apple-card p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              AI配置
            </h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI提供商
                </label>
                <select v-model="aiProvider" class="apple-input">
                  <option value="gemini">Google Gemini</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API密钥
                </label>
                <input
                  v-model="apiKey"
                  type="password"
                  class="apple-input"
                  placeholder="输入API密钥"
                >
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                <p>API密钥仅在本地存储，不会上传到服务器</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面元数据
useHead({
  title: '拓扑编辑器 - 智能网络拓扑生成',
  meta: [
    { name: 'description', content: '使用AI智能生成网络拓扑图，支持自然语言描述转换' }
  ]
})

// 响应式数据
const projectName = ref('')
const projectDescription = ref('')
const networkDescription = ref('')
const convertedText = ref('')
const topologyData = ref(null)
const aiProvider = ref('gemini')
const apiKey = ref('')
const isConverting = ref(false)
const isGenerating = ref(false)
const error = ref('')

// Topfac功能
const {
  convertWithAI: convertText,
  generateTopology: generateTopo,
  saveProject,
  downloadDrawIO
} = useTopfac()

// 当前项目数据
const currentProject = ref<any>(null)
const drawioXml = ref('')

// 方法
const convertWithAI = async () => {
  if (!networkDescription.value.trim() || !apiKey.value.trim()) {
    error.value = '请输入网络描述和API密钥'
    return
  }

  isConverting.value = true
  error.value = null

  try {
    const result = await convertText(networkDescription.value, aiProvider.value, apiKey.value)

    if (result.success) {
      convertedText.value = result.result
    } else {
      error.value = result.error || 'AI转换失败'
    }
  } catch (err: any) {
    error.value = err.message || 'AI转换失败'
  } finally {
    isConverting.value = false
  }
}

const generateTopology = async () => {
  if (!convertedText.value.trim()) {
    error.value = '请先进行AI转换'
    return
  }

  isGenerating.value = true
  error.value = null

  try {
    const result = await generateTopo(convertedText.value)

    if (result.success) {
      topologyData.value = result.topology
      drawioXml.value = result.drawioXml
    } else {
      error.value = result.error || '拓扑生成失败'
    }
  } catch (err: any) {
    error.value = err.message || '拓扑生成失败'
  } finally {
    isGenerating.value = false
  }
}

const downloadTopology = () => {
  if (!drawioXml.value) {
    error.value = '没有可下载的拓扑图'
    return
  }

  const blob = new Blob([drawioXml.value], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName.value || '网络拓扑'}.drawio`
  a.click()
  URL.revokeObjectURL(url)
}

const previewXML = () => {
  if (!drawioXml.value) {
    error.value = '没有可预览的XML代码'
    return
  }

  // 在新窗口中显示XML
  const newWindow = window.open('', '_blank')
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head><title>DrawIO XML预览</title></head>
        <body>
          <h2>DrawIO XML代码</h2>
          <pre style="background: #f5f5f5; padding: 20px; overflow: auto;">${escapeHtml(drawioXml.value)}</pre>
        </body>
      </html>
    `)
    newWindow.document.close()
  }
}

const saveCurrentProject = async () => {
  if (!projectName.value.trim()) {
    error.value = '请输入项目名称'
    return
  }

  const projectData = {
    name: projectName.value,
    description: projectDescription.value,
    originalText: networkDescription.value,
    convertedText: convertedText.value,
    topologyData: topologyData.value,
    drawioXml: drawioXml.value,
    status: 'active' as const,
    versions: 1,
    devices: topologyData.value?.devices || 0,
    connections: topologyData.value?.connections?.length || 0
  }

  const result = saveProject(projectData)

  if (result.success) {
    currentProject.value = result.project
    // 显示成功消息
    console.log('项目保存成功')
  } else {
    error.value = result.error || '保存项目失败'
  }
}

// 辅助函数
const escapeHtml = (text: string) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 页面初始化
onMounted(() => {
  console.log('拓扑编辑器已加载')
  
  // 从localStorage加载API密钥
  const savedApiKey = localStorage.getItem('ai_api_key')
  if (savedApiKey) {
    apiKey.value = savedApiKey
  }
})

// 监听API密钥变化，自动保存到localStorage
watch(apiKey, (newKey) => {
  if (newKey) {
    localStorage.setItem('ai_api_key', newKey)
  } else {
    localStorage.removeItem('ai_api_key')
  }
})
</script>
