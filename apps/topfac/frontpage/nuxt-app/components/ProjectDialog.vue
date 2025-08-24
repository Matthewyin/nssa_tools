<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    persistent
  >
    <v-card class="project-dialog">
      <!-- 对话框标题 -->
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-3" color="primary">
          {{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}
        </v-icon>
        <span class="text-h5 font-weight-bold">
          {{ isEditing ? '编辑项目' : '创建新项目' }}
        </span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>
      
      <v-divider />
      
      <!-- 表单内容 -->
      <v-card-text class="pa-6">
        <v-form ref="formRef" v-model="formValid" @submit.prevent="saveProject">
          <v-row>
            <!-- 项目名称 -->
            <v-col cols="12">
              <v-text-field
                v-model="form.project_name"
                label="项目名称"
                placeholder="请输入项目名称"
                variant="outlined"
                :rules="nameRules"
                :counter="100"
                required
                prepend-inner-icon="mdi-folder-outline"
              />
            </v-col>
            
            <!-- 项目描述 -->
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="项目描述"
                placeholder="请输入项目描述（可选）"
                variant="outlined"
                :rules="descriptionRules"
                :counter="500"
                rows="3"
                auto-grow
                prepend-inner-icon="mdi-text"
              />
            </v-col>
            
            <!-- 初始文本内容 -->
            <v-col cols="12">
              <v-textarea
                v-model="form.text_content"
                :label="isEditing ? '拓扑文本内容' : '拓扑文本模板（可直接修改）'"
                :placeholder="isEditing ? '请输入网络拓扑描述文本' : '已提供默认模板，您可以直接在此基础上修改'"
                variant="outlined"
                :rules="textContentRules"
                rows="12"
                auto-grow
                prepend-inner-icon="mdi-file-document-outline"
              >
                <template #append-inner>
                  <v-tooltip text="查看文本格式说明">
                    <template #activator="{ props }">
                      <v-btn
                        icon="mdi-help-circle-outline"
                        variant="text"
                        size="small"
                        v-bind="props"
                        @click="showFormatHelp = true"
                      />
                    </template>
                  </v-tooltip>
                </template>
              </v-textarea>

              <!-- 新项目提示 -->
              <div v-if="!isEditing" class="text-caption text-grey-darken-1 mt-2">
                💡 <strong>提示：</strong>已为您提供一个企业网络拓扑模板，您可以直接在此基础上修改，或者清空后重新编写
              </div>
            </v-col>
            
            <!-- 格式提示 -->
            <v-col cols="12">
              <v-alert
                type="info"
                variant="tonal"
                density="compact"
                class="text-body-2"
              >
                <template #prepend>
                  <v-icon>mdi-information-outline</v-icon>
                </template>
                <strong>提示：</strong>
                支持标准化的网络拓扑描述格式，包括区域定义、组件定义和连接关系。
                可以在创建后继续编辑和完善。
              </v-alert>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      
      <!-- 操作按钮 -->
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn
          variant="text"
          @click="closeDialog"
          :disabled="saving"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!formValid"
          @click="saveProject"
        >
          {{ isEditing ? '保存更改' : '创建项目' }}
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- 格式帮助对话框 -->
    <v-dialog v-model="showFormatHelp" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-3" color="info">mdi-help-circle</v-icon>
          文本格式说明
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showFormatHelp = false"
          />
        </v-card-title>
        
        <v-divider />
        
        <v-card-text class="pa-6">
          <div class="format-help">
            <h4 class="text-h6 mb-3">标准格式示例：</h4>
            
            <div class="format-example-text">
              <p class="text-body-2 mb-2"><strong>网络拓扑语言描述格式：</strong></p>
              <p class="text-body-2 mb-1">- 【环境】【数据中心】的【区域】【设备】连接【环境】【数据中心】的【区域】【设备】 </p>
            </div>
            
            <h4 class="text-h6 mt-6 mb-3">格式说明：</h4>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-numeric-1-circle</v-icon>
                </template>
                <v-list-item-title>每行以 "-" 开头描述一个连接关系</v-list-item-title>
              </v-list-item>
              
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-numeric-2-circle</v-icon>
                </template>
                <v-list-item-title>
                  使用【环境】【数据中心】的【区域】【设备】连接 
                </v-list-item-title>
                <v-list-item-title>
                  【环境】【数据中心】的【区域】【设备】格式
                </v-list-item-title>
              </v-list-item>
              
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-numeric-3-circle</v-icon>
                </template>
                <v-list-item-title>设备名可以是主机名、应用名或网络设备名称</v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            @click="showFormatHelp = false"
          >
            我知道了
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'

// 定义 props
interface Project {
  id?: string
  project_name: string
  description?: string
  text_content?: string
  status?: string
}

interface Props {
  modelValue: boolean
  project?: Project | null
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

// 响应式数据
const formRef = ref()
const formValid = ref(false)
const saving = ref(false)
const showFormatHelp = ref(false)

// 表单数据
const form = reactive({
  project_name: '',
  description: '',
  text_content: ''
})

// 计算属性
const isEditing = computed(() => !!props.project?.id)

// 验证规则
const nameRules = [
  (v: string) => !!v || '项目名称不能为空',
  (v: string) => (v && v.length <= 100) || '项目名称不能超过100个字符',
  (v: string) => /^[a-zA-Z0-9\u4e00-\u9fff\s\-_]+$/.test(v) || '项目名称只能包含字母、数字、中文、空格、横线和下划线'
]

const descriptionRules = [
  (v: string) => !v || v.length <= 500 || '项目描述不能超过500个字符'
]

const textContentRules = [
  (v: string) => !v || v.length <= 100000 || '文本内容不能超过100000个字符'
]

// 默认模板文字 - 移到前面避免初始化顺序问题
const getDefaultTemplate = () => {
  return `
- 【环境】【数据中心】的【区域】【设备】连接【环境】【数据中心】的【区域】【设备】
`
}

// 重置表单 - 移到前面避免初始化顺序问题
const resetForm = () => {
  form.project_name = ''
  form.description = ''
  // 为新项目提供默认模板文字
  form.text_content = isEditing.value ? '' : getDefaultTemplate()

  nextTick(() => {
    formRef.value?.resetValidation()
  })
}

// 监听项目变化，更新表单
watch(() => props.project, (newProject) => {
  if (newProject) {
    // 编辑现有项目
    form.project_name = newProject.project_name || ''
    form.description = newProject.description || ''
    form.text_content = newProject.text_content || ''
  } else {
    // 创建新项目
    resetForm()
  }
}, { immediate: true })

// 关闭对话框
const closeDialog = () => {
  emit('update:modelValue', false)
  resetForm()
}

// 保存项目
const saveProject = async () => {
  if (!formValid.value) return
  
  saving.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    
    const projectData = {
      project_name: form.project_name.trim(),
      description: form.description.trim(),
      text_content: form.text_content.trim()
    }
    
    if (isEditing.value && props.project?.id) {
      // 更新项目
      await $topologyApi.projects.update(props.project.id, projectData)
    } else {
      // 创建项目
      await $topologyApi.projects.create(projectData)
    }
    
    emit('saved')
    closeDialog()
  } catch (error: any) {
    console.error('保存项目失败:', error)

    // 处理不同类型的错误
    let errorMessage = '保存项目失败，请稍后重试'

    if (error?.data?.error) {
      // 后端返回的具体错误信息
      errorMessage = error.data.error
    } else if (error?.message) {
      // 网络或其他错误
      errorMessage = error.message
    }

    // 显示错误提示（这里可以集成Vuetify的snackbar或其他提示组件）
    alert(errorMessage) // 临时使用alert，后续可以改为更好的UI组件
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.project-dialog {
  border-radius: 16px !important;
}

.format-example-text {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.format-example-text .text-body-2 {
  line-height: 1.6;
  color: #2d3748;
}

.format-example-text .ml-4 {
  margin-left: 24px;
}

.format-help {
  max-height: 500px;
  overflow-y: auto;
}

.v-text-field,
.v-textarea {
  border-radius: 8px !important;
}

.v-btn {
  border-radius: 8px !important;
}

.v-alert {
  border-radius: 8px !important;
}
</style>
