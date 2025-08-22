# 快速部署指南

## 🚀 自动部署

运行自动部署脚本：

```bash
./deploy.sh
```

## ⚙️ 手动部署步骤

### 1. 创建 KV 存储命名空间

```bash
# 创建任务存储
wrangler kv namespace create CRON_TASKS_KV
wrangler kv namespace create CRON_TASKS_KV --preview

# 创建日志存储
wrangler kv namespace create CRON_LOGS_KV
wrangler kv namespace create CRON_LOGS_KV --preview
```

### 2. 创建 R2 存储桶（可选）

```bash
wrangler r2 bucket create nssa-tools-cron-logs
```

### 3. 更新配置文件

编辑 `wrangler.toml`，替换占位符：

```toml
[[kv_namespaces]]
binding = "CRON_TASKS_KV"
id = "YOUR_ACTUAL_KV_ID"  # 替换为实际ID

[[kv_namespaces]]
binding = "CRON_LOGS_KV"
id = "YOUR_ACTUAL_LOGS_KV_ID"  # 替换为实际ID
```

### 4. 部署应用

```bash
wrangler deploy
```

## 📋 部署后验证

### 1. 检查部署状态

```bash
wrangler tail
```

### 2. 测试功能

- 访问 https://tools.nssa.io/cron/
- 登录并创建测试任务
- 验证任务执行和同步功能

### 3. 监控命令

```bash
# 查看实时日志
wrangler tail

# 检查 KV 存储
wrangler kv key list --prefix=task:

# 查看 Cron 触发器状态
wrangler cron list
```

## 🔧 环境变量

确保以下环境变量已正确配置：

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

## 📊 功能特性

✅ **服务端持久化** - 任务数据存储在 Cloudflare KV
✅ **跨设备同步** - 实时任务状态同步
✅ **可靠执行** - Cloudflare Workers Cron 保证
✅ **完整监控** - 执行日志和性能监控
✅ **错误处理** - 自动重试和错误恢复

## 🚨 故障排除

### 常见问题

1. **KV 存储未配置**
   - 确保已创建正确的 KV 命名空间
   - 检查 wrangler.toml 中的 ID 是否正确

2. **任务不执行**
   - 检查 Cron 触发器是否正确配置
   - 查看执行日志排查问题

3. **同步失败**
   - 验证 Firebase 认证配置
   - 检查网络连接状态

## 💡 开发提示

部署到开发环境：

```bash
wrangler deploy --env development
```

查看详细日志：

```bash
wrangler tail --format=pretty
```

---

🎉 **恭喜！服务端定时任务系统部署完成！**