// 注意：在Nuxt服务端API中，我们需要使用动态导入来避免模块解析问题

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()

    // 检查是否有Firebase Admin配置
    const hasAdminConfig = config.firebaseAdminPrivateKey &&
                          config.firebaseAdminClientEmail &&
                          config.firebaseAdminProjectId

    if (!hasAdminConfig) {
      console.log('[SCHEDULER] Firebase Admin SDK未配置，跳过调度')
      return {
        success: true,
        message: 'Firebase Admin SDK未配置，跳过调度',
        executedCount: 0,
        executedTasks: [],
        errors: []
      }
    }

    // 动态导入Firebase Admin SDK
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getFirestore: getAdminFirestore } = await import('firebase-admin/firestore')

    // 初始化Firebase Admin SDK
    if (getApps().length === 0) {
      const privateKey = config.firebaseAdminPrivateKey.replace(/\\n/g, '\n')

      initializeApp({
        credential: cert({
          projectId: config.firebaseAdminProjectId,
          clientEmail: config.firebaseAdminClientEmail,
          privateKey
        })
      })
    }

    const adminDb = getAdminFirestore()
    const now = Date.now()

    console.log(`[SCHEDULER] 开始检查待执行任务 - ${new Date().toISOString()}`)

    // 查询需要执行的任务
    const tasksRef = adminDb.collection('tasks')
    const activeTasksQuery = tasksRef
      .where('isActive', '==', true)
      .where('nextRun', '<=', now)

    const snapshot = await activeTasksQuery.get()
    
    if (snapshot.empty) {
      console.log('[SCHEDULER] 没有待执行的任务')
      return {
        success: true,
        message: '没有待执行的任务',
        executedCount: 0
      }
    }

    const executedTasks = []
    const errors = []

    // 执行每个任务
    for (const taskDoc of snapshot.docs) {
      const task = { id: taskDoc.id, ...taskDoc.data() }
      
      try {
        console.log(`[SCHEDULER] 执行任务: ${task.name}`)

        // 调用任务执行API
        const executeResponse = await $fetch('/api/cron/execute', {
          method: 'POST',
          body: {
            taskId: task.id,
            url: task.url,
            method: task.method || 'POST',
            headers: task.headers || {},
            requestBody: task.body
          }
        })

        // 计算下次执行时间
        const nextRun = calculateNextRun(task)
        
        // 更新任务状态
        const updateData: any = {
          lastRun: now,
          runCount: (task.runCount || 0) + 1,
          nextRun,
          updatedAt: now
        }

        if (executeResponse.success) {
          updateData.lastError = null
          console.log(`[SCHEDULER] 任务 ${task.name} 执行成功`)
        } else {
          updateData.failureCount = (task.failureCount || 0) + 1
          updateData.lastError = executeResponse.execution?.statusText || '执行失败'
          console.error(`[SCHEDULER] 任务 ${task.name} 执行失败:`, updateData.lastError)
        }

        await adminDb.collection('tasks').doc(task.id).update(updateData)
        
        executedTasks.push({
          id: task.id,
          name: task.name,
          success: executeResponse.success,
          nextRun
        })

      } catch (error: any) {
        console.error(`[SCHEDULER] 任务 ${task.name} 处理失败:`, error.message)
        
        // 更新错误信息
        await adminDb.collection('tasks').doc(task.id).update({
          lastRun: now,
          failureCount: (task.failureCount || 0) + 1,
          lastError: error.message,
          updatedAt: now
        })

        errors.push({
          taskId: task.id,
          taskName: task.name,
          error: error.message
        })
      }
    }

    console.log(`[SCHEDULER] 调度完成 - 执行了 ${executedTasks.length} 个任务，${errors.length} 个错误`)

    return {
      success: true,
      message: `调度完成 - 执行了 ${executedTasks.length} 个任务`,
      executedCount: executedTasks.length,
      executedTasks,
      errors
    }

  } catch (error: any) {
    console.error('[SCHEDULER] 调度器错误:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '调度器服务异常'
    })
  }
})

// 计算下次执行时间
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
