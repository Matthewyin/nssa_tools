<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          智能网络拓扑生成
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          基于自然语言描述生成网络拓扑图，支持DrawIO格式输出
        </p>
      </div>

      <!-- 功能导航卡片 -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <!-- 项目管理 -->
        <div class="apple-card p-6 cursor-pointer group" @click="navigateToProjects">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-apple flex items-center justify-center group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">folder</span>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                项目管理
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm">
                管理拓扑项目，查看历史版本
              </p>
            </div>
            <span class="material-symbols-outlined text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
              arrow_forward
            </span>
          </div>
        </div>

        <!-- 拓扑编辑器 -->
        <div class="apple-card p-6 cursor-pointer group" @click="navigateToEditor">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-apple flex items-center justify-center group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">edit</span>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                拓扑编辑器
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm">
                创建新的拓扑项目，AI智能生成
              </p>
            </div>
            <span class="material-symbols-outlined text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
              arrow_forward
            </span>
          </div>
        </div>
      </div>

      <!-- 功能特性介绍 -->
      <div class="apple-card p-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          功能特性
        </h2>
        
        <div class="grid md:grid-cols-3 gap-6">
          <!-- AI智能转换 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-apple mx-auto mb-4 flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-2xl">psychology</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              AI智能转换
            </h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">
              支持多种AI模型，将自然语言描述智能转换为标准化拓扑结构
            </p>
          </div>

          <!-- 自动拓扑生成 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-apple mx-auto mb-4 flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-2xl">auto_awesome</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              自动拓扑生成
            </h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">
              自动生成标准DrawIO格式的网络拓扑图，支持直接导入编辑
            </p>
          </div>

          <!-- 版本控制 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-apple mx-auto mb-4 flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-2xl">history</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              版本控制
            </h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">
              完整的项目版本管理，支持历史记录、版本比较和回滚
            </p>
          </div>
        </div>
      </div>

      <!-- 使用示例 -->
      <div class="apple-card p-8 mt-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          使用示例
        </h2>
        
        <div class="bg-gray-50 dark:bg-gray-800 rounded-apple p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            输入示例：
          </h3>
          <div class="bg-white dark:bg-gray-700 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
            <p class="text-gray-700 dark:text-gray-300 font-mono text-sm">
              生产网的未知数据中心的内联接入区有两台路由器和两台接入交换机，
              路由器1连接接入交换机1和接入交换机2，
              路由器2也连接接入交换机1和接入交换机2。
            </p>
          </div>
          
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            系统解析结果：
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">1</div>
              <div class="text-gray-600 dark:text-gray-300">环境</div>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">1</div>
              <div class="text-gray-600 dark:text-gray-300">数据中心</div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">1</div>
              <div class="text-gray-600 dark:text-gray-300">网络区域</div>
            </div>
            <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">4</div>
              <div class="text-gray-600 dark:text-gray-300">设备</div>
            </div>
          </div>
        </div>

        <div class="mt-6 text-center">
          <button @click="navigateToEditor" class="apple-button-primary">
            <span class="material-symbols-outlined mr-2">rocket_launch</span>
            立即开始使用
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面元数据
useHead({
  title: '智能网络拓扑生成 - NSSA工具集',
  meta: [
    { name: 'description', content: '基于自然语言描述生成网络拓扑图，支持AI智能转换和DrawIO格式输出' }
  ]
})

// 导航函数
const navigateToProjects = () => {
  navigateTo('/topfac/projects')
}

const navigateToEditor = () => {
  navigateTo('/topfac/editor')
}

// 页面初始化
onMounted(() => {
  console.log('拓扑生成页面已加载')
})
</script>
