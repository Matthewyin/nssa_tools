/**
 * AI转换文本为拓扑结构
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

    // 读取请求体
    const body = await readBody(event)

    // 调用Firebase Function进行AI转换
    const convertWithAI = getFunctions().httpsCallable('convertWithAI')
    const result = await convertWithAI(body, {
      auth: {
        uid: decodedToken.uid,
        token: decodedToken
      }
    })

    return result.data
  } catch (error) {
    console.error('AI转换失败:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'AI转换失败'
    })
  }
})
