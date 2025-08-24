# 服务端定时任务部署指南

## 概述

本指南介绍如何部署服务端持久化定时任务系统，实现跨设备的任务一致性。

## 系统架构

### 组件说明

1. **前端界面** (`/cron/index.html`) - 用户界面和本地定时器
2. **增强管理器** (`/cron/enhanced-cron.js`) - 同步管理和状态控制
3. **同步管理器** (`/cron/sync-manager.js`) - 前后端数据同步
4. **服务端核心** (`/cron/server-cron.js`) - 任务管理和执行逻辑
5. **API Worker** (`/cron/api-worker.js`) - REST API接口
6. **Cron Worker** (`/cron/cron-worker.js`) - 定时任务执行器

### 数据流程

```
用户界面 → 增强管理器 → 同步管理器 → API Worker → 服务端核心 → Cron Worker
    ↓           ↓           ↓           ↓           ↓           ↓
本地存储 ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
    ↓           ↓           ↓           ↓           ↓           ↓
任务状态 ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

## 部署步骤

### 1. Cloudflare Workers 配置

#### 1.1 创建 KV 命名空间

```bash
# 创建任务存储 KV
wrangler kv namespace create CRON_TASKS_KV --preview
wrangler kv namespace create CRON_TASKS_KV

# 创建日志存储 KV (可选)
wrangler kv namespace create CRON_LOGS_KV --preview
wrangler kv namespace create CRON_LOGS_KV

# 创建 R2 存储桶 (可选，用于长期日志存储)
wrangler r2 bucket create CRON_LOGS_R2
```

#### 1.2 配置 wrangler.toml

```toml
# 主应用配置
[env.production]
name = "nssa-tools"
main = "worker.js"
compatibility_date = "2024-01-01"

# KV 绑定
[[env.production.kv_namespaces]]
binding = "CRON_TASKS_KV"
preview_id = "YOUR_PREVIEW_ID"
id = "YOUR_PRODUCTION_ID"

[[env.production.kv_namespaces]]
binding = "CRON_LOGS_KV"
preview_id = "YOUR_PREVIEW_ID"
id = "YOUR_PRODUCTION_ID"

# R2 绑定 (可选)
[[env.production.r2_buckets]]
binding = "CRON_LOGS_R2"
bucket_name = "CRON_LOGS_R2"

# Cron 触发器配置
[env.production.triggers]
crons = ["*/5 * * * *"] # 每5分钟检查一次任务

# 环境变量
[env.production.env]
FIREBASE_API_KEY = "your_firebase_api_key"
FIREBASE_AUTH_DOMAIN = "your_firebase_auth_domain"
FIREBASE_PROJECT_ID = "your_firebase_project_id"
FIREBASE_STORAGE_BUCKET = "your_firebase_storage_bucket"
FIREBASE_MESSAGING_SENDER_ID = "your_firebase_messaging_sender_id"
FIREBASE_APP_ID = "your_firebase_app_id"

# API Worker 配置
[env.production.api_worker]
name = "nssa-tools-api"
main = "cron/api-worker.js"
compatibility_date = "2024-01-01"

# Cron Worker 配置
[env.production.cron_worker]
name = "nssa-tools-cron"
main = "cron/cron-worker.js"
compatibility_date = "2024-01-01"
```

### 2. 更新前端代码

#### 2.1 修改 index.html

在 `<head>` 部分添加新的脚本：

```html
<!-- 在现有脚本后添加 -->
<script src="/cron/sync-manager.js"></script>
<script src="/cron/server-cron.js"></script>
<script src="/cron/enhanced-cron.js"></script>
```

#### 2.2 更新 worker.js

更新主 Worker 以支持新的路由：

```javascript
import indexHtml from './cron/index.html';
import styleCss from './cron/css/style.css';
import { handleRequest as handleApiRequest } from './cron/api-worker.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 处理 API 请求
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }
    
    // 处理静态资源
    if (url.pathname === '/' || url.pathname === '/cron/') {
      let html = indexHtml;
      // ... 现有的 Firebase 配置替换逻辑
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }
    
    // ... 其他现有的路由处理
  }
};
```

### 3. 部署命令

```bash
# 部署主应用
wrangler deploy --env production

# 部署 API Worker
wrangler deploy --env production api-worker

# 部署 Cron Worker
wrangler deploy --env production cron-worker
```

## 配置说明

### Cron 触发器配置

建议的 Cron 表达式：

- `*/5 * * * *` - 每5分钟检查一次（推荐）
- `*/1 * * * *` - 每分钟检查一次（高频任务）
- `0,15,30,45 * * * *` - 每15分钟检查一次（低频任务）

### 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `FIREBASE_API_KEY` | Firebase API 密钥 | 是 |
| `FIREBASE_AUTH_DOMAIN` | Firebase 认证域名 | 是 |
| `FIREBASE_PROJECT_ID` | Firebase 项目 ID | 是 |
| `FIREBASE_STORAGE_BUCKET` | Firebase 存储桶 | 是 |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase 消息发送者 ID | 是 |
| `FIREBASE_APP_ID` | Firebase 应用 ID | 是 |

### 存储配置

#### KV 存储用途

- `CRON_TASKS_KV`: 存储任务数据和用户任务列表
- `CRON_LOGS_KV`: 存储任务执行日志（短期）

#### R2 存储用途

- `CRON_LOGS_R2`: 长期日志归档（可选）

## 功能特性

### 1. 任务持久化

- ✅ 任务数据存储在 Cloudflare KV 中
- ✅ 支持用户间的数据隔离
- ✅ 自动数据备份和恢复

### 2. 跨设备同步

- ✅ 实时任务状态同步
- ✅ 冲突解决机制
- ✅ 离线支持

### 3. 服务端执行

- ✅ Cloudflare Workers Cron 触发器
- ✅ 可靠的任务执行
- ✅ 错误处理和重试

### 4. 监控和日志

- ✅ 任务执行日志
- ✅ 性能监控
- ✅ 错误通知

## 迁移指南

### 从本地存储迁移

1. **备份数据**
   ```bash
   # 导出现有任务数据
   # 通过浏览器开发者工具导出 localStorage 数据
   ```

2. **启用服务端同步**
   - 部署新的服务端组件
   - 更新前端代码
   - 系统会自动迁移现有任务

3. **验证迁移**
   - 检查任务是否正确同步
   - 验证定时任务是否正常执行
   - 测试跨设备访问

### 兼容性

- ✅ 向后兼容现有的 localStorage 数据
- ✅ 支持渐进式迁移
- ✅ 降级到本地模式（当服务端不可用时）

## 监控和维护

### 1. 监控指标

- 任务执行成功率
- 平均执行时间
- 存储使用量
- 错误率

### 2. 日志管理

```bash
# 查看任务执行日志
wrangler kv key list --prefix=logs: --env production

# 清理过期日志
# 系统会自动清理 30 天前的日志
```

### 3. 性能优化

- 调整 Cron 执行频率
- 优化 KV 查询性能
- 监控存储使用量

## 故障排除

### 常见问题

1. **任务不执行**
   - 检查 Cron Worker 是否正常运行
   - 验证任务状态是否为 active
   - 查看执行日志

2. **同步失败**
   - 检查网络连接
   - 验证用户认证状态
   - 查看 API 错误日志

3. **存储空间不足**
   - 清理过期日志
   - 优化数据结构
   - 考虑升级存储方案

### 调试工具

```bash
# 查看 Worker 日志
wrangler tail --env production

# 检查 KV 存储状态
wrangler kv key list --env production

# 测试 API 端点
curl -X GET https://tools.nssa.io/api/tasks -H "Authorization: Bearer YOUR_TOKEN"
```

## 安全考虑

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

## 成本估算

### Cloudflare Workers

- 请求: $0.50 per million requests
- 执行时间: $0.50 per million GB-seconds
- KV 存储: $0.50 per GB-month

### 估算示例

- 1000 个用户，每人 10 个任务
- 每 5 分钟检查一次
- 月成本约: $5-10

## 总结

服务端定时任务系统提供了完整的任务持久化和跨设备同步解决方案。通过 Cloudflare Workers 和 KV 存储，实现了可靠、高效的定时任务管理。

主要优势：
- 🚀 高可靠性和可用性
- 🔄 自动跨设备同步
- 💰 低成本维护
- 🔧 易于部署和扩展
- 📊 完善的监控和日志