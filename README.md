# NSSA工具集

> 集成定时任务管理和智能网络拓扑生成的一站式工具平台

## 🚀 功能特性

### 📅 定时任务管理
- **企业微信集成**: 支持企业微信Webhook定时消息发送
- **灵活调度**: 支持简单间隔和高级Cron表达式
- **任务监控**: 实时任务状态监控和执行历史
- **用户认证**: 基于Firebase Auth的安全认证

### 🌐 智能拓扑生成
- **AI智能转换**: 基于自然语言描述生成网络拓扑
- **自动生成**: 支持DrawIO格式的拓扑图输出
- **版本控制**: 完整的项目版本管理和历史记录
- **多AI支持**: 集成Gemini、DeepSeek等多种AI模型

## 🛠️ 技术栈

- **前端**: Nuxt 3 + Vue 3 + TypeScript + Tailwind CSS
- **认证**: Firebase Authentication
- **数据库**: Firebase Firestore
- **部署**: Firebase App Hosting
- **样式**: Apple风格设计语言 + 响应式布局

## 📦 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 环境配置
1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 配置Firebase项目信息：
```bash
# 在 .env 文件中填入你的Firebase配置
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain
# ... 其他配置
```

### 开发运行
```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 构建部署
```bash
# 构建生产版本
npm run build

# 部署到Firebase
firebase deploy
```

## 📁 项目结构

```
nssa-tools/
├── assets/              # 静态资源
│   └── css/            # 样式文件
├── components/         # Vue组件
├── composables/        # 组合式函数
├── layouts/           # 布局组件
├── pages/             # 页面组件
│   ├── index.vue      # 主页
│   ├── cron/          # 定时任务页面
│   └── topfac/        # 拓扑生成页面
├── plugins/           # 插件
├── server/            # 服务端API
├── firebase.json      # Firebase配置
├── nuxt.config.ts     # Nuxt配置
└── package.json       # 项目依赖
```

## 🔧 配置说明

### Firebase配置
1. 在Firebase控制台创建项目
2. 启用Authentication和Firestore
3. 获取项目配置信息
4. 配置环境变量

### API代理配置
- `/api/cron/*` → 定时任务API服务
- `/api/topfac/*` → 拓扑生成API服务

## 📖 使用指南

### 定时任务
1. 登录系统（需要管理员创建账号）
2. 创建新任务，配置Webhook URL和调度规则
3. 启动任务，系统将按计划执行

### 拓扑生成
1. 直接访问拓扑生成工具（无需登录）
2. 输入自然语言描述网络结构
3. 使用AI转换为标准格式
4. 生成并下载DrawIO格式的拓扑图

## 🚀 部署指南

### Firebase App Hosting部署
1. 安装Firebase CLI：
```bash
npm install -g firebase-tools
```

2. 登录Firebase：
```bash
firebase login
```

3. 初始化项目：
```bash
firebase init hosting
```

4. 构建并部署：
```bash
npm run build
firebase deploy
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/Matthewyin/nssa_tools/issues)
- 邮箱: 2738550@qq.com
