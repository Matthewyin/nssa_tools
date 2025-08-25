# Firebase App Hosting 部署指南

## 🎯 项目信息

- **项目名称**: nssa-tools
- **项目ID**: nssa-tools  
- **App ID**: 1:18068529376:web:42ce80ad28f316b97a3085
- **部署目标**: Firebase App Hosting

## 📋 部署前准备

### 1. Firebase Console 配置

访问 [Firebase Console](https://console.firebase.google.com/) 并完成以下配置：

#### 创建/选择项目
- 项目ID: `nssa-tools`
- 项目名称: `NSSA Tools`

#### 启用必要服务
```bash
# 需要启用的Firebase服务：
✅ Authentication (Email/Password)
✅ Firestore Database  
✅ Cloud Functions
✅ App Hosting
```

#### 获取配置信息
在项目设置 → 常规 → 您的应用中找到以下配置：

```javascript
// Firebase 配置信息
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "nssa-tools.firebaseapp.com", 
  projectId: "nssa-tools",
  storageBucket: "nssa-tools.appspot.com",
  messagingSenderId: "18068529376",
  appId: "1:18068529376:web:42ce80ad28f316b97a3085"
};
```

### 2. GitHub Secrets 配置

在GitHub仓库的 Settings → Secrets and variables → Actions 中添加以下密钥：

#### Firebase 客户端配置
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=nssa-tools.firebaseapp.com
FIREBASE_PROJECT_ID=nssa-tools
FIREBASE_STORAGE_BUCKET=nssa-tools.appspot.com
FIREBASE_MESSAGING_SENDER_ID=18068529376
FIREBASE_APP_ID=1:18068529376:web:42ce80ad28f316b97a3085
```

#### Firebase Admin 配置
```
FIREBASE_ADMIN_PRIVATE_KEY=your-admin-private-key
FIREBASE_ADMIN_CLIENT_EMAIL=your-admin-client-email
FIREBASE_ADMIN_PROJECT_ID=nssa-tools
```

#### Firebase 服务账号
1. 访问 [Firebase Console → 项目设置 → 服务账号](https://console.firebase.google.com/project/nssa-tools/settings/serviceaccounts/adminsdk)
2. 点击"生成新的私钥"下载JSON文件
3. 将整个JSON内容添加为GitHub Secret：
   ```
   FIREBASE_SERVICE_ACCOUNT_NSSA_TOOLS={"type":"service_account",...}
   ```

## 🚀 部署步骤

### 方法1: 自动部署 (推荐)

1. **推送代码到main分支**
   ```bash
   git add .
   git commit -m "feat: 配置Firebase App Hosting部署"
   git push origin main
   ```

2. **查看部署状态**
   - GitHub Actions: https://github.com/Matthewyin/nssa_tools/actions
   - Firebase Console: https://console.firebase.google.com/project/nssa-tools/hosting

### 方法2: 手动部署

1. **安装Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **初始化项目**
   ```bash
   firebase use nssa-tools
   ```

3. **部署Functions**
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

4. **部署Firestore规则**
   ```bash
   firebase deploy --only firestore
   ```

5. **构建并部署App Hosting**
   ```bash
   npm run build
   firebase deploy --only hosting:nssa-tools
   ```

## 🔧 配置验证

### 运行部署前检查
```bash
node scripts/deploy-check.js
```

### 验证配置文件
- ✅ `.firebaserc` - 项目ID配置
- ✅ `firebase.json` - Firebase服务配置  
- ✅ `firestore.rules` - 数据库安全规则
- ✅ `firestore.indexes.json` - 数据库索引
- ✅ `apphosting.yaml` - App Hosting配置

## 📊 部署后验证

### 1. 访问应用
- 生产环境: https://nssa-tools.web.app
- 或者: https://nssa-tools.firebaseapp.com

### 2. 功能测试
- [ ] 用户认证登录/登出
- [ ] Cron任务管理
- [ ] Topfac项目管理
- [ ] API接口调用

### 3. 监控检查
- Firebase Console → Functions → 日志
- Firebase Console → App Hosting → 指标
- GitHub Actions → 部署日志

## 🛠️ 故障排除

### 常见问题

#### 1. 部署失败 - 认证错误
```
Error: HTTP Error: 403, The caller does not have permission
```
**解决方案**: 检查Firebase服务账号JSON是否正确配置

#### 2. Functions部署失败
```
Error: Failed to create function
```
**解决方案**: 
- 检查Node.js版本是否为18
- 确保functions/package.json依赖正确

#### 3. 环境变量未生效
```
Error: Firebase config is not defined
```
**解决方案**: 检查GitHub Secrets配置是否完整

#### 4. Firestore权限错误
```
Error: Missing or insufficient permissions
```
**解决方案**: 检查firestore.rules安全规则配置

### 调试命令

```bash
# 查看Firebase项目状态
firebase projects:list

# 查看Functions日志
firebase functions:log

# 本地测试Functions
firebase emulators:start

# 检查部署状态
firebase hosting:sites:list
```

## 📈 性能优化

### 1. 构建优化
- 启用代码分割
- 压缩静态资源
- 优化图片加载

### 2. Functions优化
- 设置合适的内存限制
- 优化冷启动时间
- 使用连接池

### 3. Firestore优化
- 创建复合索引
- 优化查询结构
- 使用缓存策略

## 🔄 更新部署

### 代码更新
```bash
git add .
git commit -m "feat: 新功能"
git push origin main
# GitHub Actions自动部署
```

### Functions更新
```bash
firebase deploy --only functions
```

### 数据库规则更新
```bash
firebase deploy --only firestore:rules
```

## 📞 支持

如果遇到部署问题，请检查：
1. [Firebase文档](https://firebase.google.com/docs/app-hosting)
2. [GitHub Actions日志](https://github.com/Matthewyin/nssa_tools/actions)
3. [Firebase Console](https://console.firebase.google.com/project/nssa-tools)

---

🎉 **部署完成后，你的NSSA工具集将在Firebase App Hosting上运行！**
