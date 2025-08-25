/**
 * 获取单个Cron任务详情
 */
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  try {
    // 验证用户认证
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: '未提供认证令牌'
      })
    }

    const token = authHeader.substring(7)
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid

    // 获取任务ID
    const taskId = getRouterParam(event, 'id')
    if (!taskId) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少任务ID'
      })
    }

    // 获取Firestore实例
    const db = getFirestore()

    // 查询任务
    const taskDoc = await db.collection('cronTasks').doc(taskId).get()

    if (!taskDoc.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: '任务不存在'
      })
    }

    const taskData = taskDoc.data()

    // 验证用户权限
    if (taskData.userId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: '无权限访问此任务'
      })
    }

    return {
      success: true,
      data: {
        id: taskDoc.id,
        ...taskData
      }
    }
  } catch (error) {
    console.error('获取任务详情失败:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || '获取任务详情失败'
    })
  }
})
