/**
 * 获取用户的Cron任务列表
 * 暂时返回模拟数据，等Firebase Functions部署后再连接
 */

export default defineEventHandler(async (event) => {
  try {
    // 暂时返回模拟数据
    const mockTasks = [
      {
        id: 'task1',
        name: '示例任务1',
        description: '这是一个示例任务',
        url: 'https://example.com/webhook',
        method: 'POST',
        cronExpression: '0 */5 * * * *',
        status: 'active',
        createdAt: new Date(),
        lastExecuted: null
      },
      {
        id: 'task2',
        name: '示例任务2',
        description: '另一个示例任务',
        url: 'https://example.com/api/test',
        method: 'GET',
        cronExpression: '0 0 */1 * * *',
        status: 'paused',
        createdAt: new Date(),
        lastExecuted: new Date()
      }
    ]

    return {
      success: true,
      data: mockTasks
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || '获取任务列表失败'
    })
  }
})
