# 服务端持久化定时任务系统

## 📋 概述

这是一个基于 Cloudflare Workers 的服务端持久化定时任务系统，解决了传统浏览器定时任务的关键问题：

- ❌ **浏览器依赖** - 浏览器关闭后任务停止
- ❌ **设备限制** - 无法跨设备同步任务状态  
- ❌ **可靠性低** - 后台标签页定时器可能被暂停
- ✅ **服务端持久化** - 任务数据安全存储在云端
- ✅ **跨设备同步** - 任何设备登录都能看到相同任务
- ✅ **高可靠性** - Cloudflare Workers 保证任务执行

## 🏗️ 系统架构

### 核心组件

1. **前端界面** (`index.html`) - 用户交互界面
2. **增强管理器** (`enhanced-cron.js`) - 同步管理和状态控制
3. **同步管理器** (`sync-manager.js`) - 前后端数据同步
4. **服务端核心** (`server-cron.js`) - 任务管理和执行逻辑
5. **API Worker** (`api-worker.js`) - REST API 接口
6. **Cron Worker** (`cron-worker.js`) - 定时任务执行器

### 数据流程

```
用户界面 → 增强管理器 → 同步管理器 → API Worker → 服务端核心
    ↓           ↓           ↓           ↓           ↓
本地存储 ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
    ↓           ↓           ↓           ↓           ↓
任务状态 ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

## 🚀 主要特性

### 1. 任务持久化
- ✅ 任务数据存储在 Cloudflare KV 中
- ✅ 支持用户间的数据隔离
- ✅ 自动数据备份和恢复
- ✅ 支持任务导入/导出

### 2. 跨设备同步
- ✅ 实时任务状态同步
- ✅ 冲突解决机制
- ✅ 离线支持和自动恢复
- ✅ 多设备一致性保证

### 3. 服务端执行
- ✅ Cloudflare Workers Cron 触发器
- ✅ 可靠的任务执行机制
- ✅ 错误处理和自动重试
- ✅ 任务执行日志和监控

### 4. 用户体验
- ✅ 响应式设计，支持移动端
- ✅ 明暗主题切换
- ✅ 实时状态显示
- ✅ 详细的调试信息

## 📦 安装和部署

### 1. 环境准备

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 KV 命名空间
wrangler kv namespace create CRON_TASKS_KV
wrangler kv namespace create CRON_LOGS_KV
```

### 2. 配置文件

更新 `wrangler.toml`:

```toml
[env.production]
name = "nssa-tools"
main = "worker.js"
compatibility_date = "2024-01-01"

# KV 绑定
[[env.production.kv_namespaces]]
binding = "CRON_TASKS_KV"
id = "YOUR_KV_ID"

[[env.production.kv_namespaces]]
binding = "CRON_LOGS_KV"
id = "YOUR_LOGS_KV_ID"

# Cron 触发器
[env.production.triggers]
crons = ["*/5 * * * *"]  # 每5分钟检查一次

# 环境变量
[env.production.env]
FIREBASE_API_KEY = "your_api_key"
FIREBASE_AUTH_DOMAIN = "your_auth_domain"
FIREBASE_PROJECT_ID = "your_project_id"
FIREBASE_STORAGE_BUCKET = "your_storage_bucket"
FIREBASE_MESSAGING_SENDER_ID = "your_messaging_sender_id"
FIREBASE_APP_ID = "your_app_id"
```

### 3. 部署

```bash
# 部署主应用
wrangler deploy --env production

# 部署 API Worker
wrangler deploy --env production api-worker

# 部署 Cron Worker
wrangler deploy --env production cron-worker
```

## 🔧 使用方法

### 1. 基本操作

#### 创建任务
```javascript
const taskData = {
    name: '每日数据备份',
    description: '备份重要数据到云存储',
    url: 'https://api.example.com/backup',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your-token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'full' }),
    type: 'advanced',
    config: {
        days: [1, 2, 3, 4, 5],  // 周一到周五
        time: '02:00',        // 凌晨2点
        maxRetries: 3,
        timeout: 300000       // 5分钟超时
    }
};

const task = await createTask(taskData);
```

#### 更新任务
```javascript
await updateTask(taskId, {
    name: '更新后的任务名',
    config: {
        interval: 30,
        unit: 'minutes'
    }
});
```

#### 删除任务
```javascript
await deleteTask(taskId);
```

#### 控制任务
```javascript
// 暂停任务
await toggleTask(taskId);  // 或者 pauseTask(taskId)

// 恢复任务
await toggleTask(taskId);  // 或者 resumeTask(taskId)

// 立即执行
await triggerTask(taskId);
```

### 2. 任务类型

#### 简单间隔任务
```javascript
{
    type: 'simple',
    config: {
        interval: 10,        // 数值
        unit: 'minutes'      // minutes, hours, days
    }
}
```

#### 高级定时任务
```javascript
{
    type: 'advanced',
    config: {
        days: [0, 1, 2, 3, 4, 5, 6],  // 0=周日, 1=周一, ..., 6=周六
        time: '14:30',                // HH:mm 格式
        timezone: 'Asia/Shanghai'     // 时区 (可选)
    }
}
```

### 3. 同步状态

```javascript
// 获取同步状态
const status = EnhancedCron.getSyncStatus();
console.log(status);
// {
//     enabled: true,
//     online: true,
//     lastSync: 1642345678901,
//     pendingSyncs: 0
// }

// 手动同步
if (syncManager) {
    await syncManager.syncWithServer();
}
```

## 🧪 测试

### 运行测试套件

```bash
# 在浏览器控制台运行
const testSuite = new CronTestSuite();
testSuite.runFullTestSuite();

// 清理测试数据
await testSuite.cleanupTestData();
```

### 测试覆盖

- ✅ 基础功能测试
- ✅ 任务管理测试
- ✅ 同步机制测试
- ✅ 并发处理测试
- ✅ 错误处理测试
- ✅ 性能测试

## 📊 监控和日志

### 1. 任务执行日志

```javascript
// 获取任务日志
if (syncManager) {
    const logs = await syncManager.getTaskLogs(taskId, 50);
    console.log(logs);
}
```

### 2. 性能监控

```javascript
// 获取存储使用情况
if (typeof UserStorage !== 'undefined') {
    const usage = UserStorage.getStorageUsage();
    console.log(usage);
    // {
    //     user: 'user@example.com',
    //     modules: { ... },
    //     total: 1024,
    //     totalKB: 1.0,
    //     totalMB: 0.0
    // }
}
```

### 3. 系统状态

```bash
# 查看 Worker 日志
wrangler tail --env production

# 检查 KV 存储
wrangler kv key list --prefix=task: --env production
```

## 🔍 故障排除

### 常见问题

1. **任务不执行**
   - 检查 Cron Worker 是否正常运行
   - 验证任务状态是否为 active
   - 查看执行日志

2. **同步失败**
   - 检查网络连接状态
   - 验证用户认证状态
   - 查看 API 错误日志

3. **存储空间不足**
   - 清理过期日志
   - 优化数据结构
   - 考虑升级存储方案

### 调试工具

```javascript
// 启用调试模式
localStorage.setItem('cron_debug', 'true');

// 查看同步管理器状态
console.log(syncManager);

// 查看任务详情
console.log(tasks);
```

## 🛡️ 安全考虑

### 1. 数据保护
- 用户数据完全隔离
- 敏感信息加密存储
- 访问权限控制

### 2. API 安全
- JWT 认证
- 请求限流
- 输入验证

### 3. 执行安全
- 请求超时控制
- 错误处理机制
- 恶意请求防护

## 💰 成本估算

### Cloudflare Workers

- **请求**: $0.50 per million requests
- **执行时间**: $0.50 per million GB-seconds
- **KV 存储**: $0.50 per GB-month

### 估算示例

对于 1000 个用户，每人 10 个任务：
- 每 5 分钟检查一次
- 月成本约: $5-10

## 📚 API 文档

### 任务 API

#### GET /api/tasks
获取用户任务列表

```javascript
const response = await fetch('/api/tasks', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const data = await response.json();
```

#### POST /api/tasks
创建新任务

```javascript
const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
});
```

#### PUT /api/tasks/{id}
更新任务

```javascript
const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
});
```

#### DELETE /api/tasks/{id}
删除任务

```javascript
const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

### 任务操作 API

#### POST /api/tasks/{id}?action=pause
暂停任务

#### POST /api/tasks/{id}?action=resume
恢复任务

#### POST /api/tasks/{id}?action=trigger
立即执行任务

#### GET /api/tasks/{id}/logs
获取任务日志

## 🤝 贡献

欢迎提交问题和改进建议！

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/your-repo/nssa-tools.git
cd nssa-tools

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Firebase Authentication 文档](https://firebase.google.com/docs/auth)
- [KV 存储文档](https://developers.cloudflare.com/kv/)
- [部署指南](./deployment-guide.md)

---

## 🎯 总结

服务端持久化定时任务系统提供了完整的解决方案，主要优势：

- 🚀 **高可靠性** - 基于 Cloudflare Workers
- 🔄 **跨设备同步** - 实时状态同步
- 💰 **低成本** - 按使用付费
- 🔧 **易维护** - 自动化的任务管理
- 📊 **完善监控** - 详细的执行日志

这个系统彻底解决了浏览器定时任务的根本问题，为用户提供了真正可靠的定时任务服务。