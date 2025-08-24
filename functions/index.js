const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');

// 定时任务调度器 - 每分钟执行一次
exports.cronScheduler = onSchedule('every 1 minutes', async (event) => {
  try {
    logger.info('开始执行定时任务调度器');
    
    // 调用应用的调度器API
    const response = await fetch(`${process.env.APP_URL}/api/cron/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Firebase-Functions-Scheduler/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`调度器API返回错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    logger.info('调度器执行完成', {
      executedCount: result.executedCount,
      errors: result.errors?.length || 0
    });

    return result;

  } catch (error) {
    logger.error('调度器执行失败', error);
    throw error;
  }
});

// 手动触发调度器的HTTP函数
exports.triggerScheduler = onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    logger.info('手动触发调度器');
    
    const response = await fetch(`${process.env.APP_URL}/api/cron/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Firebase-Functions-Manual/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`调度器API返回错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    logger.info('手动调度器执行完成', result);
    
    res.json({
      success: true,
      message: '调度器执行完成',
      result
    });

  } catch (error) {
    logger.error('手动调度器执行失败', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
