# Webhook定时任务工具

这是一个基于Cloudflare Workers的定时任务工具，用于定时触发Webhook请求。该工具使用Firebase Authentication进行用户认证，确保每个用户只能看到和管理自己的任务。

## 功能特点

- 用户认证系统，保护任务数据安全（仅管理员可创建用户）
- 支持简单间隔和高级定时（类Cron）两种定时方式
- 支持多种HTTP请求方法（GET、POST、PUT、DELETE）
- 明暗主题切换，支持系统主题跟随
- 任务导入/导出功能
- 实时显示下次执行时间

## 部署指南

### 1. 创建Firebase项目

1. 访问 [Firebase控制台](https://console.firebase.google.com/)
2. 点击“添加项目”并完成项目创建
3. 在左侧菜单中选择“Authentication”
4. 点击“开始使用”，然后启用“电子邮件/密码”登录方式
5. 在项目设置中找到Web API密钥
6. 确保禁用“允许用户注册”选项，以便只有管理员可以创建用户

### 2. 更新配置

1. 在`index.html`文件中找到Firebase配置部分：

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDNWjNYOVpQGkVdXXXXXXXXXXXXXXXXXXX", // 需要替换为实际的API密钥
    authDomain: "nssa-cron.firebaseapp.com", // 需要替换为实际的域名
    projectId: "nssa-cron", // 需要替换为实际的项目ID
    storageBucket: "nssa-cron.appspot.com",
    messagingSenderId: "XXXXXXXXXXXX",
    appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXX"
};
```

2. 在`worker.js`文件中找到Firebase Auth配置部分：

```javascript
const firebaseAuthConfig = {
  apiKey: "AIzaSyDNWjNYOVpQGkVdXXXXXXXXXXXXXXXXXXX", // 需要替换为实际的API密钥
  projectId: "nssa-cron", // 需要替换为实际的项目ID
};
```

将上述配置中的占位符替换为您在Firebase控制台中获取的实际值。

### 3. 使用Wrangler部署

1. 确保已安装Wrangler CLI：
```bash
npm install -g wrangler
```

2. 登录到您的Cloudflare账户：
```bash
wrangler login
```

3. 部署Worker：
```bash
npx wrangler deploy
```

## 使用说明

1. 访问部署后的Worker URL
2. 使用管理员提供的账户登录（系统不提供自助注册功能）
3. 点击“创建任务”按钮添加新的定时任务
4. 设置任务名称、Webhook URL、请求方法和定时规则
5. 任务创建后会自动开始执行

## 管理员指南

管理员需要在Firebase控制台中手动创建用户账号。详细步骤请参考 [ADMIN_GUIDE.md](ADMIN_GUIDE.md)。

## 安全说明

- 所有用户数据存储在浏览器的localStorage中，与用户ID关联
- Firebase Authentication确保只有授权用户可以访问应用
- 每个用户只能看到和管理自己创建的任务
- 采用管理员创建用户模式，防止未授权用户自行注册

## 技术栈

- Cloudflare Workers：提供serverless运行环境
- Firebase Authentication：提供用户认证服务
- HTML/CSS/JavaScript：前端界面
- localStorage：本地数据存储
- Day.js：日期时间处理库

## 注意事项

- 由于使用localStorage存储数据，清除浏览器数据会导致任务丢失
- 建议定期导出任务数据进行备份
- 浏览器localStorage存储限制为5MB，请注意任务数量
