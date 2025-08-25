/**
 * Cron任务相关的Firebase Functions
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');

const db = getFirestore();

/**
 * 创建Cron任务
 */
exports.createCronTask = onCall(async (request) => {
  // 验证用户认证
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  const { name, description, cronExpression, url, method = 'GET', headers = {}, body = '' } = request.data;
  
  // 验证必填字段
  if (!name || !url || !cronExpression) {
    throw new HttpsError('invalid-argument', '缺少必填字段');
  }

  try {
    // 创建任务文档
    const taskRef = await db.collection('cronTasks').add({
      userId: request.auth.uid,
      name,
      description: description || '',
      cronExpression,
      url,
      method,
      headers,
      body,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastExecuted: null
    });

    return {
      success: true,
      taskId: taskRef.id,
      message: '任务创建成功'
    };
  } catch (error) {
    console.error('创建任务失败:', error);
    throw new HttpsError('internal', '创建任务失败');
  }
});

/**
 * 更新Cron任务
 */
exports.updateCronTask = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  const { taskId, ...updateData } = request.data;
  
  if (!taskId) {
    throw new HttpsError('invalid-argument', '缺少任务ID');
  }

  try {
    const taskRef = db.collection('cronTasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new HttpsError('not-found', '任务不存在');
    }

    // 验证用户权限
    if (taskDoc.data().userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', '无权限操作此任务');
    }

    await taskRef.update({
      ...updateData,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: '任务更新成功'
    };
  } catch (error) {
    console.error('更新任务失败:', error);
    throw new HttpsError('internal', '更新任务失败');
  }
});

/**
 * 删除Cron任务
 */
exports.deleteCronTask = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  const { taskId } = request.data;
  
  if (!taskId) {
    throw new HttpsError('invalid-argument', '缺少任务ID');
  }

  try {
    const taskRef = db.collection('cronTasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new HttpsError('not-found', '任务不存在');
    }

    // 验证用户权限
    if (taskDoc.data().userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', '无权限操作此任务');
    }

    await taskRef.delete();

    return {
      success: true,
      message: '任务删除成功'
    };
  } catch (error) {
    console.error('删除任务失败:', error);
    throw new HttpsError('internal', '删除任务失败');
  }
});

/**
 * 手动触发任务执行
 */
exports.triggerCronTask = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  const { taskId } = request.data;
  
  if (!taskId) {
    throw new HttpsError('invalid-argument', '缺少任务ID');
  }

  try {
    const taskRef = db.collection('cronTasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new HttpsError('not-found', '任务不存在');
    }

    const taskData = taskDoc.data();

    // 验证用户权限
    if (taskData.userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', '无权限操作此任务');
    }

    // 执行任务
    const result = await executeTask(taskData, taskId);

    return {
      success: true,
      result,
      message: '任务执行完成'
    };
  } catch (error) {
    console.error('触发任务失败:', error);
    throw new HttpsError('internal', '触发任务失败');
  }
});

/**
 * 定时任务调度器 - 每分钟执行一次
 */
exports.cronScheduler = onSchedule('every 1 minutes', async (event) => {
  console.log('开始执行定时任务调度...');
  
  try {
    // 获取所有活跃的任务
    const tasksSnapshot = await db.collection('cronTasks')
      .where('status', '==', 'active')
      .get();

    const promises = [];
    
    tasksSnapshot.forEach(doc => {
      const taskData = doc.data();
      const taskId = doc.id;
      
      // 检查是否需要执行
      if (shouldExecuteTask(taskData)) {
        promises.push(executeTask(taskData, taskId));
      }
    });

    await Promise.allSettled(promises);
    console.log(`定时任务调度完成，处理了 ${promises.length} 个任务`);
  } catch (error) {
    console.error('定时任务调度失败:', error);
  }
});

/**
 * 执行单个任务
 */
async function executeTask(taskData, taskId) {
  const startTime = new Date();
  
  try {
    console.log(`执行任务: ${taskData.name} (${taskId})`);
    
    // 构建请求配置
    const config = {
      method: taskData.method,
      url: taskData.url,
      headers: taskData.headers || {},
      timeout: 30000 // 30秒超时
    };

    // 添加请求体（如果需要）
    if (taskData.body && ['POST', 'PUT', 'PATCH'].includes(taskData.method.toUpperCase())) {
      config.data = taskData.body;
    }

    // 执行HTTP请求
    const response = await axios(config);
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // 记录执行结果
    await recordExecution(taskId, taskData.userId, {
      status: 'success',
      startTime,
      endTime,
      duration,
      responseStatus: response.status,
      responseData: response.data
    });

    // 更新任务的最后执行时间
    await db.collection('cronTasks').doc(taskId).update({
      lastExecuted: endTime
    });

    return {
      success: true,
      status: response.status,
      duration
    };
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.error(`任务执行失败: ${taskData.name} (${taskId})`, error.message);

    // 记录执行失败
    await recordExecution(taskId, taskData.userId, {
      status: 'failed',
      startTime,
      endTime,
      duration,
      error: error.message
    });

    return {
      success: false,
      error: error.message,
      duration
    };
  }
}

/**
 * 记录任务执行历史
 */
async function recordExecution(taskId, userId, executionData) {
  try {
    await db.collection('cronExecutions').add({
      taskId,
      userId,
      ...executionData,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('记录执行历史失败:', error);
  }
}

/**
 * 检查任务是否需要执行
 * 简化版本，实际应该使用cron表达式解析
 */
function shouldExecuteTask(taskData) {
  // 这里应该实现cron表达式的解析逻辑
  // 暂时简化为每分钟执行一次的任务
  const now = new Date();
  const lastExecuted = taskData.lastExecuted ? taskData.lastExecuted.toDate() : null;
  
  if (!lastExecuted) {
    return true; // 从未执行过
  }
  
  // 简单的间隔检查（这里需要根据cron表达式来实现）
  const timeDiff = now.getTime() - lastExecuted.getTime();
  return timeDiff >= 60000; // 1分钟
}
