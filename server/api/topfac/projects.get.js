/**
 * 获取用户的Topfac项目列表
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

    // 获取Firestore实例
    const db = getFirestore()

    // 查询用户的项目
    const projectsSnapshot = await db.collection('topfacProjects')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get()

    const projects = []
    projectsSnapshot.forEach(doc => {
      projects.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return {
      success: true,
      data: projects
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || '获取项目列表失败'
    })
  }
})
