/**
 * 增强版定时任务管理器
 * 集成服务端同步和持久化功能
 */

// 全局变量
let syncManager = null;
let serverSyncEnabled = false;
let currentUser = null;
let tasks = [];
let taskTimers = new Map();

// 任务状态
const TaskStatus = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// 任务类型
const TaskType = {
    SIMPLE: 'simple',
    ADVANCED: 'advanced'
};

/**
 * 初始化增强版定时任务管理器
 */
async function initializeEnhancedCron() {
    console.log('Initializing enhanced cron manager...');
    
    try {
        // 等待UserStorage加载
        if (typeof UserStorage === 'undefined') {
            await waitForUserStorage();
        }
        
        // 初始化同步管理器
        await initializeSyncManager();
        
        // 监听认证状态变化
        setupAuthListener();
        
        // 监听任务同步事件
        setupTaskSyncListener();
        
        console.log('Enhanced cron manager initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize enhanced cron manager:', error);
    }
}

/**
 * 等待UserStorage加载完成
 */
function waitForUserStorage() {
    return new Promise((resolve) => {
        if (typeof UserStorage !== 'undefined') {
            resolve();
            return;
        }
        
        const checkInterval = setInterval(() => {
            if (typeof UserStorage !== 'undefined') {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // 超时保护
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
        }, 5000);
    });
}

/**
 * 初始化同步管理器
 */
async function initializeSyncManager() {
    if (typeof SyncManager === 'undefined') {
        console.warn('SyncManager not available, running in offline mode');
        return;
    }
    
    syncManager = new SyncManager();
    const initialized = await syncManager.initialize();
    
    if (initialized) {
        serverSyncEnabled = true;
        console.log('Server sync enabled');
        
        // 启用服务端定时器模式
        enableServerTimerMode();
    } else {
        console.log('Server sync disabled, using local timers only');
    }
}

/**
 * 启用服务端定时器模式
 */
function enableServerTimerMode() {
    console.log('Enabling server timer mode...');
    
    // 修改任务加载函数以支持服务端同步
    window.loadUserTasks = async function() {
        if (!currentUser) return;
        
        console.log('Loading user tasks with server sync...');
        
        // 清除现有计时器
        clearAllTimers();
        
        if (serverSyncEnabled && syncManager) {
            // 从同步管理器获取任务
            tasks = syncManager.getLocalTasks();
            
            // 立即执行一次同步
            await syncManager.syncWithServer();
        } else {
            // 使用本地存储
            loadLocalTasks();
        }
        
        // 初始化任务计时器（仅用于本地显示）
        initializeTaskTimers();
        
        renderTasks();
    };
    
    // 修改任务保存函数
    window.saveAndRender = async function() {
        if (!currentUser) return;
        
        if (serverSyncEnabled && syncManager) {
            await saveTasksWithSync();
        } else {
            saveLocalTasks();
        }
        
        renderTasks();
    };
    
    // 增强任务操作函数
    enhanceTaskOperations();
}

/**
 * 增强任务操作函数
 */
function enhanceTaskOperations() {
    // 保存原始函数
    const originalCreateTask = window.createTask;
    const originalUpdateTask = window.updateTask;
    const originalDeleteTask = window.deleteTask;
    const originalToggleTask = window.toggleTask;
    const originalTriggerTask = window.triggerTask;
    
    // 创建任务
    window.createTask = async function(taskData) {
        // 设置同步状态
        taskData.syncStatus = 'pending';
        taskData.updatedAt = Date.now();
        
        if (serverSyncEnabled && syncManager) {
            try {
                // 先创建本地任务
                const task = originalCreateTask(taskData);
                
                // 添加到待同步队列
                syncManager.addPendingSync({
                    type: 'create',
                    task: task
                });
                
                return task;
            } catch (error) {
                console.error('Failed to create task with sync:', error);
                return originalCreateTask(taskData);
            }
        } else {
            return originalCreateTask(taskData);
        }
    };
    
    // 更新任务
    window.updateTask = async function(taskId, updates) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // 更新同步状态
        task.syncStatus = 'pending';
        task.updatedAt = Date.now();
        
        if (serverSyncEnabled && syncManager) {
            try {
                // 先本地更新
                originalUpdateTask(taskId, updates);
                
                // 添加到待同步队列
                syncManager.addPendingSync({
                    type: 'update',
                    taskId: taskId,
                    updates: updates
                });
                
            } catch (error) {
                console.error('Failed to update task with sync:', error);
                originalUpdateTask(taskId, updates);
            }
        } else {
            originalUpdateTask(taskId, updates);
        }
    };
    
    // 删除任务
    window.deleteTask = async function(taskId) {
        if (serverSyncEnabled && syncManager) {
            try {
                // 先本地删除
                originalDeleteTask(taskId);
                
                // 添加到待同步队列
                syncManager.addPendingSync({
                    type: 'delete',
                    taskId: taskId
                });
                
            } catch (error) {
                console.error('Failed to delete task with sync:', error);
                originalDeleteTask(taskId);
            }
        } else {
            originalDeleteTask(taskId);
        }
    };
    
    // 切换任务状态
    window.toggleTask = async function(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const newStatus = task.isActive ? TaskStatus.PAUSED : TaskStatus.ACTIVE;
        
        if (serverSyncEnabled && syncManager) {
            try {
                // 先本地切换
                originalToggleTask(taskId);
                
                // 添加到待同步队列
                syncManager.addPendingSync({
                    type: newStatus === TaskStatus.PAUSED ? 'pause' : 'resume',
                    taskId: taskId
                });
                
            } catch (error) {
                console.error('Failed to toggle task with sync:', error);
                originalToggleTask(taskId);
            }
        } else {
            originalToggleTask(taskId);
        }
    };
    
    // 触发任务执行
    window.triggerTask = async function(taskId) {
        if (serverSyncEnabled && syncManager) {
            try {
                // 使用服务端触发
                const result = await syncManager.executeTaskAction(taskId, 'trigger');
                
                // 更新本地任务状态
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    task.lastRunTime = Date.now();
                    task.runCount = (task.runCount || 0) + 1;
                    saveLocalTasks();
                    renderTasks();
                }
                
                return result;
            } catch (error) {
                console.error('Failed to trigger task on server:', error);
                return originalTriggerTask(taskId);
            }
        } else {
            return originalTriggerTask(taskId);
        }
    };
}

/**
 * 设置认证监听器
 */
function setupAuthListener() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        return;
    }
    
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            
            // 重新初始化同步管理器
            if (syncManager) {
                syncManager.destroy();
            }
            await initializeSyncManager();
            
            // 加载用户任务
            if (window.loadUserTasks) {
                await window.loadUserTasks();
            }
        } else {
            currentUser = null;
            
            // 清理同步管理器
            if (syncManager) {
                syncManager.destroy();
                syncManager = null;
            }
            
            serverSyncEnabled = false;
            tasks = [];
            clearAllTimers();
            renderTasks();
        }
    });
}

/**
 * 设置任务同步监听器
 */
function setupTaskSyncListener() {
    window.addEventListener('tasksSynced', (event) => {
        const { tasks: syncedTasks, conflicts } = event.detail;
        
        console.log('Tasks synced:', syncedTasks.length, 'tasks');
        
        if (conflicts.length > 0) {
            console.warn('Sync conflicts detected:', conflicts);
            showSyncConflicts(conflicts);
        }
        
        // 更新本地任务列表
        tasks = syncedTasks;
        
        // 重新初始化计时器
        clearAllTimers();
        initializeTaskTimers();
        
        renderTasks();
    });
}

/**
 * 显示同步冲突
 */
function showSyncConflicts(conflicts) {
    conflicts.forEach(conflict => {
        const message = `任务 "${conflict.localTask.name}" 发生同步冲突，已使用${conflict.type === 'local_wins' ? '本地' : '服务器'}版本`;
        showNotification(message, 'warning');
    });
}

/**
 * 保存任务并同步
 */
async function saveTasksWithSync() {
    try {
        // 保存到本地存储
        saveLocalTasks();
        
        // 如果有同步管理器，立即同步
        if (syncManager) {
            await syncManager.syncWithServer();
        }
    } catch (error) {
        console.error('Failed to save tasks with sync:', error);
        saveLocalTasks();
    }
}

/**
 * 加载本地任务
 */
function loadLocalTasks() {
    try {
        const tasksJson = localStorage.getItem(getUserTaskKey());
        tasks = tasksJson ? JSON.parse(tasksJson) : [];
    } catch (error) {
        console.error('Failed to load local tasks:', error);
        tasks = [];
    }
}

/**
 * 保存本地任务
 */
function saveLocalTasks() {
    try {
        localStorage.setItem(getUserTaskKey(), JSON.stringify(tasks));
    } catch (error) {
        console.error('Failed to save local tasks:', error);
    }
}

/**
 * 获取用户任务键
 */
function getUserTaskKey() {
    if (typeof UserStorage !== 'undefined') {
        return UserStorage.getStorageKey(UserStorage.MODULES.CRON);
    }
    
    const email = (currentUser?.email || '').toLowerCase();
    return `webhook_tasks_v2_${email}`;
}

/**
 * 初始化任务计时器
 */
function initializeTaskTimers() {
    tasks.forEach(task => {
        if (task.isActive || task.status === TaskStatus.ACTIVE) {
            scheduleTaskTimer(task);
        }
    });
}

/**
 * 安排任务计时器
 */
function scheduleTaskTimer(task) {
    clearTaskTimer(task.id);
    
    if (!serverSyncEnabled) {
        // 仅在本地模式下使用浏览器定时器
        const nextRun = calculateNextRunTime(task);
        if (nextRun) {
            const delay = nextRun - Date.now();
            if (delay > 0) {
                const timerId = setTimeout(() => executeTask(task), delay);
                taskTimers.set(task.id, timerId);
            }
        }
    }
}

/**
 * 清除任务计时器
 */
function clearTaskTimer(taskId) {
    if (taskTimers.has(taskId)) {
        clearTimeout(taskTimers.get(taskId));
        taskTimers.delete(taskId);
    }
}

/**
 * 清除所有计时器
 */
function clearAllTimers() {
    taskTimers.forEach(timerId => clearTimeout(timerId));
    taskTimers.clear();
}

/**
 * 计算下次运行时间
 */
function calculateNextRunTime(task) {
    const now = new Date();
    
    if (task.type === TaskType.SIMPLE) {
        const interval = task.interval || 1;
        const unit = task.unit || 'minutes';
        
        let multiplier = 1;
        switch (unit) {
            case 'minutes': multiplier = 60 * 1000; break;
            case 'hours': multiplier = 60 * 60 * 1000; break;
            case 'days': multiplier = 24 * 60 * 60 * 1000; break;
        }
        
        return new Date(now.getTime() + interval * multiplier);
        
    } else if (task.type === TaskType.ADVANCED) {
        const days = task.days || [];
        const time = task.time || '00:00';
        
        if (days.length === 0) return null;
        
        const [hours, minutes] = time.split(':').map(Number);
        let nextRun = new Date(now);
        nextRun.setHours(hours, minutes, 0, 0);
        
        if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
        }
        
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
 * 执行任务
 */
async function executeTask(task) {
    console.log(`Executing task: ${task.name}`);
    
    try {
        const startTime = Date.now();
        
        // 构建请求选项
        const options = {
            method: task.method || 'GET',
            headers: {
                'User-Agent': 'NSSA-Tools-Cron/1.0',
                ...(task.headers || {})
            }
        };
        
        if (task.body && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
            options.body = task.body;
        }
        
        // 执行HTTP请求
        const response = await fetch(task.url, options);
        
        // 更新任务统计
        task.lastRunTime = startTime;
        task.runCount = (task.runCount || 0) + 1;
        task.lastError = null;
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log(`Task executed successfully: ${task.name}`);
        
    } catch (error) {
        console.error(`Task execution failed: ${task.name}`, error);
        
        task.lastError = error.message;
        task.failureCount = (task.failureCount || 0) + 1;
    }
    
    // 保存任务状态
    saveLocalTasks();
    
    // 安排下次执行
    if (task.isActive || task.status === TaskStatus.ACTIVE) {
        scheduleTaskTimer(task);
    }
    
    renderTasks();
}

/**
 * 显示通知
 */
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`Notification [${type}]: ${message}`);
    }
}

/**
 * 渲染任务列表
 */
function renderTasks() {
    if (typeof window.renderTasks === 'function') {
        window.renderTasks();
    }
}

// 启动增强版定时任务管理器
document.addEventListener('DOMContentLoaded', () => {
    initializeEnhancedCron();
});

// 导出到全局
window.EnhancedCron = {
    initialize: initializeEnhancedCron,
    isServerSyncEnabled: () => serverSyncEnabled,
    getSyncStatus: () => ({
        enabled: serverSyncEnabled,
        online: navigator.onLine,
        lastSync: syncManager?.lastSync || null,
        pendingSyncs: syncManager?.pendingSyncs?.length || 0
    })
};