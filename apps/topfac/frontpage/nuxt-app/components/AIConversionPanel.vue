<template>
  <v-card class="ai-conversion-panel" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-robot</v-icon>
      <span>🤖 AI智能转换</span>
      <v-spacer />
      <v-btn
        icon
        size="small"
        @click="showHelp = true"
      >
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- AI模型选择 -->
      <div class="mb-4">
        <v-label class="mb-2">AI模型选择：</v-label>
        <v-radio-group
          v-model="selectedProvider"
          inline
          hide-details
          @update:model-value="onProviderChange"
        >
          <v-radio
            v-for="provider in availableProviders"
            :key="provider.value"
            :label="provider.label"
            :value="provider.value"
          >
            <template #label>
              <div class="d-flex align-center">
                <v-icon :icon="provider.icon" class="mr-1" size="small" />
                {{ provider.label }}
              </div>
            </template>
          </v-radio>
        </v-radio-group>
      </div>

      <!-- 模型选择 -->
      <div class="mb-4">
        <v-label class="mb-2">模型选择：</v-label>
        <v-select
          v-model="selectedModel"
          :items="currentProviderModels"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="compact"
          hide-details
        >
          <template #selection="{ item }">
            <div class="d-flex align-center">
              <v-icon :icon="currentProviderInfo?.icon" class="mr-2" size="small" />
              {{ item.title }}
            </div>
          </template>
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon :icon="currentProviderInfo?.icon" class="mr-2" />
              </template>
            </v-list-item>
          </template>
        </v-select>
      </div>

      <!-- AI配置状态 -->
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between">
          <v-label>AI配置状态：</v-label>
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            @click="$emit('openConfig')"
          >
            <v-icon icon="mdi-cog" size="small" class="mr-1" />
            配置AI
          </v-btn>
        </div>

        <v-card variant="outlined" class="mt-2 pa-3">
          <div class="d-flex align-center">
            <v-icon :icon="currentProviderInfo?.icon" class="mr-2" />
            <div class="flex-grow-1">
              <div class="text-subtitle-2">{{ getProviderName(selectedProvider) }}</div>
              <div class="text-caption text-medium-emphasis">{{ selectedModel }}</div>
            </div>
            <v-chip
              :color="hasStoredApiKey ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >
              {{ hasStoredApiKey ? '已配置' : '未配置' }}
            </v-chip>
          </div>
        </v-card>
      </div>

      <!-- 自然语言输入 -->
      <div class="mb-4">
        <v-label class="mb-2">自然语言输入：</v-label>
        <v-textarea
          v-model="naturalInput"
          placeholder="请用自然语言描述您的网络拓扑，例如：生产环境的亦庄数据中心内联接入区路由器1和路由器2与接入交换机全互联..."
          variant="outlined"
          rows="4"
          auto-grow
          hide-details
          class="natural-input"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="d-flex gap-2 mb-4">
        <v-btn
          color="primary"
          :loading="converting"
          :disabled="!canConvert"
          @click="convertText"
        >
          <v-icon start>mdi-auto-fix</v-icon>
          AI转换
        </v-btn>
        <v-btn
          variant="outlined"
          @click="showExamples = true"
        >
          <v-icon start>mdi-text-box-multiple</v-icon>
          示例
        </v-btn>
        <v-btn
          variant="outlined"
          @click="showHelp = true"
        >
          <v-icon start>mdi-help-circle</v-icon>
          帮助
        </v-btn>
      </div>

      <!-- 转换结果预览 -->
      <div v-if="conversionResult" class="conversion-result">
        <v-label class="mb-2">转换结果预览：</v-label>
        <v-card variant="outlined" class="mb-3">
          <v-card-text>
            <pre class="converted-text">{{ conversionResult.converted_text }}</pre>
          </v-card-text>
        </v-card>
        
        <!-- 验证结果 -->
        <div v-if="conversionResult.validation" class="mb-3">
          <v-chip
            :color="conversionResult.validation.is_valid ? 'success' : 'warning'"
            size="small"
            variant="tonal"
            class="mr-2"
          >
            <v-icon start>{{ conversionResult.validation.is_valid ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
            {{ conversionResult.validation.is_valid ? '格式正确' : '格式警告' }}
          </v-chip>
          <span class="text-caption">
            有效行数: {{ conversionResult.validation.valid_lines || 0 }} / 
            总行数: {{ conversionResult.validation.total_lines || 0 }}
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="d-flex gap-2">
          <v-btn
            color="success"
            @click="confirmUse"
          >
            <v-icon start>mdi-check</v-icon>
            确认使用
          </v-btn>
          <v-btn
            variant="outlined"
            @click="editResult"
          >
            <v-icon start>mdi-pencil</v-icon>
            手动编辑
          </v-btn>
          <v-btn
            variant="outlined"
            @click="regenerate"
            :loading="converting"
          >
            <v-icon start>mdi-refresh</v-icon>
            重新生成
          </v-btn>
        </div>
      </div>
    </v-card-text>

    <!-- 帮助对话框 -->
    <v-dialog v-model="showHelp" max-width="600">
      <v-card>
        <v-card-title>AI智能转换帮助</v-card-title>
        <v-card-text>
          <h4>功能说明：</h4>
          <p>AI智能转换可以将您的自然语言描述转换为标准的网络拓扑格式。</p>
          
          <h4>支持的AI模型：</h4>
          <ul>
            <li><strong>Google Gemini</strong>: Google的多模态大语言模型</li>
            <li><strong>DeepSeek</strong>: 专注于代码和推理的大语言模型</li>
          </ul>
          
          <h4>使用步骤：</h4>
          <ol>
            <li>选择AI模型</li>
            <li>配置对应的API Key</li>
            <li>输入自然语言描述</li>
            <li>点击"AI转换"</li>
            <li>确认转换结果</li>
          </ol>
          
          <h4>输入示例：</h4>
          <p>"生产环境的亦庄数据中心内联接入区路由器1和路由器2与接入交换机全互联"</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showHelp = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 示例对话框 -->
    <v-dialog v-model="showExamples" max-width="700">
      <v-card>
        <v-card-title>输入示例</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="(example, index) in examples"
              :key="index"
              @click="useExample(example)"
              class="example-item"
            >
              <v-list-item-title>{{ example.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ example.description }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showExamples = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// AI API 已迁移到 Cloudflare Workers
import { handleError, showSuccess } from '~/composables/useErrorHandler'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'converted', 'openConfig'])

// AI 服务已迁移到 Cloudflare Workers

// 响应式数据
const selectedProvider = ref('gemini')
const selectedModel = ref('gemini-2.5-flash')
const naturalInput = ref('')
const converting = ref(false)
const conversionResult = ref<any>(null)
const showHelp = ref(false)
const showExamples = ref(false)
const hasStoredApiKey = ref(false)
const currentApiKey = ref('')

// 可用的AI提供商
const availableProviders = ref([
  {
    value: 'gemini',
    label: 'Google Gemini',
    icon: 'mdi-google',
    hint: 'AIzaSy开头，约39字符',
    models: [
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
    defaultModel: 'gemini-2.5-flash'
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    icon: 'mdi-brain',
    hint: 'sk-开头，30-50字符',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek V3' },
      { value: 'deepseek-reasoner', label: 'DeepSeek R1' }
    ],
    defaultModel: 'deepseek-chat'
  }
])

// 示例数据
const examples = ref([
  {
    title: '简单互联',
    description: '生产环境的数据中心内联接入区路由器1和路由器2与2台接入交换机全互联'
  },
  {
    title: '应用互访',
    description: '大观园生产机房的华为私有云上的客服应用访问花果山测试机房的阿里云上的订单应用'
  },
  {
    title: '多网互联',
    description: '生产环境的新街口和徐家汇两个数据中心的核心路由器通过专线连接，每个数据中心内部核心区域的2台核心路由器与2台核心交换机全互联'
  }
])

// 计算属性
const canConvert = computed(() => {
  return naturalInput.value.trim() && currentApiKey.value.trim() && !converting.value
})



const currentProviderModels = computed(() => {
  const provider = availableProviders.value.find(p => p.value === selectedProvider.value)
  return provider ? provider.models : []
})

const currentProviderInfo = computed(() => {
  return availableProviders.value.find(p => p.value === selectedProvider.value)
})

// 方法
const getProviderName = (provider: string) => {
  const providerInfo = availableProviders.value.find(p => p.value === provider)
  return providerInfo ? providerInfo.label : provider
}



const onProviderChange = async () => {
  // 切换提供商时设置默认模型
  const provider = currentProviderInfo.value
  if (provider) {
    selectedModel.value = provider.defaultModel
  }

  // 切换提供商时加载对应的API Key
  const storedKey = await getStoredApiKey(selectedProvider.value)
  currentApiKey.value = storedKey || ''
  hasStoredApiKey.value = !!storedKey
}



const getStoredApiKey = async (provider: string) => {
  // 从本地存储获取 API Key
  try {
    const key = localStorage.getItem(`ai_api_key_${provider}`)
    return key
  } catch (error) {
    console.warn('获取存储的 API Key 失败:', error)
    return null
  }
}

// 刷新配置状态的方法
const refreshConfigStatus = async () => {
  const storedKey = await getStoredApiKey(selectedProvider.value)
  currentApiKey.value = storedKey || ''
  hasStoredApiKey.value = !!storedKey
  console.log('AI配置状态已刷新:', { provider: selectedProvider.value, hasKey: hasStoredApiKey.value })
}

// 暴露给父组件的方法
defineExpose({
  refreshConfigStatus
})





const convertText = async () => {
  if (!canConvert.value) return

  converting.value = true
  conversionResult.value = null

  try {
    // 直接调用后端 API
    const response = await fetch('/api/ai/convert-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: selectedProvider.value,
        api_key: currentApiKey.value,
        natural_input: naturalInput.value,
        model_name: selectedModel.value
      })
    })

    const result = await response.json()

    if (result.success) {
      conversionResult.value = result.data
      showSuccess('AI转换完成')
    } else {
      throw new Error(result.error || '转换失败')
    }
  } catch (error) {
    handleError(error, {
      action: 'convertText',
      provider: selectedProvider.value,
      inputLength: naturalInput.value.length
    })
  } finally {
    converting.value = false
  }
}

const confirmUse = () => {
  if (conversionResult.value) {
    emit('update:modelValue', conversionResult.value.converted_text)
    emit('converted', conversionResult.value)
    conversionResult.value = null
    naturalInput.value = ''
  }
}

const editResult = () => {
  if (conversionResult.value) {
    emit('update:modelValue', conversionResult.value.converted_text)
    conversionResult.value = null
    naturalInput.value = ''
  }
}

const regenerate = () => {
  convertText()
}

const useExample = (example: any) => {
  naturalInput.value = example.description
  showExamples.value = false
}

// 生命周期
onMounted(() => {
  // 加载存储的API Key
  onProviderChange()
})
</script>

<style scoped>
.ai-conversion-panel {
  margin-bottom: 16px;
}

.natural-input :deep(.v-field__input) {
  font-family: 'Courier New', monospace;
}

.converted-text {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.conversion-result {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

.example-item {
  cursor: pointer;
}

.example-item:hover {
  background-color: #f5f5f5;
}
</style>
