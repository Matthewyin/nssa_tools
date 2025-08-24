<template>
  <div v-if="showStatus" class="fixed bottom-4 right-4 z-40">
    <div class="apple-card p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
      <div class="flex items-center space-x-2">
        <div 
          :class="[
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          ]"
        ></div>
        <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
          Firebase {{ isConnected ? '已连接' : '未连接' }}
        </span>
        <button
          @click="hideStatus"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <span class="material-symbols-outlined text-xs">close</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $firebase } = useNuxtApp()

const showStatus = ref(false)
const isConnected = ref(false)

onMounted(() => {
  // 检查Firebase连接状态
  isConnected.value = !$firebase?.isDemo && !!$firebase?.app
  
  // 显示状态指示器
  showStatus.value = true
  
  // 5秒后自动隐藏
  setTimeout(() => {
    showStatus.value = false
  }, 5000)
})

const hideStatus = () => {
  showStatus.value = false
}
</script>
