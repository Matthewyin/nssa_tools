/**
 * Cloudflare Workers Cron 定时任务执行器
 * 定期检查并执行到期的定时任务
 */

import { ServerCronManager } from './server-cron.js';

export default {
  async scheduled(event, env, ctx) {
    const cronManager = new ServerCronManager(env);
    
    try {
      console.log('Starting cron job execution...');
      
      // 获取需要执行的任务
      const dueTasks = await cronManager.getDueTasks();
      
      if (dueTasks.length === 0) {
        console.log('No due tasks found');
        return;
      }

      console.log(`Found ${dueTasks.length} due tasks`);
      
      // 并发执行任务（限制并发数）
      const concurrencyLimit = 10;
      const chunks = [];
      
      for (let i = 0; i < dueTasks.length; i += concurrencyLimit) {
        chunks.push(dueTasks.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(task => cronManager.executeTask(task)));
      }

      console.log('Cron job execution completed');
      
    } catch (error) {
      console.error('Cron job execution failed:', error);
      
      // 可选：发送错误通知
      await sendErrorNotification(env, error);
    }
  }
};

/**
 * 发送错误通知
 */
async function sendErrorNotification(env, error) {
  try {
    // 这里可以集成邮件、Slack或其他通知服务
    console.error('Error notification would be sent:', error.message);
  } catch (notificationError) {
    console.error('Failed to send error notification:', notificationError);
  }
}