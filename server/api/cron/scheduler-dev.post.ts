// 开发环境专用的简化调度器
export default defineEventHandler(async (event) => {
  try {
    console.log(`[DEV-SCHEDULER] 开始检查待执行任务 - ${new Date().toISOString()}`)

    // 在开发环境中，我们使用模拟数据或简化逻辑
    const now = Date.now()
    
    // 模拟一些待执行的任务
    const mockTasks = [
      {
        id: 'dev-task-1',
        name: '开发测试任务1',
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: JSON.stringify({
          msgtype: 'text',
          text: {
            content: '这是一个开发环境的测试任务'
          }
        }),
        isActive: true,
        nextRun: now - 1000, // 1秒前应该执行
        runCount: 0,
        failureCount: 0
      },
      {
        id: 'dev-task-2',
        name: '开发测试任务2',
        url: 'https://httpbin.org/get',
        method: 'GET',
        isActive: true,
        nextRun: now + 60000, // 1分钟后执行
        runCount: 5,
        failureCount: 1
      }
    ]

    // 筛选需要执行的任务
    const tasksToExecute = mockTasks.filter(task => 
      task.isActive && task.nextRun <= now
    )

    if (tasksToExecute.length === 0) {
      console.log('[DEV-SCHEDULER] 没有待执行的任务')
      return {
        success: true,
        message: '没有待执行的任务',
        executedCount: 0,
        executedTasks: [],
        errors: []
      }
    }

    const executedTasks = []
    const errors = []

    // 执行每个任务
    for (const task of tasksToExecute) {
      try {
        console.log(`[DEV-SCHEDULER] 执行任务: ${task.name}`)

        // 调用任务执行API
        const executeResponse = await $fetch('/api/cron/execute', {
          method: 'POST',
          body: {
            taskId: task.id,
            url: task.url,
            method: task.method || 'POST',
            headers: {},
            requestBody: task.body
          }
        })

        // 计算下次执行时间（简化版本）
        const nextRun = now + 5 * 60 * 1000 // 5分钟后
        
        // 模拟更新任务状态
        const updateData = {
          lastRun: now,
          runCount: (task.runCount || 0) + 1,
          nextRun,
          updatedAt: now
        }

        if (executeResponse.success) {
          updateData.lastError = null
          console.log(`[DEV-SCHEDULER] 任务 ${task.name} 执行成功`)
        } else {
          updateData.failureCount = (task.failureCount || 0) + 1
          updateData.lastError = executeResponse.execution?.statusText || '执行失败'
          console.error(`[DEV-SCHEDULER] 任务 ${task.name} 执行失败:`, updateData.lastError)
        }

        // 在开发环境中，我们只是记录更新，不实际保存到数据库
        console.log(`[DEV-SCHEDULER] 任务状态更新:`, updateData)
        
        executedTasks.push({
          id: task.id,
          name: task.name,
          success: executeResponse.success,
          nextRun
        })

      } catch (error: any) {
        console.error(`[DEV-SCHEDULER] 任务 ${task.name} 处理失败:`, error.message)
        
        errors.push({
          taskId: task.id,
          taskName: task.name,
          error: error.message
        })
      }
    }

    console.log(`[DEV-SCHEDULER] 调度完成 - 执行了 ${executedTasks.length} 个任务，${errors.length} 个错误`)

    return {
      success: true,
      message: `开发环境调度完成 - 执行了 ${executedTasks.length} 个任务`,
      executedCount: executedTasks.length,
      executedTasks,
      errors,
      note: '这是开发环境的模拟调度器，不会实际修改数据库'
    }

  } catch (error: any) {
    console.error('[DEV-SCHEDULER] 调度器错误:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '开发调度器服务异常'
    })
  }
})
