<template>
  <!-- 全局加载遮罩 -->
  <v-overlay 
    v-model="isGlobalLoading" 
    class="align-center justify-center"
    persistent
  >
    <div class="text-center">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      />
      <div class="mt-4 text-h6">加载中...</div>
    </div>
  </v-overlay>

  <!-- 错误提示列表 -->
  <div class="error-notifications">
    <v-snackbar
      v-for="error in errors"
      :key="error.id"
      :model-value="true"
      :timeout="5000"
      :color="getErrorColor(error.type)"
      location="top right"
      variant="elevated"
      @update:model-value="removeError(error.id)"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">{{ getErrorIcon(error.type) }}</v-icon>
        <div class="flex-grow-1">
          <div class="font-weight-medium">{{ error.message }}</div>
          <div v-if="error.action" class="text-caption mt-1">
            操作：{{ error.action }}
          </div>
        </div>
      </div>
      
      <template v-slot:actions>
        <v-btn
          variant="text"
          size="small"
          @click="removeError(error.id)"
        >
          关闭
        </v-btn>
        <v-btn
          v-if="error.type === 'network' || error.type === 'api'"
          variant="text"
          size="small"
          @click="handleRetry(error)"
        >
          重试
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 由于我们现在使用GlobalNotification组件来处理错误显示
// 这个组件可以简化或者移除
const errors = ref([])
const isGlobalLoading = ref(false)

const removeError = (id: string) => {
  // 移除错误的逻辑
}

const retryOperation = (operation: any) => {
  // 重试操作的逻辑
}

/**
 * 获取错误类型对应的颜色
 */
const getErrorColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'api': 'error',
    'network': 'warning',
    'validation': 'info',
    'unknown': 'error'
  }
  return colorMap[type] || 'error'
}

/**
 * 获取错误类型对应的图标
 */
const getErrorIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'api': 'mdi-server-network-off',
    'network': 'mdi-wifi-off',
    'validation': 'mdi-alert-circle',
    'unknown': 'mdi-help-circle'
  }
  return iconMap[type] || 'mdi-alert'
}

/**
 * 处理重试操作
 */
const handleRetry = (error: any) => {
  // 这里可以根据错误类型实现具体的重试逻辑
  console.log('重试操作:', error)
  removeError(error.id)
  
  // 可以触发页面刷新或重新加载数据
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}
</script>

<style scoped>
.error-notifications {
  position: fixed;
  top: 80px;
  right: 16px;
  z-index: 9999;
  pointer-events: none;
}

.error-notifications .v-snackbar {
  pointer-events: auto;
  position: relative !important;
  margin-bottom: 8px;
}

/* 自定义加载遮罩样式 */
:deep(.v-overlay__content) {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
</style> 