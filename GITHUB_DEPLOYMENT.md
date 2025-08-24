# GitHub自动部署到Firebase App Hosting指南

本指南将帮助您设置GitHub Actions自动部署到Firebase App Hosting。

## 🚀 快速开始

### 1. 创建GitHub仓库

```bash
# 初始化Git仓库（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/Matthewyin/nssa_tools.git

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: NSSA工具集现代化重构完成"

# 推送到GitHub
git push -u origin main
```

### 2. 配置GitHub Secrets

在GitHub仓库设置中添加以下Secrets：

#### Firebase配置 Secrets
- `FIREBASE_API_KEY`: AIzaSyAQVuM1XSbFw_x3IQ0ZV98XwCWGbgFhIGM
- `FIREBASE_AUTH_DOMAIN`: n8n-project-460516.firebaseapp.com
- `FIREBASE_PROJECT_ID`: n8n-project-460516
- `FIREBASE_STORAGE_BUCKET`: n8n-project-460516.firebasestorage.app
- `FIREBASE_MESSAGING_SENDER_ID`: 18068529376
- `FIREBASE_APP_ID`: 1:18068529376:web:42ce80ad28f316b97a3085

#### Firebase Admin SDK Secrets
- `FIREBASE_ADMIN_PRIVATE_KEY`: 您的Firebase Admin私钥
- `FIREBASE_ADMIN_CLIENT_EMAIL`: firebase-adminsdk-xxx@n8n-project-460516.iam.gserviceaccount.com
- `FIREBASE_ADMIN_PROJECT_ID`: n8n-project-460516

#### Firebase Service Account
- `FIREBASE_SERVICE_ACCOUNT_N8N_PROJECT_460516`: Firebase服务账号JSON（完整内容）

### 3. 获取Firebase Service Account

1. 访问 [Firebase控制台](https://console.firebase.google.com/project/n8n-project-460516)
2. 点击项目设置 → 服务账号
3. 点击"生成新的私钥"
4. 下载JSON文件
5. 将整个JSON内容复制到GitHub Secret `FIREBASE_SERVICE_ACCOUNT_N8N_PROJECT_460516`

### 4. 配置Firebase App Hosting

1. 在Firebase控制台启用App Hosting
2. 连接GitHub仓库
3. 选择分支：main
4. 配置构建设置：
   - 构建命令：`npm ci && npm run build`
   - 输出目录：`.output/public`

## 📋 部署流程

### 自动部署
每次推送到main分支时，GitHub Actions会自动：
1. 检出代码
2. 设置Node.js环境
3. 安装依赖
4. 创建环境变量文件
5. 运行类型检查
6. 构建应用
7. 部署到Firebase App Hosting

### 手动部署
您也可以在GitHub Actions页面手动触发部署。

## 🔧 配置文件说明

### `.github/workflows/deploy.yml`
GitHub Actions工作流配置文件，定义了自动部署流程。

### `firebase.json`
Firebase项目配置文件，配置了App Hosting设置。

### `.gitignore`
Git忽略文件，确保敏感信息不会被提交到仓库。

## 🔒 安全注意事项

1. **永远不要**将Firebase私钥或敏感配置提交到Git仓库
2. 使用GitHub Secrets存储所有敏感信息
3. 定期轮换Firebase服务账号密钥
4. 确保仓库权限设置正确

## 📊 监控和日志

### GitHub Actions日志
- 在GitHub仓库的Actions标签页查看部署日志
- 每次部署的详细步骤和错误信息

### Firebase控制台
- 在Firebase控制台的App Hosting部分查看部署状态
- 监控应用性能和错误

## 🔍 故障排除

### 常见问题

1. **部署失败 - 权限错误**
   - 检查Firebase Service Account权限
   - 确保GitHub Secrets配置正确

2. **构建失败**
   - 检查Node.js版本兼容性
   - 查看GitHub Actions日志中的错误信息

3. **环境变量问题**
   - 确保所有必需的Secrets都已配置
   - 检查Secret名称是否正确

### 调试步骤

1. 查看GitHub Actions日志
2. 检查Firebase控制台的部署日志
3. 验证所有环境变量和Secrets
4. 确认Firebase项目配置

## 🎯 部署后验证

部署成功后，访问以下URL验证功能：

- 主应用：https://nssa-tools-xxx.web.app
- 健康检查：https://nssa-tools-xxx.web.app/api/admin/health
- 定时任务：https://nssa-tools-xxx.web.app/cron
- 拓扑生成：https://nssa-tools-xxx.web.app/topfac

## 📈 性能优化

部署后的应用已包含以下优化：
- 自动代码分割
- 静态资源缓存
- 服务端渲染
- 响应式图片
- PWA支持

---

**🎉 恭喜！您的NSSA工具集现在已配置为自动部署到Firebase App Hosting！**

每次推送代码到main分支，应用都会自动构建和部署。
