/**
 * 创建新的Cron任务
 * 暂时返回模拟数据，等Firebase Functions部署后再连接
 */

export default defineEventHandler(async (event) => {
  try {
    // 读取请求体
    const body = await readBody(event)

    // 暂时返回模拟创建的任务
    const newTask = {
      id: `task_${Date.now()}`,
      ...body,
      status: 'active',
      createdAt: new Date(),
      lastExecuted: null
    }

    return {
      success: true,
      data: newTask,
      message: '任务创建成功'
    }
  } catch (error) {
    console.error('创建任务失败:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || '创建任务失败'
    })
  }
})
