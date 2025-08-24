<template>
  <div class="ai-config-panel">
    <!-- AI 提供商选择 -->
    <div class="mb-4">
      <v-label class="mb-2">选择AI提供商：</v-label>
      <v-select
        v-model="selectedProvider"
        :items="aiProviders"
        item-title="name"
        item-value="id"
        variant="outlined"
        @update:model-value="onProviderChange"
      >
        <template #prepend-inner>
          <v-icon :icon="getProviderIcon(selectedProvider)" />
        </template>
      </v-select>
    </div>

    <!-- 模型选择 -->
    <div class="mb-4">
      <v-label class="mb-2">模型选择：</v-label>
      <v-select
        v-model="selectedModel"
        :items="currentProviderModels"
        item-title="name"
        item-value="id"
        variant="outlined"
      >
        <template #prepend-inner>
          <v-icon icon="mdi-brain" />
        </template>
      </v-select>
    </div>

    <!-- API Key 配置 -->
    <div class="mb-4">
      <v-label class="mb-2">API Key配置：</v-label>
      <v-text-field
        v-model="apiKey"
        :placeholder="`输入${getProviderName(selectedProvider)} API Key...`"
        variant="outlined"
        :type="showApiKey ? 'text' : 'password'"
        :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showApiKey = !showApiKey"
      />
    </div>

    <!-- 操作按钮 -->
    <div class="mb-4">
      <v-btn
        color="primary"
        variant="elevated"
        class="mr-2"
        @click="saveApiKey"
        :loading="saving"
      >
        <v-icon icon="mdi-content-save" class="mr-1" />
        保存
      </v-btn>
      
      <v-btn
        color="success"
        variant="outlined"
        class="mr-2"
        @click="testApiKey"
        :loading="testing"
        :disabled="!apiKey"
      >
        <v-icon icon="mdi-test-tube" class="mr-1" />
        测试连接
      </v-btn>
      
      <v-btn
        color="warning"
        variant="outlined"
        @click="clearApiKey"
      >
        <v-icon icon="mdi-delete" class="mr-1" />
        清除
      </v-btn>
    </div>

    <!-- 已保存的 API Key 显示 -->
    <div class="mb-4">
      <v-label class="mb-2">已保存的API Key：</v-label>
      <v-text-field
        :model-value="maskedStoredKey"
        variant="outlined"
        readonly
        placeholder="暂无已保存的API Key"
        :prepend-inner-icon="hasStoredKey ? 'mdi-check-circle' : 'mdi-alert-circle'"
        :color="hasStoredKey ? 'success' : 'warning'"
      />
    </div>

    <!-- 如何获取 API Key 帮助 -->
    <v-expansion-panels class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon icon="mdi-help-circle" class="mr-2" />
          如何获取API Key？
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="help-content">
            <div v-if="selectedProvider === 'gemini'" class="provider-help">
              <h4>Google Gemini API Key</h4>
              <ol>
                <li>访问 <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                <li>登录您的 Google 账户</li>
                <li>点击 "Create API Key" 按钮</li>
                <li>复制生成的 API Key</li>
              </ol>
            </div>
            
            <div v-else-if="selectedProvider === 'deepseek'" class="provider-help">
              <h4>DeepSeek API Key</h4>
              <ol>
                <li>访问 <a href="https://platform.deepseek.com/" target="_blank">DeepSeek Platform</a></li>
                <li>登录您的 DeepSeek 账户</li>
                <li>进入 API Keys 页面</li>
                <li>创建新的 API Key</li>
              </ol>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Emits
const emit = defineEmits(['close', 'configSaved'])

// 响应式数据
const selectedProvider = ref('gemini')
const selectedModel = ref('gemini-2.5-flash')
const apiKey = ref('')
const showApiKey = ref(false)
const saving = ref(false)
const testing = ref(false)
const storedKeys = ref<Record<string, string>>({})

// AI 提供商配置
const aiProviders = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'mdi-google'
  },
  {
    id: 'deepseek', 
    name: 'DeepSeek',
    icon: 'mdi-robot'
  }
]

// 模型配置
const modelConfigs = {
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' }
  ]
}

// 计算属性
const currentProviderModels = computed(() => {
  return modelConfigs[selectedProvider.value as keyof typeof modelConfigs] || []
})

const hasStoredKey = computed(() => {
  return !!storedKeys.value[selectedProvider.value]
})

const maskedStoredKey = computed(() => {
  const key = storedKeys.value[selectedProvider.value]
  if (!key) return ''
  return key.substring(0, 8) + '...' + key.substring(key.length - 4)
})

// 方法
const getProviderIcon = (providerId: string) => {
  const provider = aiProviders.find(p => p.id === providerId)
  return provider?.icon || 'mdi-robot'
}

const getProviderName = (providerId: string) => {
  const provider = aiProviders.find(p => p.id === providerId)
  return provider?.name || 'AI'
}

const onProviderChange = () => {
  // 切换提供商时，选择第一个可用模型
  const models = currentProviderModels.value
  if (models.length > 0) {
    selectedModel.value = models[0].id
  }
  
  // 加载该提供商的 API Key
  loadStoredApiKey()
}

const loadStoredApiKey = () => {
  const key = localStorage.getItem(`ai_api_key_${selectedProvider.value}`)
  if (key) {
    storedKeys.value[selectedProvider.value] = key
  }
}

const saveApiKey = async () => {
  if (!apiKey.value.trim()) {
    alert('请输入 API Key')
    return
  }
  
  saving.value = true
  try {
    // 保存到本地存储
    localStorage.setItem(`ai_api_key_${selectedProvider.value}`, apiKey.value.trim())
    storedKeys.value[selectedProvider.value] = apiKey.value.trim()

    // 清空输入框
    apiKey.value = ''

    // 发出配置保存成功事件
    emit('configSaved', {
      provider: selectedProvider.value,
      model: selectedModel.value,
      hasApiKey: true
    })

    // 使用更友好的通知方式
    console.log('API Key 保存成功！')
    // 这里可以使用全局通知组件，暂时使用console.log
  } catch (error) {
    console.error('保存 API Key 失败:', error)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const testApiKey = async () => {
  const keyToTest = apiKey.value || storedKeys.value[selectedProvider.value]
  if (!keyToTest) {
    alert('请先输入或保存 API Key')
    return
  }
  
  testing.value = true
  try {
    // 调用后端 API 测试连接
    const response = await fetch('/api/ai/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: selectedProvider.value,
        api_key: keyToTest,
        model_name: selectedModel.value
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert('API Key 测试成功！连接正常')
    } else {
      alert(`API Key 测试失败：${result.error || '未知错误'}`)
    }
  } catch (error) {
    console.error('API Key 测试失败:', error)
    alert('测试失败，请检查网络连接')
  } finally {
    testing.value = false
  }
}

const clearApiKey = () => {
  if (confirm('确定要清除已保存的 API Key 吗？')) {
    localStorage.removeItem(`ai_api_key_${selectedProvider.value}`)
    delete storedKeys.value[selectedProvider.value]
    apiKey.value = ''
    alert('API Key 已清除')
  }
}

// 生命周期
onMounted(() => {
  // 加载所有提供商的 API Key
  aiProviders.forEach(provider => {
    const key = localStorage.getItem(`ai_api_key_${provider.id}`)
    if (key) {
      storedKeys.value[provider.id] = key
    }
  })
  
  // 设置默认模型
  onProviderChange()
})
</script>

<style scoped>
.ai-config-panel {
  max-width: 100%;
  padding: 16px;
}

.help-content {
  padding: 16px 0;
}

.provider-help h4 {
  color: rgb(var(--v-theme-primary));
  margin-bottom: 12px;
  font-weight: 600;
}

.provider-help ol {
  padding-left: 20px;
}

.provider-help li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.provider-help a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.provider-help a:hover {
  text-decoration: underline;
}

.v-label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  display: block;
}
</style>
