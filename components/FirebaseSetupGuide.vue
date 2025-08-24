<template>
  <div v-if="showGuide" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="apple-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- 标题 -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Firebase配置指南
          </h2>
          <button
            @click="closeGuide"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- 当前状态 -->
        <div class="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div class="flex items-center space-x-2 mb-2">
            <span class="material-symbols-outlined text-orange-600 dark:text-orange-400">warning</span>
            <span class="font-semibold text-orange-900 dark:text-orange-100">当前运行在演示模式</span>
          </div>
          <p class="text-orange-700 dark:text-orange-200 text-sm">
            检测到项目ID: <code class="bg-orange-100 dark:bg-orange-800 px-1 rounded">{{ projectId }}</code>，但缺少Web应用配置。
          </p>
        </div>

        <!-- 配置步骤 -->
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              步骤1: 在Firebase控制台创建Web应用
            </h3>
            <ol class="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>访问 <a href="https://console.firebase.google.com" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">Firebase控制台</a></li>
              <li>选择项目 <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">{{ projectId }}</code></li>
              <li>点击"项目设置"齿轮图标</li>
              <li>在"常规"标签页中，滚动到"您的应用"部分</li>
              <li>点击"添加应用"，选择"Web"图标 (&lt;/&gt;)</li>
              <li>输入应用昵称（如：NSSA工具集）</li>
              <li>点击"注册应用"</li>
            </ol>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              步骤2: 复制配置信息
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
              创建Web应用后，Firebase会显示配置对象，类似这样：
            </p>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm font-mono">
              <pre class="text-gray-700 dark:text-gray-300">const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "{{ projectId }}.firebaseapp.com",
  projectId: "{{ projectId }}",
  storageBucket: "{{ projectId }}.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};</pre>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              步骤3: 更新环境变量
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
              将配置信息更新到 <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env</code> 文件中：
            </p>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm font-mono">
              <pre class="text-gray-700 dark:text-gray-300">FIREBASE_API_KEY=你的apiKey
FIREBASE_AUTH_DOMAIN={{ projectId }}.firebaseapp.com
FIREBASE_PROJECT_ID={{ projectId }}
FIREBASE_STORAGE_BUCKET={{ projectId }}.appspot.com
FIREBASE_MESSAGING_SENDER_ID=你的messagingSenderId
FIREBASE_APP_ID=你的appId</pre>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              步骤4: 启用服务
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
              在Firebase控制台中启用以下服务：
            </p>
            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <li><strong>Authentication</strong>: 构建 → Authentication → 开始使用</li>
              <li><strong>Firestore Database</strong>: 构建 → Firestore Database → 创建数据库</li>
              <li><strong>Functions</strong>（可选）: 构建 → Functions</li>
            </ul>
          </div>
        </div>

        <!-- 演示模式说明 -->
        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            演示模式功能
          </h3>
          <p class="text-blue-700 dark:text-blue-200 text-sm mb-2">
            在配置完成前，你可以使用演示模式体验功能：
          </p>
          <div class="text-sm text-blue-600 dark:text-blue-300 space-y-1">
            <div>• 登录账号: <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">demo@example.com</code></div>
            <div>• 登录密码: <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">demo123</code></div>
            <div>• 数据存储在浏览器本地，刷新后保留</div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="openFirebaseConsole"
            class="apple-button-primary"
          >
            <span class="material-symbols-outlined mr-2">open_in_new</span>
            打开Firebase控制台
          </button>
          <button
            @click="closeGuide"
            class="apple-button-secondary"
          >
            稍后配置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $firebase } = useNuxtApp()
const config = useRuntimeConfig()

const showGuide = ref(false)
const projectId = config.public.firebaseProjectId

// 检查是否需要显示配置指南
onMounted(() => {
  if ($firebase?.isDemo) {
    // 检查是否已经隐藏过指南
    const hidden = localStorage.getItem('firebase_setup_guide_hidden')
    if (!hidden) {
      showGuide.value = true
    }
  }
})

const closeGuide = () => {
  showGuide.value = false
  localStorage.setItem('firebase_setup_guide_hidden', 'true')
}

const openFirebaseConsole = () => {
  window.open(`https://console.firebase.google.com/project/${projectId}`, '_blank')
}
</script>
