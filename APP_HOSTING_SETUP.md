# Firebase App Hosting 设置指南

## 🎯 重要说明

Firebase App Hosting是一个相对较新的服务，可能需要在Firebase Console中手动配置。

## 📋 手动设置步骤

### 1. 在Firebase Console中创建App Hosting应用

1. **访问Firebase Console**
   - 打开：https://console.firebase.google.com/project/n8n-project-460516/apphosting

2. **创建新的App Hosting应用**
   - 点击"Get started"或"Create app"
   - 应用名称：`nssa-tools`
   - 连接GitHub仓库：`https://github.com/Matthewyin/nssa_tools`
   - 分支：`main`
   - 根目录：`.`（当前目录）

3. **配置构建设置**
   - 构建命令：`npm ci && npm run build`
   - 输出目录：`.output`
   - Node.js版本：`18`

4. **配置环境变量**
   在App Hosting设置中添加以下环境变量：
   ```
   NODE_ENV=production
   NITRO_PRESET=firebase
   FIREBASE_API_KEY=AIzaSyAQVuM1XSbFw_x3IQ0ZV98XwCWGbgFhIGM
   FIREBASE_AUTH_DOMAIN=n8n-project-460516.firebaseapp.com
   FIREBASE_PROJECT_ID=n8n-project-460516
   FIREBASE_STORAGE_BUCKET=n8n-project-460516.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=18068529376
   FIREBASE_APP_ID=1:18068529376:web:42ce80ad28f316b97a3085
   ```

### 2. 自动部署设置

1. **连接GitHub**
   - 在App Hosting设置中连接GitHub仓库
   - 设置自动部署触发器（推送到main分支时自动部署）

2. **部署触发**
   - 每次推送到main分支时自动触发部署
   - 也可以手动触发部署

## 🚀 手动部署方法

### 方法1: 使用部署脚本
```bash
# 运行手动部署脚本
./scripts/deploy-app-hosting.sh
```

### 方法2: 使用Firebase CLI
```bash
# 安装最新版Firebase CLI
npm install -g firebase-tools@latest

# 登录Firebase
firebase login

# 设置项目
firebase use n8n-project-460516

# 构建项目
npm run build

# 部署Functions和Firestore
firebase deploy --only functions,firestore

# 如果App Hosting CLI支持可用
firebase deploy --only apphosting
```

### 方法3: GitHub Actions自动部署
推送代码到main分支会自动触发GitHub Actions部署。

## 🔍 故障排除

### 1. App Hosting命令不可用
如果Firebase CLI不支持App Hosting命令：
- 更新到最新版本：`npm install -g firebase-tools@latest`
- 在Firebase Console中手动配置

### 2. 部署失败
- 检查GitHub Secrets是否正确配置
- 确保Firebase项目中已启用App Hosting服务
- 查看Firebase Console中的部署日志

### 3. 环境变量问题
- 确保在App Hosting设置中配置了所有必要的环境变量
- 检查变量名称和值是否正确

## 📊 监控和管理

### 查看部署状态
- Firebase Console: https://console.firebase.google.com/project/n8n-project-460516/apphosting
- GitHub Actions: https://github.com/Matthewyin/nssa_tools/actions

### 访问应用
部署成功后，应用将在以下地址可用：
- `https://nssa-tools--n8n-project-460516.web.app`
- 或Firebase Console中显示的自定义URL

### 查看日志
- 在Firebase Console的App Hosting部分查看构建和运行时日志
- 监控应用性能和错误

## 💡 提示

1. **首次设置**：App Hosting可能需要在Firebase Console中手动初始化
2. **自动部署**：设置后，推送到main分支会自动触发部署
3. **环境变量**：确保在App Hosting设置中配置所有必要的环境变量
4. **监控**：定期检查部署状态和应用性能

如果遇到问题，请查看Firebase Console中的详细错误信息和部署日志。
