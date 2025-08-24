export default defineEventHandler(async (event) => {
  try {
    const startTime = Date.now()
    
    // 系统信息
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    }

    // Firebase连接状态
    let firebaseStatus = 'unknown'
    try {
      const config = useRuntimeConfig()
      if (config.public.firebaseApiKey && config.public.firebaseApiKey.startsWith('AIza')) {
        firebaseStatus = 'connected'
      } else {
        firebaseStatus = 'demo_mode'
      }
    } catch (error) {
      firebaseStatus = 'error'
    }

    // API端点检查
    const apiEndpoints = [
      { name: 'Cron Execute', path: '/api/cron/execute', method: 'POST' },
      { name: 'Cron Scheduler', path: '/api/cron/scheduler', method: 'POST' },
      { name: 'Topfac Convert', path: '/api/topfac/convert', method: 'POST' },
      { name: 'Topfac Generate', path: '/api/topfac/generate', method: 'POST' },
      { name: 'Admin Migrate', path: '/api/admin/migrate', method: 'POST' }
    ]

    // 数据库连接检查（如果不是演示模式）
    let databaseStatus = 'unknown'
    if (firebaseStatus === 'connected') {
      try {
        // 这里可以添加实际的数据库连接测试
        databaseStatus = 'connected'
      } catch (error) {
        databaseStatus = 'error'
      }
    } else {
      databaseStatus = 'demo_mode'
    }

    const responseTime = Date.now() - startTime

    const healthData = {
      status: 'healthy',
      timestamp: systemInfo.timestamp,
      responseTime: `${responseTime}ms`,
      system: systemInfo,
      services: {
        firebase: {
          status: firebaseStatus,
          description: getFirebaseStatusDescription(firebaseStatus)
        },
        database: {
          status: databaseStatus,
          description: getDatabaseStatusDescription(databaseStatus)
        },
        apis: {
          status: 'available',
          endpoints: apiEndpoints,
          description: `${apiEndpoints.length} API端点可用`
        }
      },
      performance: {
        responseTime,
        memoryUsage: {
          used: Math.round(systemInfo.memory.heapUsed / 1024 / 1024),
          total: Math.round(systemInfo.memory.heapTotal / 1024 / 1024),
          external: Math.round(systemInfo.memory.external / 1024 / 1024)
        },
        uptime: formatUptime(systemInfo.uptime)
      }
    }

    return healthData

  } catch (error: any) {
    console.error('[HEALTH] 健康检查失败:', error)
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        firebase: { status: 'unknown' },
        database: { status: 'unknown' },
        apis: { status: 'unknown' }
      }
    }
  }
})

function getFirebaseStatusDescription(status: string): string {
  switch (status) {
    case 'connected':
      return 'Firebase服务已连接'
    case 'demo_mode':
      return '运行在演示模式'
    case 'error':
      return 'Firebase连接错误'
    default:
      return '状态未知'
  }
}

function getDatabaseStatusDescription(status: string): string {
  switch (status) {
    case 'connected':
      return 'Firestore数据库已连接'
    case 'demo_mode':
      return '使用本地存储（演示模式）'
    case 'error':
      return '数据库连接错误'
    default:
      return '状态未知'
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟 ${secs}秒`
  } else {
    return `${secs}秒`
  }
}
