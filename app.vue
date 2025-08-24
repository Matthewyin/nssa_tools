<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const { initAuth } = useAuth()

// 应用初始化
onMounted(async () => {
  // 初始化认证状态
  await initAuth()
})
</script>
