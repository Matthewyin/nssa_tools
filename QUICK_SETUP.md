# 🚀 NSSA工具集 - 快速部署指南

代码已成功推送到GitHub！现在只需几个步骤即可完成自动部署设置。

## 📋 当前状态

✅ **已完成**:
- 代码已推送到 https://github.com/Matthewyin/nssa_tools
- GitHub Actions工作流已配置
- Firebase配置文件已就绪
- 部署脚本已准备

## 🔧 下一步操作

### 1. 配置GitHub Secrets

访问 https://github.com/Matthewyin/nssa_tools/settings/secrets/actions

添加以下Secrets：

#### Firebase配置
```
FIREBASE_API_KEY = AIzaSyAQVuM1XSbFw_x3IQ0ZV98XwCWGbgFhIGM
FIREBASE_AUTH_DOMAIN = n8n-project-460516.firebaseapp.com
FIREBASE_PROJECT_ID = n8n-project-460516
FIREBASE_STORAGE_BUCKET = n8n-project-460516.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID = 18068529376
FIREBASE_APP_ID = 1:18068529376:web:42ce80ad28f316b97a3085
```

#### Firebase Admin SDK
```
FIREBASE_ADMIN_PROJECT_ID = n8n-project-460516
FIREBASE_ADMIN_CLIENT_EMAIL = firebase-adminsdk-xxx@n8n-project-460516.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\n您的私钥内容\n-----END PRIVATE KEY-----\n"
```

#### Firebase Service Account
```
FIREBASE_SERVICE_ACCOUNT_N8N_PROJECT_460516 = {完整的服务账号JSON内容}
```

### 2. 获取Firebase Service Account

1. 访问 [Firebase控制台](https://console.firebase.google.com/project/n8n-project-460516/settings/serviceaccounts/adminsdk)
2. 点击"生成新的私钥"
3. 下载JSON文件
4. 将整个JSON内容复制到GitHub Secret `FIREBASE_SERVICE_ACCOUNT_N8N_PROJECT_460516`

### 3. 配置Firebase App Hosting

1. 访问 [Firebase控制台](https://console.firebase.google.com/project/n8n-project-460516)
2. 点击左侧菜单"Hosting"
3. 点击"开始使用"
4. 选择"使用GitHub连接"
5. 授权GitHub访问
6. 选择仓库：`Matthewyin/nssa_tools`
7. 配置构建设置：
   - **分支**: main
   - **根目录**: /
   - **构建命令**: npm ci && npm run build
   - **输出目录**: .output/public

### 4. 触发首次部署

配置完成后，有两种方式触发部署：

#### 方式1: 推送代码（推荐）
```bash
# 对代码做任何小修改，然后推送
git add .
git commit -m "trigger deployment"
git push
```

#### 方式2: 手动触发
1. 访问 https://github.com/Matthewyin/nssa_tools/actions
2. 选择"Deploy to Firebase App Hosting"工作流
3. 点击"Run workflow"

## 🎯 部署后验证

部署成功后，应用将在以下地址可用：
- **主应用**: https://nssa-tools-xxx.web.app
- **健康检查**: https://nssa-tools-xxx.web.app/api/admin/health
- **定时任务**: https://nssa-tools-xxx.web.app/cron
- **拓扑生成**: https://nssa-tools-xxx.web.app/topfac

## 🔍 故障排除

### 如果部署失败：

1. **检查GitHub Actions日志**:
   - 访问 https://github.com/Matthewyin/nssa_tools/actions
   - 点击失败的工作流查看详细错误

2. **常见问题**:
   - Secret名称拼写错误
   - Firebase Service Account权限不足
   - 构建过程中的依赖问题

3. **获取帮助**:
   - 查看 `GITHUB_DEPLOYMENT.md` 详细指南
   - 检查Firebase控制台的错误日志

## 📊 监控和管理

部署成功后，您可以：
- 在Firebase控制台监控应用性能
- 在GitHub Actions查看部署历史
- 使用应用内的系统测试工具验证功能

---

## 🎉 完成！

一旦配置完成，您的NSSA工具集将：
- ✅ 自动部署到Firebase App Hosting
- ✅ 每次推送代码时自动更新
- ✅ 提供完整的定时任务和拓扑生成功能
- ✅ 支持用户认证和数据持久化

**预计完成时间**: 10-15分钟

**需要帮助？** 查看 `GITHUB_DEPLOYMENT.md` 获取详细说明。
