<template>
  <v-app>
    <!-- 应用栏 -->
    <v-app-bar
      :elevation="1"
      color="white"
      height="64"
      class="border-b"
    >
      <v-app-bar-nav-icon
        @click="drawer = !drawer"
        class="d-md-none"
      />
      
      <v-toolbar-title class="text-h6 font-weight-medium text-grey-darken-2">
        智能网络拓扑生成系统
      </v-toolbar-title>
      
      <v-spacer />
      
      <!-- 右侧操作按钮 -->
      <v-btn
        icon="mdi-github"
        variant="text"
        @click="goToGithub"
        title="GitHub"
      />
    </v-app-bar>

    <!-- 导航抽屉 -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      width="280"
      class="border-r"
    >
      <v-list density="compact" nav>
        <!-- 主导航项 -->
        <v-list-item
          prepend-icon="mdi-home-outline"
          title="首页"
          value="home"
          :to="'/'"
          exact
        />

        <v-divider class="my-2" />

        <!-- 智能拓扑生成 -->
        <v-list-subheader class="text-grey-darken-1 font-weight-medium">
          智能拓扑生成
        </v-list-subheader>

        <v-list-item
          prepend-icon="mdi-folder-network-outline"
          title="项目管理"
          value="topology-projects"
          :to="'/topology-projects'"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- 主内容区域 -->
    <v-main>
      <v-container fluid class="pa-0">
        <slot />
      </v-container>
    </v-main>

    <!-- 全局通知组件 -->
    <GlobalNotification />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'

// 全局通知组件
const GlobalNotification = defineAsyncComponent(() => import('~/components/GlobalNotification.vue'))

// 跳转到 GitHub 仓库
function goToGithub() {
  window.open('https://github.com/Matthewyin/topfac', '_blank')
}

// 响应式状态
const drawer = ref(false)

// 检测移动设备
const mobile = computed(() => {
  // 服务端渲染时默认为false，客户端渲染时检测实际情况
  if (import.meta.client) {
    return window.innerWidth < 960
  }
  return false
})

// 组件挂载后设置抽屉状态
onMounted(() => {
  drawer.value = !mobile.value
  
  // 监听窗口大小变化
  const handleResize = () => {
    if (window.innerWidth >= 960) {
      drawer.value = true
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  // 清理监听器
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})
</script>

<style scoped>
/* Google Material Design 风格样式 */
.v-app-bar {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
}

.v-navigation-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.v-list-item {
  border-radius: 8px !important;
  margin: 2px 8px !important;
}

.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.08) !important;
  color: #1976D2 !important;
}

.v-list-item--active .v-icon {
  color: #1976D2 !important;
}

.v-list-subheader {
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  letter-spacing: 0.0178571429em !important;
  margin-top: 8px !important;
  margin-bottom: 4px !important;
}
</style> 