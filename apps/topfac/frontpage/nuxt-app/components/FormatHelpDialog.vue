<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    scrollable
  >
    <v-card class="format-help-dialog">
      <!-- 对话框标题 -->
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-3" color="info">mdi-help-circle</v-icon>
        <span class="text-h5 font-weight-bold">拓扑文本格式说明</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>
      
      <v-divider />
      
      <!-- 内容区域 -->
      <v-card-text class="pa-6">
        <div class="format-help-content">
          <!-- 概述 -->
          <section class="format-section mb-8">
            <h3 class="section-title text-h6 font-weight-bold mb-4">
              <v-icon class="mr-2" color="primary">mdi-information-outline</v-icon>
              格式概述
            </h3>
            <div class="section-content">
              <p class="text-body-1 mb-4 line-height-relaxed">
                网络拓扑描述支持自然语言和结构化文本，用于定义网络设备、区域和连接关系。
              </p>
              <p class="text-body-1 mb-4 line-height-relaxed">
                系统会智能解析描述内容并生成可视化拓扑图。
              </p>
              <v-alert type="info" variant="tonal" density="comfortable" class="info-alert">
                <template #prepend>
                  <v-icon>mdi-lightbulb-outline</v-icon>
                </template>
                <div class="alert-content">
                  <strong>智能提示：</strong>
                  <span class="ml-1">描述格式灵活，支持自然语言描述，AI会自动理解并解析网络拓扑结构。</span>
                </div>
              </v-alert>
            </div>
          </section>
          
          <!-- 基本结构 -->
          <section class="format-section mb-8">
            <h3 class="section-title text-h6 font-weight-bold mb-4">
              <v-icon class="mr-2" color="success">mdi-file-tree</v-icon>
              基本结构
            </h3>

            <div class="section-content">
              <p class="text-body-1 mb-4 line-height-relaxed">
                网络拓扑描述采用标准化格式，每行描述一个连接关系，格式为：
              </p>

              <v-card variant="outlined" class="code-example-card mb-4">
                <v-card-text class="pa-4">
                  <div class="format-example-text">
                    <p class="text-body-2 mb-0">- 【环境】【数据中心】的【区域】【设备】连接【环境】【数据中心】的【区域】【设备】</p>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </section>
          

          

          
          <!-- 注意事项 -->
          <section class="format-section">
            <h3 class="section-title text-h6 font-weight-bold mb-4">
              <v-icon class="mr-2" color="error">mdi-alert-circle-outline</v-icon>
              注意事项
            </h3>

            <div class="section-content">
              <v-alert type="warning" variant="tonal" density="comfortable" class="mb-4 warning-alert">
                <template #prepend>
                  <v-icon>mdi-alert-outline</v-icon>
                </template>
                <div class="alert-content">
                  <strong class="mb-2 d-block">格式要求：</strong>
                  <ul class="alert-list mb-0">
                    <li>请严格按照格式要求输入，否则可能导致解析错误</li>
                  </ul>
                </div>
              </v-alert>
            </div>
          </section>
        </div>
      </v-card-text>
      
      <!-- 操作按钮 -->
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          @click="$emit('update:modelValue', false)"
        >
          我知道了
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
// 定义 props
interface Props {
  modelValue: boolean
}

defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.format-help-dialog {
  border-radius: 16px !important;
}

.format-help-content {
  max-height: 70vh;
  overflow-y: auto;
}

.format-example-text,
.example-text,
.complete-example-text {
  background: #f8f9fa !important;
  border-radius: 12px !important;
  padding: 24px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  margin: 20px 0 !important;
}

.format-example-text .text-body-2,
.example-text .text-body-2,
.complete-example-text .text-body-2 {
  line-height: 1.6 !important;
  color: #2d3748 !important;
}

.format-example-text .ml-4,
.example-text .ml-4,
.complete-example-text .ml-4 {
  margin-left: 24px !important;
}

.complete-example {
  max-height: 450px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.complete-example::-webkit-scrollbar {
  width: 6px;
}

.complete-example::-webkit-scrollbar-track {
  background: transparent;
}

.complete-example::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.warning-alert,
.success-alert {
  border-radius: 12px !important;
  margin-bottom: 16px;
}

.alert-list {
  margin-top: 8px;
}

.alert-list li {
  margin-bottom: 6px;
  line-height: 1.5;
}

.v-expansion-panel {
  border-radius: 8px !important;
  margin-bottom: 8px !important;
}

.v-alert {
  border-radius: 8px !important;
}

.v-btn {
  border-radius: 8px !important;
}

/* 格式说明区域样式优化 */
.format-section {
  scroll-margin-top: 20px !important;
  padding: 24px 0 !important;
  margin-bottom: 32px !important;
}

.section-title {
  display: flex !important;
  align-items: center !important;
  margin-bottom: 20px !important;
  color: rgba(0, 0, 0, 0.87) !important;
  font-size: 1.25rem !important;
}

.section-content {
  padding-left: 12px !important;
}

.section-content p {
  line-height: 1.8 !important;
  color: rgba(0, 0, 0, 0.75) !important;
  margin-bottom: 20px !important;
  font-size: 1rem !important;
}

.line-height-relaxed {
  line-height: 1.8 !important;
  color: rgba(0, 0, 0, 0.75) !important;
  margin-bottom: 20px !important;
}

.info-alert {
  margin-top: 16px;
  border-radius: 12px !important;
}

.alert-content {
  line-height: 1.6;
}

.code-example-card {
  border-radius: 12px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.expansion-panels {
  border-radius: 12px !important;
}

.panel-content {
  padding: 24px !important;
}

.content-section {
  padding: 12px 0 !important;
}

.content-section p {
  line-height: 1.8 !important;
  margin-bottom: 20px !important;
  color: rgba(0, 0, 0, 0.75) !important;
  font-size: 1rem !important;
}

.code-block {
  margin: 20px 0 !important;
}

.info-note {
  border-radius: 8px !important;
  margin-top: 16px;
}

ul {
  padding-left: 28px !important;
  margin: 20px 0 !important;
}

li {
  margin-bottom: 12px !important;
  line-height: 1.7 !important;
  color: rgba(0, 0, 0, 0.75) !important;
  font-size: 0.95rem !important;
}

.v-expansion-panel-text {
  padding: 24px !important;
}

.v-expansion-panel-text p {
  line-height: 1.8 !important;
  margin-bottom: 20px !important;
  color: rgba(0, 0, 0, 0.75) !important;
}

code {
  background: rgba(0, 0, 0, 0.06);
  padding: 3px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #d63384;
}
</style>
