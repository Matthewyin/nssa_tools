# NSSA工具集部署指南

本指南将帮助您将NSSA工具集部署到Firebase App Hosting。

## 📋 部署前准备

### 1. 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- Firebase CLI
- Git（推荐）

### 2. Firebase项目设置

1. **创建Firebase项目**（如果还没有）：
   - 访问 [Firebase控制台](https://console.firebase.google.com)
   - 点击"添加项目"
   - 按照向导完成项目创建

2. **启用必要的服务**：
   - **Authentication**: 构建 → Authentication → 开始使用
   - **Firestore Database**: 构建 → Firestore Database → 创建数据库
   - **Hosting**: 构建 → Hosting → 开始使用

3. **创建Web应用**：
   - 在项目设置中点击"添加应用"
   - 选择Web应用图标
   - 输入应用昵称
   - 复制配置信息

### 3. 环境配置

1. **复制环境变量文件**：
   ```bash
   cp .env.example .env
   ```

2. **配置Firebase信息**：
   ```bash
   # 在.env文件中填入Firebase配置
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   
   # Firebase Admin SDK配置
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   ```

3. **配置Firebase项目**：
   ```bash
   # 更新.firebaserc文件
   {
     "projects": {
       "default": "your_project_id"
     }
   }
   ```

## 🚀 部署步骤

### 方法1: 使用自动化脚本（推荐）

1. **运行部署前检查**：
   ```bash
   npm run deploy:check
   ```

2. **执行部署**：
   ```bash
   npm run deploy
   ```

### 方法2: 手动部署

1. **安装Firebase CLI**：
   ```bash
   npm install -g firebase-tools
   ```

2. **登录Firebase**：
   ```bash
   firebase login
   ```

3. **设置项目**：
   ```bash
   firebase use your_project_id
   ```

4. **构建应用**：
   ```bash
   npm run build
   ```

5. **部署到Hosting**：
   ```bash
   firebase deploy --only hosting
   ```

6. **部署Functions**（如果需要）：
   ```bash
   firebase deploy --only functions
   ```

## 🔧 高级配置

### 自定义域名

1. 在Firebase控制台的Hosting部分添加自定义域名
2. 按照指示配置DNS记录
3. 等待SSL证书自动配置

### 环境变量管理

对于生产环境，建议使用Firebase的环境变量功能：

```bash
# 设置环境变量
firebase functions:config:set app.url="https://your-domain.com"

# 查看环境变量
firebase functions:config:get
```

### 自动部署（CI/CD）

可以配置GitHub Actions或其他CI/CD工具自动部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your_project_id
```

## 📊 部署后验证

### 1. 功能测试

访问部署后的应用并测试：

- [ ] 主页加载正常
- [ ] 用户登录功能
- [ ] 定时任务创建和管理
- [ ] 拓扑生成功能
- [ ] API端点响应正常

### 2. 性能监控

1. **Firebase Performance Monitoring**：
   - 在Firebase控制台启用Performance Monitoring
   - 监控页面加载时间和API响应时间

2. **Firebase Analytics**：
   - 启用Google Analytics集成
   - 跟踪用户行为和应用使用情况

### 3. 错误监控

1. **Firebase Crashlytics**：
   - 监控应用崩溃和错误
   - 设置错误报告和通知

## 🔍 故障排除

### 常见问题

1. **构建失败**：
   - 检查Node.js版本是否符合要求
   - 确保所有依赖都已正确安装
   - 检查TypeScript类型错误

2. **部署失败**：
   - 确认Firebase CLI已登录
   - 检查项目权限
   - 验证firebase.json配置

3. **运行时错误**：
   - 检查环境变量配置
   - 查看Firebase Functions日志
   - 验证API端点配置

### 日志查看

```bash
# 查看Hosting日志
firebase hosting:channel:list

# 查看Functions日志
firebase functions:log

# 实时日志
firebase functions:log --follow
```

## 📈 性能优化

### 1. 缓存策略

- 静态资源：1年缓存
- API响应：5分钟缓存
- HTML页面：无缓存

### 2. 代码分割

应用已配置自动代码分割：
- 路由级别分割
- 组件懒加载
- 第三方库分离

### 3. 图片优化

- 使用WebP格式
- 响应式图片
- 懒加载

## 🔒 安全配置

### 1. Firestore安全规则

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 任务集合 - 只有认证用户可以访问自己的任务
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 2. Firebase Auth配置

- 启用邮箱/密码登录
- 配置密码强度要求
- 设置会话超时

## 📞 支持

如果在部署过程中遇到问题：

1. 查看本文档的故障排除部分
2. 检查Firebase控制台的错误日志
3. 参考Firebase官方文档
4. 提交GitHub Issue

---

**部署成功后，您的NSSA工具集将在以下地址可用：**
- 主域名: `https://your-project-id.web.app`
- 自定义域名: `https://your-custom-domain.com`（如果配置）
