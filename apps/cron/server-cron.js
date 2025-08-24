/**
 * 服务端定时任务管理系统
 * 使用 Cloudflare Workers Cron Triggers 实现真正的持久化定时任务
 */

// 任务状态枚举
const TaskStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// 任务类型枚举
const TaskType = {
  SIMPLE: 'simple',     // 简单间隔任务
  ADVANCED: 'advanced'  // 高级定时任务
};

/**
 * 任务数据结构
 * {
 *   id: string,
 *   userId: string,
 *   name: string,
 *   description: string,
 *   url: string,
 *   method: 'GET' | 'POST' | 'PUT' | 'DELETE',
 *   headers: Record<string, string>,
 *   body: string,
 *   type: TaskType,
 *   status: TaskStatus,
 *   config: {
 *     // 简单间隔配置
 *     interval?: number,
 *     unit?: 'minutes' | 'hours' | 'days',
 *     
 *     // 高级定时配置
 *     days?: number[],      // 0-6 (周日-周六)
 *     time?: string,        // HH:mm 格式
 *     
 *     // 通用配置
 *     timezone?: string,
 *     maxRetries?: number,
 *     timeout?: number
 *   },
 *   metadata: {
 *     createdAt: number,
 *     updatedAt: number,
 *     lastRunAt?: number,
 *     nextRunAt?: number,
 *     runCount: number,
 *     failureCount: number,
 *     lastError?: string
 *   }
 * }
 */

class ServerCronManager {
  constructor(env) {
    this.env = env;
    this.kv = env.CRON_TASKS_KV; // KV存储用于任务持久化
    this.r2 = env.CRON_LOGS_R2;  // R2存储用于日志
  }

  /**
   * 生成任务ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取用户任务存储键
   */
  getUserTasksKey(userId) {
    return `user_tasks:${userId}`;
  }

  /**
   * 获取任务详情存储键
   */
  getTaskKey(taskId) {
    return `task:${taskId}`;
  }

  /**
   * 创建新任务
   */
  async createTask(userId, taskData) {
    const task = {
      id: this.generateTaskId(),
      userId,
      name: taskData.name,
      description: taskData.description || '',
      url: taskData.url,
      method: taskData.method || 'GET',
      headers: taskData.headers || {},
      body: taskData.body || '',
      type: taskData.type,
      status: TaskStatus.ACTIVE,
      config: taskData.config,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        runCount: 0,
        failureCount: 0
      }
    };

    // 计算下次运行时间
    task.metadata.nextRunAt = this.calculateNextRunTime(task);

    // 保存任务
    await this.saveTask(task);
    await this.addTaskToUserList(userId, task.id);

    return task;
  }

  /**
   * 更新任务
   */
  async updateTask(taskId, updates) {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // 更新任务数据
    Object.assign(task, updates);
    task.metadata.updatedAt = Date.now();

    // 重新计算下次运行时间
    task.metadata.nextRunAt = this.calculateNextRunTime(task);

    await this.saveTask(task);
    return task;
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId) {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // 从用户任务列表中移除
    await this.removeTaskFromUserList(task.userId, taskId);
    
    // 删除任务详情
    await this.kv.delete(this.getTaskKey(taskId));
  }

  /**
   * 获取任务
   */
  async getTask(taskId) {
    const taskData = await this.kv.get(this.getTaskKey(taskId));
    return taskData ? JSON.parse(taskData) : null;
  }

  /**
   * 获取用户的所有任务
   */
  async getUserTasks(userId) {
    const taskIds = await this.getUserTaskIds(userId);
    const tasks = [];

    for (const taskId of taskIds) {
      const task = await this.getTask(taskId);
      if (task) {
        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId) {
    return await this.updateTask(taskId, { status: TaskStatus.PAUSED });
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskId) {
    return await this.updateTask(taskId, { 
      status: TaskStatus.ACTIVE,
      metadata: {
        lastError: undefined // 清除错误状态
      }
    });
  }

  /**
   * 立即执行任务
   */
  async triggerTask(taskId) {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // 立即执行任务
    await this.executeTask(task);
    
    // 重新计算下次运行时间
    const nextRunTime = this.calculateNextRunTime(task);
    await this.updateTask(taskId, { 
      'metadata.nextRunAt': nextRunTime 
    });

    return task;
  }

  /**
   * 执行任务
   */
  async executeTask(task) {
    const startTime = Date.now();
    let result = { success: false, error: null };

    try {
      // 构建请求选项
      const options = {
        method: task.method,
        headers: {
          'User-Agent': 'NSSA-Tools-Cron/1.0',
          ...task.headers
        }
      };

      if (task.body && ['POST', 'PUT', 'DELETE'].includes(task.method)) {
        options.body = task.body;
      }

      // 设置超时
      const timeout = task.config.timeout || 30000; // 默认30秒
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // 执行HTTP请求
      const response = await fetch(task.url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      result.success = true;

      // 记录成功执行
      await this.logTaskExecution(task, {
        success: true,
        responseStatus: response.status,
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      result.error = error.message;

      // 记录失败执行
      await this.logTaskExecution(task, {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      });

      // 更新任务失败统计
      task.metadata.failureCount++;
      task.metadata.lastError = error.message;

      // 检查是否需要暂停任务（失败次数过多）
      const maxRetries = task.config.maxRetries || 3;
      if (task.metadata.failureCount >= maxRetries) {
        task.status = TaskStatus.FAILED;
      }
    }

    // 更新任务执行统计
    task.metadata.lastRunAt = startTime;
    task.metadata.runCount++;
    task.metadata.updatedAt = Date.now();

    // 重新计算下次运行时间
    task.metadata.nextRunAt = this.calculateNextRunTime(task);

    await this.saveTask(task);

    return result;
  }

  /**
   * 计算下次运行时间
   */
  calculateNextRunTime(task) {
    if (task.status !== TaskStatus.ACTIVE) {
      return null;
    }

    const now = new Date();
    const config = task.config;

    if (task.type === TaskType.SIMPLE) {
      // 简单间隔任务
      const interval = config.interval || 1;
      const unit = config.unit || 'minutes';
      
      let multiplier = 1;
      switch (unit) {
        case 'minutes': multiplier = 60 * 1000; break;
        case 'hours': multiplier = 60 * 60 * 1000; break;
        case 'days': multiplier = 24 * 60 * 60 * 1000; break;
      }
      
      return new Date(now.getTime() + interval * multiplier);
      
    } else if (task.type === TaskType.ADVANCED) {
      // 高级定时任务
      const days = config.days || [];
      const time = config.time || '00:00';
      
      if (days.length === 0) {
        return null;
      }

      // 解析时间
      const [hours, minutes] = time.split(':').map(Number);
      
      // 找到下一个执行时间
      let nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);
      
      // 如果今天的时间已过，从明天开始
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      // 找到下一个符合星期几的日期
      let attempts = 0;
      while (!days.includes(nextRun.getDay()) && attempts < 7) {
        nextRun.setDate(nextRun.getDate() + 1);
        attempts++;
      }
      
      return nextRun;
    }

    return null;
  }

  /**
   * 获取需要执行的任务
   */
  async getDueTasks() {
    const now = Date.now();
    const dueTasks = [];

    // 这里需要根据实际存储结构优化
    // 暂时使用简单的方法：遍历所有用户任务
    // 在生产环境中，建议使用索引或专门的调度器
    
    return dueTasks;
  }

  /**
   * 保存任务
   */
  async saveTask(task) {
    await this.kv.put(this.getTaskKey(task.id), JSON.stringify(task));
  }

  /**
   * 获取用户任务ID列表
   */
  async getUserTaskIds(userId) {
    const taskIdsData = await this.kv.get(this.getUserTasksKey(userId));
    return taskIdsData ? JSON.parse(taskIdsData) : [];
  }

  /**
   * 添加任务到用户列表
   */
  async addTaskToUserList(userId, taskId) {
    const taskIds = await this.getUserTaskIds(userId);
    if (!taskIds.includes(taskId)) {
      taskIds.push(taskId);
      await this.kv.put(this.getUserTasksKey(userId), JSON.stringify(taskIds));
    }
  }

  /**
   * 从用户列表中移除任务
   */
  async removeTaskFromUserList(userId, taskId) {
    const taskIds = await this.getUserTaskIds(userId);
    const index = taskIds.indexOf(taskId);
    if (index > -1) {
      taskIds.splice(index, 1);
      await this.kv.put(this.getUserTasksKey(userId), JSON.stringify(taskIds));
    }
  }

  /**
   * 记录任务执行日志
   */
  async logTaskExecution(task, logData) {
    const logEntry = {
      taskId: task.id,
      taskName: task.name,
      userId: task.userId,
      timestamp: Date.now(),
      ...logData
    };

    const logKey = `logs:${task.id}:${Date.now()}`;
    await this.kv.put(logKey, JSON.stringify(logEntry));

    // 可选：同步到R2存储用于长期归档
    if (this.r2) {
      const r2Key = `logs/${task.userId}/${task.id}/${Date.now()}.json`;
      await this.r2.put(r2Key, JSON.stringify(logEntry));
    }
  }

  /**
   * 获取任务执行日志
   */
  async getTaskLogs(taskId, limit = 100) {
    const logs = [];
    const list = await this.kv.list({ prefix: `logs:${taskId}:` });
    
    for (const key of list.keys.reverse().slice(0, limit)) {
      const logData = await this.kv.get(key.name);
      if (logData) {
        logs.push(JSON.parse(logData));
      }
    }

    return logs;
  }

  /**
   * 清理过期日志
   */
  async cleanupOldLogs(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30天
    const cutoff = Date.now() - maxAge;
    const list = await this.kv.list({ prefix: 'logs:' });
    
    for (const key of list.keys) {
      const timestamp = parseInt(key.name.split(':').pop());
      if (timestamp < cutoff) {
        await this.kv.delete(key.name);
      }
    }
  }
}

// 导出任务管理器
export { ServerCronManager, TaskStatus, TaskType };