<template>
  <div class="min-h-screen">
    <!-- 英雄区域 -->
    <section class="relative py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NSSA工具集
            </span>
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            集成定时任务管理和智能网络拓扑生成的一站式工具平台，提升您的工作效率
          </p>
        </div>

        <!-- 工具卡片网格 -->
        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- 定时任务工具卡片 -->
          <div class="apple-card p-8 group cursor-pointer" @click="navigateToCron">
            <div class="text-center">
              <!-- 图标 -->
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-apple-lg mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-white text-2xl">schedule</span>
              </div>
              
              <!-- 标题和描述 -->
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                定时任务管理
              </h2>
              <p class="text-gray-600 dark:text-gray-300 mb-6">
                企业微信Webhook定时任务工具，支持灵活的调度规则和任务管理
              </p>
              
              <!-- 功能特性 -->
              <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div class="flex items-center justify-center space-x-2">
                  <span class="material-symbols-outlined text-xs">check_circle</span>
                  <span>企业微信集成</span>
                </div>
                <div class="flex items-center justify-center space-x-2">
                  <span class="material-symbols-outlined text-xs">check_circle</span>
                  <span>灵活调度规则</span>
                </div>
                <div class="flex items-center justify-center space-x-2">
                  <span class="material-symbols-outlined text-xs">check_circle</span>
                  <span>任务状态监控</span>
                </div>
              </div>
              
              <!-- 状态标识 -->
              <div class="flex items-center justify-center space-x-2 text-sm">
                <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span class="text-orange-600 dark:text-orange-400">需要登录</span>
              </div>
            </div>
          </div>

          <!-- 拓扑生成工具卡片 -->
          <div class="apple-card p-8 group cursor-pointer" @click="navigateToTopfac">
            <div class="text-center">
              <!-- 图标 -->
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-apple-lg mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-white text-2xl">hub</span>
              </div>
              
              <!-- 标题和描述 -->
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                智能拓扑生成
              </h2>
              <p class="text-gray-600 dark:text-gray-300 mb-6">
                基于自然语言描述生成网络拓扑图，支持DrawIO格式输出
              </p>
              
              <!-- 功能特性 -->
              <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div class="flex items-center justify-center space-x-2">
                  <span class="material-symbols-outlined text-xs">check_circle</span>
                  <span>AI智能转换</span>
                </div>
                <div class="flex items-center justify-center space-x-2">
                  <span class="material-symbols-outlined text-xs">check_circle</span>
                  <span>自动拓扑生成</span>
                </div>
                <div class="flex items-center justify-center space-x-2">
                  <span class="material-symbols-outlined text-xs">check_circle</span>
                  <span>版本控制管理</span>
                </div>
              </div>
              
              <!-- 状态标识 -->
              <div class="flex items-center justify-center space-x-2 text-sm">
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span class="text-green-600 dark:text-green-400">直接使用</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 快速开始按钮 -->
        <div class="text-center mt-12">
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            选择一个工具开始使用，或者了解更多功能特性
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              @click="navigateToCron"
              class="apple-button-primary"
            >
              <span class="material-symbols-outlined mr-2">schedule</span>
              开始使用定时任务
            </button>
            <button 
              @click="navigateToTopfac"
              class="apple-button-secondary"
            >
              <span class="material-symbols-outlined mr-2">hub</span>
              开始生成拓扑图
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能介绍区域 -->
    <section class="py-20 bg-white dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            为什么选择NSSA工具集？
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-300">
            专为网络管理和自动化任务设计的专业工具平台
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-apple mx-auto mb-4 flex items-center justify-center">
              <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">speed</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">高效便捷</h3>
            <p class="text-gray-600 dark:text-gray-300">简化复杂的网络管理任务，提升工作效率</p>
          </div>

          <div class="text-center">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-apple mx-auto mb-4 flex items-center justify-center">
              <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">psychology</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">智能化</h3>
            <p class="text-gray-600 dark:text-gray-300">集成AI技术，自动化处理复杂的网络拓扑生成</p>
          </div>

          <div class="text-center">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-apple mx-auto mb-4 flex items-center justify-center">
              <span class="material-symbols-outlined text-green-600 dark:text-green-400">security</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">安全可靠</h3>
            <p class="text-gray-600 dark:text-gray-300">基于Firebase的安全认证和数据存储</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// 页面元数据
useHead({
  title: 'NSSA工具集 - 定时任务与网络拓扑生成工具',
  meta: [
    { name: 'description', content: 'NSSA工具集提供企业微信定时任务管理和智能网络拓扑生成功能，提升网络管理效率' },
    { name: 'keywords', content: '定时任务,网络拓扑,企业微信,Webhook,AI生成,DrawIO' }
  ]
})

// 导航函数
const navigateToCron = () => {
  navigateTo('/cron')
}

const navigateToTopfac = () => {
  navigateTo('/topfac')
}

// 页面加载动画
onMounted(() => {
  // 添加页面加载动画类
  const cards = document.querySelectorAll('.apple-card')
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('fade-in')
    }, index * 100)
  })
})
</script>

<style scoped>
.apple-card {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.apple-card.fade-in {
  opacity: 1;
  transform: translateY(0);
}
</style>
