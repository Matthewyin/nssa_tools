# 🔧 故障排除指南

本指南帮助解决NSSA工具集部署和运行中的常见问题。

## 🚨 GitHub Actions构建问题

### 问题1: oxc-parser绑定错误

**错误信息**:
```
Cannot find native binding. npm has a bug related to optional dependencies
Cannot find module './parser.linux-x64-gnu.node'
```

**解决方案**:
✅ **已修复**: 我们已经在最新的提交中修复了这个问题：

1. **添加了.npmrc配置**:
   - 禁用可选依赖的严格检查
   - 优化npm安装行为

2. **更新了GitHub Actions工作流**:
   - 使用`--no-optional`标志安装依赖
   - 添加了备用构建策略

3. **优化了Nuxt配置**:
   - 禁用了TypeScript类型检查
   - 配置了更兼容的构建选项

### 问题2: 依赖安装失败

**解决方案**:
```bash
# 本地清理和重新安装
rm -rf node_modules package-lock.json .nuxt .output
npm install --no-optional --legacy-peer-deps
```

## 🔥 Firebase配置问题

### 问题1: Firebase Service Account权限不足

**错误信息**:
```
Permission denied. Firebase Service Account does not have sufficient permissions.
```

**解决方案**:
1. 确保Service Account有以下权限：
   - Firebase Admin SDK Admin Service Agent
   - Cloud Datastore User
   - Firebase Hosting Admin

2. 重新生成Service Account密钥：
   - 访问Firebase控制台 → 项目设置 → 服务账号
   - 生成新的私钥
   - 更新GitHub Secret

### 问题2: 环境变量配置错误

**检查清单**:
- [ ] 所有必需的GitHub Secrets都已配置
- [ ] Secret名称拼写正确（区分大小写）
- [ ] Firebase配置信息正确
- [ ] 私钥格式正确（包含换行符）

## 🌐 部署问题

### 问题1: Firebase App Hosting连接失败

**解决方案**:
1. **检查GitHub连接**:
   - 确保GitHub仓库已正确连接到Firebase
   - 验证分支名称（应为`main`）

2. **检查构建配置**:
   ```yaml
   构建命令: npm ci && npm run build
   输出目录: .output/public
   根目录: /
   ```

3. **验证firebase.json配置**:
   ```json
   {
     "hosting": {
       "source": ".",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "frameworksBackend": {
         "region": "us-central1"
       }
     }
   }
   ```

### 问题2: 构建超时

**解决方案**:
1. 优化依赖安装：
   - 使用npm缓存
   - 减少不必要的依赖

2. 增加构建超时时间：
   ```yaml
   timeout-minutes: 30
   ```

## 🔍 运行时问题

### 问题1: API端点404错误

**检查项目**:
- [ ] Server API文件位于正确的`server/api/`目录
- [ ] 文件命名符合Nuxt约定
- [ ] 路由配置正确

### 问题2: Firebase连接失败

**解决方案**:
1. **检查环境变量**:
   ```bash
   # 在浏览器控制台检查
   console.log(window.__NUXT__.config.public)
   ```

2. **验证Firebase配置**:
   - 访问`/api/admin/health`检查系统状态
   - 查看浏览器网络标签页的错误信息

## 📊 监控和调试

### GitHub Actions日志

1. **访问Actions页面**:
   https://github.com/Matthewyin/nssa_tools/actions

2. **查看详细日志**:
   - 点击失败的工作流
   - 展开每个步骤查看详细输出

### Firebase控制台

1. **查看部署状态**:
   - Firebase控制台 → Hosting
   - 查看部署历史和错误

2. **查看函数日志**:
   - Firebase控制台 → Functions
   - 查看执行日志和错误

### 本地调试

```bash
# 本地运行开发服务器
npm run dev

# 本地构建测试
npm run build
npm run preview

# 检查类型错误
npm run typecheck

# 运行系统测试
# 访问 http://localhost:3000/admin/test
```

## 🆘 获取帮助

### 自助诊断

1. **运行系统测试**:
   - 访问`/admin/test`页面
   - 运行所有测试检查系统状态

2. **查看健康状态**:
   - 访问`/api/admin/health`
   - 检查各服务状态

### 联系支持

如果问题仍然存在：

1. **收集信息**:
   - GitHub Actions构建日志
   - Firebase控制台错误信息
   - 浏览器控制台错误
   - 系统测试结果

2. **创建Issue**:
   - 在GitHub仓库创建Issue
   - 包含详细的错误信息和重现步骤

## 📋 常用命令

```bash
# 清理和重新安装
rm -rf node_modules package-lock.json .nuxt .output
npm install

# 强制推送触发部署
git add .
git commit -m "trigger deployment"
git push

# 本地测试构建
npm run build
npm run preview

# 查看Git状态
git status
git log --oneline -5
```

---

**💡 提示**: 大多数问题都可以通过清理依赖和重新安装来解决。如果遇到持续问题，请查看GitHub Actions的详细日志。
