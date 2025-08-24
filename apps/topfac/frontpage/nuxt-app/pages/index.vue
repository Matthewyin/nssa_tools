<template>
  <div class="responsive-page">
    <v-container fluid class="responsive-container">
      <!-- 系统标题区域 -->
      <v-row class="mb-8">
        <v-col cols="12" class="text-center">
          <h1 class="responsive-title mb-4">
            智能网络拓扑生成系统
          </h1>

        </v-col>
      </v-row>



      <!-- 功能导航卡片 -->
      <v-row justify="center" class="responsive-grid">
        <v-col cols="12" md="6" lg="5">
          <v-card
            class="dashboard-card responsive-card"
            elevation="4"
            hover
            @click="navigateToProjects"
          >
          <v-card-text class="pa-6">
            <div class="text-center">
              <v-avatar size="80" color="primary" class="mb-4">
                <v-icon size="40" color="white">mdi-sitemap</v-icon>
              </v-avatar>

              <h2 class="text-h5 font-weight-bold mb-3">
                智能拓扑生成
              </h2>

              <p class="text-body-1 text-medium-emphasis mb-4">
                基于自然语言描述生成网络拓扑图，支持DrawIO格式输出
              </p>

              <!-- 功能说明 -->
              <div class="text-center">
                <p class="text-body-2 text-medium-emphasis">
                  通过自然语言描述快速生成专业的网络拓扑图
                </p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>



      </v-row>


    </v-container>
  </div>
</template>

<script setup lang="ts">
// 页面元数据
definePageMeta({
  title: '智能网络拓扑生成系统 - 首页',
  description: '智能网络拓扑生成系统主页，提供基于自然语言的网络拓扑图生成功能'
})

// 响应式数据
const router = useRouter()

/**
 * 导航到项目管理
 */
function navigateToProjects() {
  router.push('/topology-projects')
}

// 页面加载时的初始化
onMounted(() => {
  console.log('智能网络拓扑生成系统主页已加载')
})


</script>

<style scoped>
.dashboard-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.text-medium-emphasis {
  opacity: 0.7;
}

/* 响应式设计 */
@media (max-width: 960px) {
  .dashboard-card {
    margin-bottom: 1rem;
  }
}

@media (max-width: 600px) {
  .text-h3 {
    font-size: 2rem !important;
  }

  .text-h6 {
    font-size: 1.1rem !important;
  }
}
</style>