export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, data } = body

    if (!action) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少操作类型'
      })
    }

    console.log(`[MIGRATION] 开始执行迁移操作: ${action}`)

    switch (action) {
      case 'migrate_legacy_tasks':
        return await migrateLegacyTasks(data)
      
      case 'migrate_legacy_projects':
        return await migrateLegacyProjects(data)
      
      case 'create_sample_data':
        return await createSampleData()
      
      case 'cleanup_test_data':
        return await cleanupTestData()
      
      default:
        throw createError({
          statusCode: 400,
          statusMessage: `不支持的操作类型: ${action}`
        })
    }

  } catch (error: any) {
    console.error('[MIGRATION] 迁移操作失败:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '迁移操作失败'
    })
  }
})

// 迁移旧版任务数据
async function migrateLegacyTasks(legacyTasks: any[]) {
  if (!legacyTasks || !Array.isArray(legacyTasks)) {
    throw new Error('无效的任务数据')
  }

  const migratedTasks = []
  const errors = []

  for (const legacyTask of legacyTasks) {
    try {
      // 转换旧版任务格式到新格式
      const newTask = {
        name: legacyTask.name || '未命名任务',
        description: legacyTask.description || '',
        url: legacyTask.url || legacyTask.webhook_url,
        method: legacyTask.method || 'POST',
        headers: legacyTask.headers || {},
        body: legacyTask.body || legacyTask.payload,
        scheduleType: legacyTask.schedule_type || 'simple',
        interval: legacyTask.interval || 5,
        unit: legacyTask.unit || 'minutes',
        days: legacyTask.days || [],
        time: legacyTask.time || '09:00',
        isActive: legacyTask.is_active !== false,
        userId: legacyTask.user_id || 'migrated-user',
        runCount: legacyTask.run_count || 0,
        failureCount: legacyTask.failure_count || 0,
        lastRun: legacyTask.last_run || null,
        lastError: legacyTask.last_error || null,
        createdAt: legacyTask.created_at || Date.now(),
        updatedAt: Date.now()
      }

      // 计算下次运行时间
      newTask.nextRun = calculateNextRun(newTask)

      migratedTasks.push(newTask)
      console.log(`[MIGRATION] 成功迁移任务: ${newTask.name}`)

    } catch (error: any) {
      errors.push({
        task: legacyTask,
        error: error.message
      })
      console.error(`[MIGRATION] 迁移任务失败:`, error)
    }
  }

  return {
    success: true,
    message: `成功迁移 ${migratedTasks.length} 个任务`,
    migratedCount: migratedTasks.length,
    errorCount: errors.length,
    migratedTasks,
    errors
  }
}

// 迁移旧版项目数据
async function migrateLegacyProjects(legacyProjects: any[]) {
  if (!legacyProjects || !Array.isArray(legacyProjects)) {
    throw new Error('无效的项目数据')
  }

  const migratedProjects = []
  const errors = []

  for (const legacyProject of legacyProjects) {
    try {
      // 转换旧版项目格式到新格式
      const newProject = {
        name: legacyProject.name || '未命名项目',
        description: legacyProject.description || '',
        originalText: legacyProject.original_text || legacyProject.input_text || '',
        convertedText: legacyProject.converted_text || legacyProject.structured_text || '',
        topologyData: legacyProject.topology_data || null,
        drawioXml: legacyProject.drawio_xml || legacyProject.xml_output || '',
        status: legacyProject.status || 'active',
        versions: legacyProject.versions || 1,
        devices: legacyProject.device_count || 0,
        connections: legacyProject.connection_count || 0,
        createdAt: legacyProject.created_at || Date.now(),
        updatedAt: Date.now()
      }

      migratedProjects.push(newProject)
      console.log(`[MIGRATION] 成功迁移项目: ${newProject.name}`)

    } catch (error: any) {
      errors.push({
        project: legacyProject,
        error: error.message
      })
      console.error(`[MIGRATION] 迁移项目失败:`, error)
    }
  }

  return {
    success: true,
    message: `成功迁移 ${migratedProjects.length} 个项目`,
    migratedCount: migratedProjects.length,
    errorCount: errors.length,
    migratedProjects,
    errors
  }
}

// 创建示例数据
async function createSampleData() {
  const sampleTasks = [
    {
      name: '每日健康检查',
      description: '每天早上9点发送系统健康状态到企业微信',
      url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your-webhook-key',
      method: 'POST',
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: '🌅 早安！系统运行正常，今日健康检查完成。'
        }
      }),
      scheduleType: 'advanced',
      days: ['1', '2', '3', '4', '5'], // 工作日
      time: '09:00',
      isActive: true,
      userId: 'sample-user',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      name: '每小时状态报告',
      description: '每小时发送一次系统状态报告',
      url: 'https://httpbin.org/post',
      method: 'POST',
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: '⏰ 系统状态正常，服务运行稳定。'
        }
      }),
      scheduleType: 'simple',
      interval: 1,
      unit: 'hours',
      isActive: false,
      userId: 'sample-user',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]

  const sampleProjects = [
    {
      name: '企业网络拓扑示例',
      description: '一个典型的企业网络拓扑结构示例',
      originalText: '企业总部有一台核心路由器连接到两台接入交换机，每台交换机下面连接了多台服务器。',
      convertedText: `环境: 企业总部
数据中心: 主数据中心
网络区域: 核心网络区
设备:
  - 核心路由器 (类型: 路由器)
  - 接入交换机1 (类型: 交换机)
  - 接入交换机2 (类型: 交换机)
  - 服务器1 (类型: 服务器)
  - 服务器2 (类型: 服务器)
连接:
  - 核心路由器 <-> 接入交换机1
  - 核心路由器 <-> 接入交换机2
  - 接入交换机1 <-> 服务器1
  - 接入交换机2 <-> 服务器2`,
      topologyData: {
        environments: 1,
        datacenters: 1,
        areas: 1,
        devices: 5,
        connections: 4
      },
      status: 'active',
      versions: 1,
      devices: 5,
      connections: 4,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]

  // 为示例任务计算下次运行时间
  sampleTasks.forEach(task => {
    task.nextRun = calculateNextRun(task)
  })

  return {
    success: true,
    message: '示例数据创建完成',
    sampleTasks,
    sampleProjects
  }
}

// 清理测试数据
async function cleanupTestData() {
  // 这里可以添加清理逻辑
  console.log('[MIGRATION] 清理测试数据...')
  
  return {
    success: true,
    message: '测试数据清理完成'
  }
}

// 计算下次运行时间的辅助函数
function calculateNextRun(task: any): number {
  const now = new Date()
  
  if (task.scheduleType === 'advanced') {
    if (!task.days || task.days.length === 0 || !task.time) {
      return now.getTime() + 60 * 60 * 1000 // 1小时后
    }
    
    const [hour, minute] = task.time.split(':').map(Number)
    const sortedDays = task.days.map(Number).sort()
    
    // 寻找下一个执行时间
    for (let i = 0; i < 7; i++) {
      const potentialRun = new Date(now)
      potentialRun.setDate(now.getDate() + i)
      potentialRun.setHours(hour, minute, 0, 0)
      
      if (sortedDays.includes(potentialRun.getDay()) && potentialRun.getTime() > now.getTime()) {
        return potentialRun.getTime()
      }
    }
    
    // 如果本周没有找到，找下周的第一个
    const nextWeekDay = sortedDays[0]
    const nextWeek = new Date(now)
    nextWeek.setDate(now.getDate() + 7)
    nextWeek.setDay(nextWeekDay)
    nextWeek.setHours(hour, minute, 0, 0)
    return nextWeek.getTime()
  } else {
    // 简单调度
    const interval = task.interval || 5
    const unit = task.unit || 'minutes'
    
    let milliseconds = 0
    switch (unit) {
      case 'minutes':
        milliseconds = interval * 60 * 1000
        break
      case 'hours':
        milliseconds = interval * 60 * 60 * 1000
        break
      case 'days':
        milliseconds = interval * 24 * 60 * 60 * 1000
        break
    }
    
    return now.getTime() + milliseconds
  }
}
