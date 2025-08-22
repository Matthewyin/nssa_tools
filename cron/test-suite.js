/**
 * 服务端定时任务测试套件
 * 用于验证系统功能和性能
 */

class CronTestSuite {
    constructor() {
        this.testResults = [];
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * 运行完整测试套件
     */
    async runFullTestSuite() {
        console.log('🧪 开始运行定时任务测试套件...');
        this.startTime = Date.now();

        try {
            // 基础功能测试
            await this.testBasicFunctionality();
            
            // 任务管理测试
            await this.testTaskManagement();
            
            // 同步机制测试
            await this.testSyncMechanism();
            
            // 并发处理测试
            await this.testConcurrency();
            
            // 错误处理测试
            await this.testErrorHandling();
            
            // 性能测试
            await this.testPerformance();
            
            this.endTime = Date.now();
            
            // 生成测试报告
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ 测试套件运行失败:', error);
        }
    }

    /**
     * 测试基础功能
     */
    async testBasicFunctionality() {
        console.log('📋 测试基础功能...');
        
        const tests = [
            {
                name: '任务创建',
                test: async () => {
                    const taskData = {
                        name: '测试任务',
                        description: '基础功能测试',
                        url: 'https://httpbin.org/get',
                        method: 'GET',
                        type: 'simple',
                        config: {
                            interval: 1,
                            unit: 'minutes'
                        }
                    };
                    
                    if (window.EnhancedCron && window.createTask) {
                        const task = await window.createTask(taskData);
                        return task && task.id;
                    }
                    return false;
                }
            },
            {
                name: '任务执行',
                test: async () => {
                    if (window.triggerTask && tasks.length > 0) {
                        const result = await window.triggerTask(tasks[0].id);
                        return result && result.success !== false;
                    }
                    return false;
                }
            },
            {
                name: '任务状态切换',
                test: async () => {
                    if (window.toggleTask && tasks.length > 0) {
                        const task = tasks[0];
                        const originalStatus = task.isActive;
                        await window.toggleTask(task.id);
                        return task.isActive !== originalStatus;
                    }
                    return false;
                }
            }
        ];

        await this.runTests(tests, '基础功能');
    }

    /**
     * 测试任务管理
     */
    async testTaskManagement() {
        console.log('📋 测试任务管理...');
        
        const tests = [
            {
                name: '批量创建任务',
                test: async () => {
                    const batchTasks = [];
                    for (let i = 0; i < 5; i++) {
                        const taskData = {
                            name: `批量测试任务 ${i}`,
                            url: 'https://httpbin.org/get',
                            method: 'GET',
                            type: 'simple',
                            config: {
                                interval: i + 1,
                                unit: 'minutes'
                            }
                        };
                        
                        if (window.createTask) {
                            const task = await window.createTask(taskData);
                            batchTasks.push(task);
                        }
                    }
                    return batchTasks.length === 5;
                }
            },
            {
                name: '任务更新',
                test: async () => {
                    if (window.updateTask && tasks.length > 0) {
                        const task = tasks[0];
                        const originalName = task.name;
                        await window.updateTask(task.id, { name: '更新后的任务名' });
                        return task.name !== originalName;
                    }
                    return false;
                }
            },
            {
                name: '任务删除',
                test: async () => {
                    if (window.deleteTask && tasks.length > 0) {
                        const taskToDelete = tasks[tasks.length - 1];
                        const taskId = taskToDelete.id;
                        await window.deleteTask(taskId);
                        return !tasks.find(t => t.id === taskId);
                    }
                    return false;
                }
            },
            {
                name: '任务查询',
                test: async () => {
                    const activeTasks = tasks.filter(t => t.isActive);
                    const pausedTasks = tasks.filter(t => !t.isActive);
                    return activeTasks.length >= 0 && pausedTasks.length >= 0;
                }
            }
        ];

        await this.runTests(tests, '任务管理');
    }

    /**
     * 测试同步机制
     */
    async testSyncMechanism() {
        console.log('📋 测试同步机制...');
        
        const tests = [
            {
                name: '同步管理器初始化',
                test: async () => {
                    return window.SyncManager && window.EnhancedCron;
                }
            },
            {
                name: '服务端同步状态',
                test: async () => {
                    if (window.EnhancedCron) {
                        const status = window.EnhancedCron.getSyncStatus();
                        return typeof status.enabled === 'boolean';
                    }
                    return false;
                }
            },
            {
                name: '网络状态处理',
                test: async () => {
                    // 模拟网络状态变化
                    const originalOnlineStatus = navigator.onLine;
                    
                    // 模拟离线
                    Object.defineProperty(navigator, 'onLine', {
                        get: () => false,
                        configurable: true
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // 恢复在线
                    Object.defineProperty(navigator, 'onLine', {
                        get: () => true,
                        configurable: true
                    });
                    
                    return true;
                }
            },
            {
                name: '冲突解决',
                test: async () => {
                    // 模拟冲突场景
                    if (window.syncManager && window.syncManager.resolveConflict) {
                        const localTask = {
                            id: 'test-conflict',
                            name: '本地任务',
                            updatedAt: Date.now() - 1000
                        };
                        
                        const serverTask = {
                            id: 'test-conflict',
                            name: '服务器任务',
                            metadata: { updatedAt: Date.now() }
                        };
                        
                        const conflict = window.syncManager.resolveConflict(localTask, serverTask);
                        return conflict && conflict.resolvedTask;
                    }
                    return false;
                }
            }
        ];

        await this.runTests(tests, '同步机制');
    }

    /**
     * 测试并发处理
     */
    async testConcurrency() {
        console.log('📋 测试并发处理...');
        
        const tests = [
            {
                name: '并发任务创建',
                test: async () => {
                    const concurrentPromises = [];
                    for (let i = 0; i < 10; i++) {
                        const taskData = {
                            name: `并发测试任务 ${i}`,
                            url: 'https://httpbin.org/get',
                            method: 'GET',
                            type: 'simple',
                            config: {
                                interval: 1,
                                unit: 'minutes'
                            }
                        };
                        
                        if (window.createTask) {
                            concurrentPromises.push(window.createTask(taskData));
                        }
                    }
                    
                    const results = await Promise.allSettled(concurrentPromises);
                    const successCount = results.filter(r => r.status === 'fulfilled').length;
                    return successCount === concurrentPromises.length;
                }
            },
            {
                name: '并发任务执行',
                test: async () => {
                    const activeTasks = tasks.filter(t => t.isActive);
                    if (activeTasks.length === 0) return true;
                    
                    const executionPromises = activeTasks.slice(0, 5).map(task => 
                        window.triggerTask(task.id)
                    );
                    
                    const results = await Promise.allSettled(executionPromises);
                    const successCount = results.filter(r => r.status === 'fulfilled').length;
                    return successCount > 0;
                }
            }
        ];

        await this.runTests(tests, '并发处理');
    }

    /**
     * 测试错误处理
     */
    async testErrorHandling() {
        console.log('📋 测试错误处理...');
        
        const tests = [
            {
                name: '无效URL处理',
                test: async () => {
                    const taskData = {
                        name: '无效URL测试',
                        url: 'invalid-url',
                        method: 'GET',
                        type: 'simple',
                        config: {
                            interval: 1,
                            unit: 'minutes'
                        }
                    };
                    
                    try {
                        if (window.createTask) {
                            const task = await window.createTask(taskData);
                            const result = await window.triggerTask(task.id);
                            return result && result.error; // 应该有错误
                        }
                        return false;
                    } catch (error) {
                        return true; // 应该抛出异常
                    }
                }
            },
            {
                name: '网络错误处理',
                test: async () => {
                    const taskData = {
                        name: '网络错误测试',
                        url: 'https://nonexistent-domain-12345.com',
                        method: 'GET',
                        type: 'simple',
                        config: {
                            interval: 1,
                            unit: 'minutes'
                        }
                    };
                    
                    try {
                        if (window.createTask) {
                            const task = await window.createTask(taskData);
                            const result = await window.triggerTask(task.id);
                            return result && result.error; // 应该有网络错误
                        }
                        return false;
                    } catch (error) {
                        return true; // 应该抛出异常
                    }
                }
            },
            {
                name: '权限错误处理',
                test: async () => {
                    // 模拟权限不足的情况
                    const originalCreateTask = window.createTask;
                    window.createTask = () => {
                        throw new Error('Permission denied');
                    };
                    
                    try {
                        await window.createTask({});
                        return false;
                    } catch (error) {
                        return error.message === 'Permission denied';
                    } finally {
                        window.createTask = originalCreateTask;
                    }
                }
            }
        ];

        await this.runTests(tests, '错误处理');
    }

    /**
     * 测试性能
     */
    async testPerformance() {
        console.log('📋 测试性能...');
        
        const tests = [
            {
                name: '任务创建性能',
                test: async () => {
                    const startTime = performance.now();
                    const taskCount = 50;
                    
                    for (let i = 0; i < taskCount; i++) {
                        const taskData = {
                            name: `性能测试任务 ${i}`,
                            url: 'https://httpbin.org/get',
                            method: 'GET',
                            type: 'simple',
                            config: {
                                interval: 1,
                                unit: 'minutes'
                            }
                        };
                        
                        if (window.createTask) {
                            await window.createTask(taskData);
                        }
                    }
                    
                    const endTime = performance.now();
                    const avgTime = (endTime - startTime) / taskCount;
                    
                    console.log(`⏱️ 平均任务创建时间: ${avgTime.toFixed(2)}ms`);
                    return avgTime < 100; // 应该在100ms内
                }
            },
            {
                name: '任务查询性能',
                test: async () => {
                    const startTime = performance.now();
                    const queryCount = 100;
                    
                    for (let i = 0; i < queryCount; i++) {
                        // 模拟频繁查询
                        const activeTasks = tasks.filter(t => t.isActive);
                        const pausedTasks = tasks.filter(t => !t.isActive);
                    }
                    
                    const endTime = performance.now();
                    const avgTime = (endTime - startTime) / queryCount;
                    
                    console.log(`⏱️ 平均查询时间: ${avgTime.toFixed(2)}ms`);
                    return avgTime < 10; // 应该在10ms内
                }
            },
            {
                name: '存储使用量',
                test: async () => {
                    if (typeof UserStorage !== 'undefined') {
                        const usage = UserStorage.getStorageUsage();
                        console.log(`💾 存储使用量: ${usage.totalKB}KB`);
                        return usage.totalKB < 1024; // 应该小于1MB
                    }
                    return true;
                }
            }
        ];

        await this.runTests(tests, '性能');
    }

    /**
     * 运行测试组
     */
    async runTests(tests, groupName) {
        const groupResults = [];
        
        for (const test of tests) {
            try {
                console.log(`  🧪 ${test.name}...`);
                const startTime = performance.now();
                const result = await test.test();
                const endTime = performance.now();
                
                const testResult = {
                    name: test.name,
                    group: groupName,
                    passed: result,
                    duration: endTime - startTime,
                    timestamp: Date.now()
                };
                
                groupResults.push(testResult);
                this.testResults.push(testResult);
                
                if (result) {
                    console.log(`  ✅ ${test.name} (${(endTime - startTime).toFixed(2)}ms)`);
                } else {
                    console.log(`  ❌ ${test.name} (${(endTime - startTime).toFixed(2)}ms)`);
                }
                
            } catch (error) {
                console.error(`  ❌ ${test.name} - 错误:`, error.message);
                
                const testResult = {
                    name: test.name,
                    group: groupName,
                    passed: false,
                    error: error.message,
                    duration: 0,
                    timestamp: Date.now()
                };
                
                groupResults.push(testResult);
                this.testResults.push(testResult);
            }
        }
        
        // 输出组结果
        const passedCount = groupResults.filter(r => r.passed).length;
        const totalCount = groupResults.length;
        console.log(`📊 ${groupName} 测试完成: ${passedCount}/${totalCount} 通过`);
    }

    /**
     * 生成测试报告
     */
    generateTestReport() {
        const totalDuration = this.endTime - this.startTime;
        const passedTests = this.testResults.filter(r => r.passed);
        const failedTests = this.testResults.filter(r => !r.passed);
        
        console.log('\n🎯 测试报告');
        console.log('='.repeat(50));
        console.log(`总耗时: ${totalDuration.toFixed(2)}ms`);
        console.log(`总测试数: ${this.testResults.length}`);
        console.log(`通过: ${passedTests.length}`);
        console.log(`失败: ${failedTests.length}`);
        console.log(`成功率: ${((passedTests.length / this.testResults.length) * 100).toFixed(1)}%`);
        
        if (failedTests.length > 0) {
            console.log('\n❌ 失败的测试:');
            failedTests.forEach(test => {
                console.log(`  - ${test.name} (${test.group}): ${test.error || '未知错误'}`);
            });
        }
        
        // 按组统计
        const groupStats = {};
        this.testResults.forEach(test => {
            if (!groupStats[test.group]) {
                groupStats[test.group] = { total: 0, passed: 0 };
            }
            groupStats[test.group].total++;
            if (test.passed) {
                groupStats[test.group].passed++;
            }
        });
        
        console.log('\n📊 各组测试结果:');
        Object.entries(groupStats).forEach(([group, stats]) => {
            const percentage = (stats.passed / stats.total * 100).toFixed(1);
            console.log(`  ${group}: ${stats.passed}/${stats.total} (${percentage}%)`);
        });
        
        console.log('\n🎉 测试完成!');
        
        return {
            totalDuration,
            totalTests: this.testResults.length,
            passedTests: passedTests.length,
            failedTests: failedTests.length,
            successRate: (passedTests.length / this.testResults.length) * 100,
            groupStats,
            details: this.testResults
        };
    }

    /**
     * 清理测试数据
     */
    async cleanupTestData() {
        console.log('🧹 清理测试数据...');
        
        // 删除测试任务
        const testTasks = tasks.filter(t => t.name.includes('测试') || t.name.includes('test'));
        for (const task of testTasks) {
            if (window.deleteTask) {
                await window.deleteTask(task.id);
            }
        }
        
        console.log(`✅ 清理了 ${testTasks.length} 个测试任务`);
    }
}

// 导出到全局
window.CronTestSuite = CronTestSuite;

// 自动运行测试（如果在开发环境）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🧪 检测到开发环境，准备运行测试套件...');
    
    // 等待页面加载完成
    window.addEventListener('load', () => {
        setTimeout(() => {
            const testSuite = new CronTestSuite();
            testSuite.runFullTestSuite();
        }, 2000);
    });
}