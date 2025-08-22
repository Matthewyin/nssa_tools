/**
 * 任务同步管理器
 * 负责前后端数据同步和状态管理
 */

class SyncManager {
  constructor() {
    this.apiBaseUrl = '/api'; // API worker的路径
    this.syncInterval = 30000; // 30秒同步一次
    this.syncTimer = null;
    this.isOnline = navigator.onLine;
    this.pendingSyncs = [];
    
    // 监听网络状态变化
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * 初始化同步管理器
   */
  async initialize() {
    try {
      // 获取用户认证token
      this.authToken = await this.getAuthToken();
      
      if (!this.authToken) {
        console.warn('User not authenticated, sync disabled');
        return false;
      }

      // 启动定期同步
      this.startPeriodicSync();
      
      // 监听存储变化（其他标签页的更新）
      this.setupStorageListener();
      
      console.log('Sync manager initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize sync manager:', error);
      return false;
    }
  }

  /**
   * 获取Firebase认证token
   */
  async getAuthToken() {
    return new Promise((resolve) => {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        resolve(null);
        return;
      }

      const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
        unsubscribe();
        
        if (user) {
          try {
            const token = await user.getIdToken();
            resolve(token);
          } catch (error) {
            console.error('Failed to get auth token:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * 启动定期同步
   */
  startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncWithServer();
    }, this.syncInterval);

    // 立即执行一次同步
    this.syncWithServer();
  }

  /**
   * 停止定期同步
   */
  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * 与服务器同步任务
   */
  async syncWithServer() {
    if (!this.isOnline || !this.authToken) {
      return;
    }

    try {
      // 获取服务器任务列表
      const serverTasks = await this.fetchServerTasks();
      
      // 获取本地任务列表
      const localTasks = this.getLocalTasks();
      
      // 比较并同步差异
      await this.syncTasks(localTasks, serverTasks);
      
      // 处理待同步的本地操作
      await this.processPendingSyncs();
      
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  /**
   * 从服务器获取任务列表
   */
  async fetchServerTasks() {
    const response = await fetch(`${this.apiBaseUrl}/tasks`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch server tasks: ${response.status}`);
    }

    const data = await response.json();
    return data.tasks || [];
  }

  /**
   * 获取本地任务列表
   */
  getLocalTasks() {
    try {
      const tasks = UserStorage.getUserData(UserStorage.MODULES.CRON, []);
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error('Failed to get local tasks:', error);
      return [];
    }
  }

  /**
   * 保存本地任务列表
   */
  saveLocalTasks(tasks) {
    try {
      UserStorage.setUserData(UserStorage.MODULES.CRON, tasks);
    } catch (error) {
      console.error('Failed to save local tasks:', error);
    }
  }

  /**
   * 同步任务列表
   */
  async syncTasks(localTasks, serverTasks) {
    const serverTaskMap = new Map(serverTasks.map(task => [task.id, task]));
    const localTaskMap = new Map(localTasks.map(task => [task.id, task]));
    
    const mergedTasks = [];
    const conflicts = [];
    
    // 处理本地任务
    for (const localTask of localTasks) {
      const serverTask = serverTaskMap.get(localTask.id);
      
      if (!serverTask) {
        // 本地有但服务器没有的任务
        if (localTask.syncStatus !== 'deleted') {
          // 上传到服务器
          try {
            const createdTask = await this.createTaskOnServer(localTask);
            mergedTasks.push(this.convertServerTaskToLocal(createdTask));
          } catch (error) {
            console.error('Failed to create task on server:', error);
            mergedTasks.push(localTask); // 保留本地任务
          }
        }
      } else {
        // 本地和服务器都有的任务
        const conflict = this.resolveConflict(localTask, serverTask);
        if (conflict) {
          conflicts.push(conflict);
          mergedTasks.push(conflict.resolvedTask);
        } else {
          mergedTasks.push(this.convertServerTaskToLocal(serverTask));
        }
      }
    }
    
    // 处理服务器独有的任务
    for (const serverTask of serverTasks) {
      if (!localTaskMap.has(serverTask.id)) {
        mergedTasks.push(this.convertServerTaskToLocal(serverTask));
      }
    }
    
    // 保存合并后的任务列表
    this.saveLocalTasks(mergedTasks);
    
    // 通知UI更新
    this.notifyUIUpdate(mergedTasks, conflicts);
    
    return mergedTasks;
  }

  /**
   * 解决任务冲突
   */
  resolveConflict(localTask, serverTask) {
    const localUpdated = localTask.updatedAt || 0;
    const serverUpdated = serverTask.metadata?.updatedAt || 0;
    
    // 使用更新时间戳解决冲突
    if (localUpdated > serverUpdated) {
      // 本地任务更新，需要同步到服务器
      return {
        type: 'local_wins',
        localTask,
        serverTask,
        resolvedTask: localTask
      };
    } else if (serverUpdated > localUpdated) {
      // 服务器任务更新，使用服务器版本
      return {
        type: 'server_wins',
        localTask,
        serverTask,
        resolvedTask: this.convertServerTaskToLocal(serverTask)
      };
    } else {
      // 时间戳相同，使用服务器版本
      return {
        type: 'server_wins',
        localTask,
        serverTask,
        resolvedTask: this.convertServerTaskToLocal(serverTask)
      };
    }
  }

  /**
   * 转换服务器任务为本地格式
   */
  convertServerTaskToLocal(serverTask) {
    return {
      id: serverTask.id,
      name: serverTask.name,
      description: serverTask.description,
      url: serverTask.url,
      method: serverTask.method,
      headers: serverTask.headers,
      body: serverTask.body,
      type: serverTask.type,
      status: serverTask.status,
      config: serverTask.config,
      syncStatus: 'synced',
      lastSync: Date.now(),
      updatedAt: serverTask.metadata?.updatedAt || Date.now(),
      // 本地特有的字段
      timerId: null,
      nextRunTime: serverTask.metadata?.nextRunAt,
      lastRunTime: serverTask.metadata?.lastRunAt,
      runCount: serverTask.metadata?.runCount || 0,
      failureCount: serverTask.metadata?.failureCount || 0,
      lastError: serverTask.metadata?.lastError
    };
  }

  /**
   * 转换本地任务为服务器格式
   */
  convertLocalTaskToServer(localTask) {
    return {
      name: localTask.name,
      description: localTask.description,
      url: localTask.url,
      method: localTask.method,
      headers: localTask.headers,
      body: localTask.body,
      type: localTask.type,
      status: localTask.status,
      config: localTask.config
    };
  }

  /**
   * 在服务器上创建任务
   */
  async createTaskOnServer(localTask) {
    const serverTaskData = this.convertLocalTaskToServer(localTask);
    
    const response = await fetch(`${this.apiBaseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serverTaskData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.status}`);
    }

    const data = await response.json();
    return data.task;
  }

  /**
   * 在服务器上更新任务
   */
  async updateTaskOnServer(taskId, updates) {
    const response = await fetch(`${this.apiBaseUrl}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.status}`);
    }

    const data = await response.json();
    return data.task;
  }

  /**
   * 在服务器上删除任务
   */
  async deleteTaskOnServer(taskId) {
    const response = await fetch(`${this.apiBaseUrl}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.status}`);
    }
  }

  /**
   * 处理待同步的操作
   */
  async processPendingSyncs() {
    const pendingSyncs = [...this.pendingSyncs];
    this.pendingSyncs = [];

    for (const sync of pendingSyncs) {
      try {
        await this.executeSync(sync);
      } catch (error) {
        console.error('Failed to execute sync:', sync, error);
        // 重新加入待同步队列
        this.pendingSyncs.push(sync);
      }
    }
  }

  /**
   * 执行同步操作
   */
  async executeSync(sync) {
    switch (sync.type) {
      case 'create':
        await this.createTaskOnServer(sync.task);
        break;
      case 'update':
        await this.updateTaskOnServer(sync.taskId, sync.updates);
        break;
      case 'delete':
        await this.deleteTaskOnServer(sync.taskId);
        break;
      case 'pause':
        await this.executeTaskAction(sync.taskId, 'pause');
        break;
      case 'resume':
        await this.executeTaskAction(sync.taskId, 'resume');
        break;
      case 'trigger':
        await this.executeTaskAction(sync.taskId, 'trigger');
        break;
    }
  }

  /**
   * 执行任务操作
   */
  async executeTaskAction(taskId, action) {
    const response = await fetch(`${this.apiBaseUrl}/tasks/${taskId}?action=${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} task: ${response.status}`);
    }
  }

  /**
   * 添加待同步操作
   */
  addPendingSync(sync) {
    this.pendingSyncs.push(sync);
  }

  /**
   * 设置存储监听器
   */
  setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('webhook_tasks_v2_')) {
        // 其他标签页更新了任务数据，重新同步
        this.syncWithServer();
      }
    });
  }

  /**
   * 处理网络在线状态
   */
  handleOnline() {
    this.isOnline = true;
    console.log('Network online, starting sync');
    this.syncWithServer();
  }

  /**
   * 处理网络离线状态
   */
  handleOffline() {
    this.isOnline = false;
    console.log('Network offline, sync paused');
  }

  /**
   * 通知UI更新
   */
  notifyUIUpdate(tasks, conflicts) {
    // 触发自定义事件通知UI更新
    const event = new CustomEvent('tasksSynced', {
      detail: { tasks, conflicts }
    });
    window.dispatchEvent(event);
  }

  /**
   * 销毁同步管理器
   */
  destroy() {
    this.stopPeriodicSync();
    this.pendingSyncs = [];
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

// 导出到全局
window.SyncManager = SyncManager;