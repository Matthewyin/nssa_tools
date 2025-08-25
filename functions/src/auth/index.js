/**
 * 认证相关的Firebase Functions
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { beforeUserCreated } = require('firebase-functions/v2/identity');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

/**
 * 用户创建时的触发器
 * 在Firestore中创建用户文档
 */
exports.createUserDocument = beforeUserCreated(async (event) => {
  const user = event.data;
  
  try {
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      name: user.displayName || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`用户文档创建成功: ${user.uid}`);
  } catch (error) {
    console.error('创建用户文档失败:', error);
  }
});

/**
 * 获取用户信息
 */
exports.getUserProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  try {
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    
    if (!userDoc.exists) {
      // 如果用户文档不存在，创建一个
      const userData = {
        email: request.auth.token.email,
        name: request.auth.token.name || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('users').doc(request.auth.uid).set(userData);
      
      return {
        success: true,
        user: userData
      };
    }

    return {
      success: true,
      user: userDoc.data()
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw new HttpsError('internal', '获取用户信息失败');
  }
});

/**
 * 更新用户信息
 */
exports.updateUserProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  const { name, ...otherData } = request.data;

  try {
    await db.collection('users').doc(request.auth.uid).update({
      name: name || '',
      ...otherData,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: '用户信息更新成功'
    };
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw new HttpsError('internal', '更新用户信息失败');
  }
});
