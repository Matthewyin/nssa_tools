<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- 全局错误处理组件 -->
    <GlobalErrorHandler />
  </div>
</template>

<script setup>
import GlobalErrorHandler from '~/components/GlobalErrorHandler.vue'

// 全局样式导入
import '~/assets/styles/responsive.scss'
</script>
