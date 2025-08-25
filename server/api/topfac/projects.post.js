/**
 * 创建新的Topfac项目
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

    // 调用Firebase Function创建项目
    const createTopfacProject = getFunctions().httpsCallable('createTopfacProject')
    const result = await createTopfacProject(body, {
      auth: {
        uid: decodedToken.uid,
        token: decodedToken
      }
    })

    return result.data
  } catch (error) {
    console.error('创建项目失败:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || '创建项目失败'
    })
  }
})
