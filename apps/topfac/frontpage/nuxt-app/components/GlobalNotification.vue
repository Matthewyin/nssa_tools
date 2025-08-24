<template>
  <v-snackbar
    v-model="show"
    :color="notificationColor"
    :timeout="notification && notification.duration ? notification.duration : 5000"
    :persistent="notification && notification.persistent ? notification.persistent : false"
    location="top right"
    variant="elevated"
    class="global-notification"
  >
    <div class="d-flex align-center">
      <v-icon
        :icon="notificationIcon"
        class="mr-3"
        size="24"
      />
      <div class="flex-grow-1">
        <div class="font-weight-bold mb-1">{{ notification && notification.title ? notification.title : '' }}</div>
        <div class="text-body-2">{{ notification && notification.message ? notification.message : '' }}</div>
      </div>
    </div>

    <template #actions>
      <div class="d-flex gap-2">
        <!-- 自定义操作按钮 -->
        <v-btn
          v-for="action in (notification && notification.actions ? notification.actions : [])"
          :key="action.label"
          variant="text"
          size="small"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </v-btn>
        
        <!-- 关闭按钮 -->
        <v-btn
          icon
          size="small"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useErrorHandler, NotificationType } from '~/composables/useErrorHandler'
import type { NotificationInfo } from '~/composables/useErrorHandler'

// 响应式数据
const show = ref(false)
const notification = ref<NotificationInfo | null>(null)

// 错误处理器实例
const errorHandler = useErrorHandler()

// 计算属性
const notificationColor = computed(() => {
  if (!notification.value) return 'primary'
  
  switch (notification.value.type) {
    case NotificationType.SUCCESS:
      return 'success'
    case NotificationType.ERROR:
      return 'error'
    case NotificationType.WARNING:
      return 'warning'
    case NotificationType.INFO:
      return 'info'
    default:
      return 'primary'
  }
})

const notificationIcon = computed(() => {
  if (!notification.value) return 'mdi-information'
  
  switch (notification.value.type) {
    case NotificationType.SUCCESS:
      return 'mdi-check-circle'
    case NotificationType.ERROR:
      return 'mdi-alert-circle'
    case NotificationType.WARNING:
      return 'mdi-alert'
    case NotificationType.INFO:
      return 'mdi-information'
    default:
      return 'mdi-information'
  }
})

// 方法
const showNotification = (notificationInfo: NotificationInfo) => {
  notification.value = notificationInfo
  show.value = true
}

const handleAction = (action: { label: string; action: () => void }) => {
  action.action()
  close()
}

const close = () => {
  show.value = false
  setTimeout(() => {
    notification.value = null
  }, 300)
}

// 生命周期
onMounted(() => {
  // 注册通知回调
  errorHandler.setNotificationCallback(showNotification)
})
</script>

<style scoped>
.global-notification {
  z-index: 9999;
}

.global-notification :deep(.v-snackbar__wrapper) {
  min-width: 400px;
  max-width: 600px;
}

.global-notification :deep(.v-snackbar__content) {
  padding: 16px;
}
</style>
