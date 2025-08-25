/**
 * 手动触发Cron任务执行
 */
import { getAuth } from 'firebase-admin/auth'
import { getFunctions } from 'firebase-admin/functions'

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

    // 获取任务ID
    const taskId = getRouterParam(event, 'id')
    if (!taskId) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少任务ID'
      })
    }

    // 调用Firebase Function触发任务
    const triggerCronTask = getFunctions().httpsCallable('triggerCronTask')
    const result = await triggerCronTask({
      taskId
    }, {
      auth: {
        uid: decodedToken.uid,
        token: decodedToken
      }
    })

    return result.data
  } catch (error) {
    console.error('触发任务失败:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || '触发任务失败'
    })
  }
})
