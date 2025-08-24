import { TopologyApiClient } from '~/services/topology-api'

export default defineNuxtPlugin(() => {
  // 获取运行时配置
  const config = useRuntimeConfig()
  
  // 创建API客户端实例
  const topologyApi = new TopologyApiClient(
    config.public.topologyApiUrl || '',
    $fetch
  )

  // 注册到Nuxt应用实例
  return {
    provide: {
      topologyApi
    }
  }
})
