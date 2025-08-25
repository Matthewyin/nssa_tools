# Firebase部署指南

## 概述

本项目已重构为基于Firebase的全栈应用，使用Firebase App Hosting部署动态页面，Firebase Functions作为后端API，Firestore作为数据库。

## 架构设计

```
用户 → Firebase App Hosting → Nuxt 3 SSR → Firebase Functions → Firestore
                                    ↓
                              Firebase Auth
```

## 部署步骤

### 1. 环境准备

确保已安装以下工具：
- Node.js 18+
- Firebase CLI
- Git

```bash
# 安装Firebase CLI
npm install -g firebase-tools

# 登录Firebase
firebase login
```

### 2. 项目配置

1. 在Firebase Console创建新项目
2. 启用以下服务：
   - Authentication (Email/Password)
   - Firestore Database
   - Functions
   - App Hosting

3. 配置环境变量：
```bash
# 在Firebase Console获取配置信息
# 在App Hosting中设置以下密钥：
- firebase-admin-private-key
- firebase-admin-client-email
- firebase-admin-project-id
- firebase-api-key
- firebase-auth-domain
- firebase-project-id
- firebase-storage-bucket
- firebase-messaging-sender-id
- firebase-app-id
```

### 3. 初始化Firebase项目

```bash
# 初始化Firebase项目
firebase init

# 选择以下服务：
# - Functions
# - Firestore
# - App Hosting
```

### 4. 部署Functions

```bash
# 安装Functions依赖
cd functions
npm install

# 部署Functions
firebase deploy --only functions
```

### 5. 设置Firestore规则和索引

```bash
# 部署Firestore规则和索引
firebase deploy --only firestore
```

### 6. 部署到App Hosting

```bash
# 构建项目
npm run build

# 部署到App Hosting
firebase deploy --only hosting
```

## 本地开发

### 启动开发服务器

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 启动Firebase模拟器

```bash
# 启动模拟器
firebase emulators:start

# 包含的服务：
# - Auth模拟器: http://localhost:9099
# - Firestore模拟器: http://localhost:8080
# - Functions模拟器: http://localhost:5001
```

## 项目结构

```
nssa_tools/
├── pages/                  # Nuxt页面
│   ├── cron/              # 定时任务页面
│   └── topfac/            # 拓扑生成页面
├── server/api/            # Nuxt API代理层
│   ├── cron/              # Cron API代理
│   └── topfac/            # Topfac API代理
├── functions/             # Firebase Functions
│   ├── src/
│   │   ├── cron/          # Cron业务逻辑
│   │   ├── topfac/        # Topfac业务逻辑
│   │   └── auth/          # 认证逻辑
│   └── package.json
├── stores/                # Pinia状态管理
│   ├── auth.js           # 认证状态
│   ├── cron.js           # Cron状态
│   └── topfac.js         # Topfac状态
├── firestore.rules       # Firestore安全规则
├── firestore.indexes.json # Firestore索引
├── firebase.json         # Firebase配置
└── apphosting.yaml       # App Hosting配置
```

## API架构

### 三层架构
1. **前端页面** → 调用Nuxt API路由
2. **Nuxt API路由** → 代理到Firebase Functions
3. **Firebase Functions** → 处理业务逻辑，操作Firestore

### 主要API端点

#### Cron API
- `GET /api/cron/tasks` - 获取任务列表
- `POST /api/cron/tasks` - 创建任务
- `PUT /api/cron/tasks/:id` - 更新任务
- `DELETE /api/cron/tasks/:id` - 删除任务
- `POST /api/cron/tasks/:id/trigger` - 手动触发任务

#### Topfac API
- `GET /api/topfac/projects` - 获取项目列表
- `POST /api/topfac/projects` - 创建项目
- `POST /api/topfac/ai/convert` - AI转换

## 数据库设计

### Firestore Collections

```javascript
/users/{userId}
  - email: string
  - name: string
  - createdAt: timestamp

/cronTasks/{taskId}
  - userId: string
  - name: string
  - cronExpression: string
  - url: string
  - method: string
  - status: string
  - createdAt: timestamp

/topfacProjects/{projectId}
  - userId: string
  - projectName: string
  - description: string
  - status: string
  - createdAt: timestamp
```

## 监控和维护

### 查看日志
```bash
# 查看Functions日志
firebase functions:log

# 查看App Hosting日志
firebase hosting:logs
```

### 性能监控
- Firebase Console提供详细的性能数据
- 可以监控Functions执行时间、错误率等指标

## 故障排除

### 常见问题

1. **Functions部署失败**
   - 检查Node.js版本是否为18
   - 确保所有依赖已正确安装

2. **认证失败**
   - 检查Firebase配置是否正确
   - 确保Auth服务已启用

3. **Firestore权限错误**
   - 检查安全规则是否正确配置
   - 确保用户已正确认证

## 下一步计划

1. 完善Firebase Functions的实现
2. 添加更多的错误处理和日志记录
3. 实现真实的AI集成
4. 添加单元测试和集成测试
5. 优化性能和用户体验
