# NSSA Tools（多工具台）

这是一个基于 Cloudflare Workers 的多工具站，支持灵活的权限控制。目前包含：

- Webhook 定时任务（路径：`/cron`）- **需要登录**
- 五子棋游戏（路径：`/Gomoku`）- **支持游客模式**
- 哈吉喵游戏（路径：`/mlg`）- **支持游客模式**

## 权限控制策略

- **游戏功能**：五子棋和哈吉喵游戏支持游客模式，无需登录即可游玩，登录后可保存个人数据
- **管理功能**：Webhook定时任务需要登录才能使用，确保数据安全

根 Worker 负责：
- 统一注入浏览器端 Firebase 配置（`/firebase-config.js`）
- 登录拦截与 Cookie 会话（`/auth/session`、`/auth/logout`）
- 静态资源发布（`ASSETS`）与敏感文件屏蔽

## Webhook 定时任务功能特点

- 用户认证系统，保护任务数据安全（仅管理员可创建用户）
- 支持简单间隔和高级定时（类Cron）两种定时方式
- 支持多种HTTP请求方法（GET、POST、PUT、DELETE）
- 明暗主题切换，支持系统主题跟随
- 任务导入/导出功能
- 实时显示下次执行时间

## 部署指南（根 Worker）

### 1. 创建Firebase项目

1. 访问 [Firebase控制台](https://console.firebase.google.com/)
2. 点击“添加项目”并完成项目创建
3. 在左侧菜单中选择“Authentication”
4. 点击“开始使用”，然后启用“电子邮件/密码”登录方式
5. 在项目设置中找到Web API密钥
6. 确保禁用“允许用户注册”选项，以便只有管理员可以创建用户

### 2. 更新配置

配置集中在根目录 `wrangler.toml` 的 `[vars]`：

```toml
[vars]
FIREBASE_API_KEY = "<your_api_key>"
FIREBASE_AUTH_DOMAIN = "<your_auth_domain>"
FIREBASE_PROJECT_ID = "<your_project_id>"
FIREBASE_STORAGE_BUCKET = "<your_storage_bucket>"
FIREBASE_MESSAGING_SENDER_ID = "<your_sender_id>"
FIREBASE_APP_ID = "<your_app_id>"
SESSION_COOKIE_NAME = "nssatools_session"
SESSION_MAX_AGE = "604800"
AUTH_BYPASS = "/auth,/firebase-config.js,/auth/login,/auth/logout"
```

前端通过 `/firebase-config.js` 自动注入上述公共配置，无需在页面里硬编码。

### 3. 使用 Wrangler 部署

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

## 使用说明（用户）

1. 访问部署后的Worker URL
2. 使用管理员提供的账户登录（系统不提供自助注册功能）
3. 点击“创建任务”按钮添加新的定时任务
4. 设置任务名称、Webhook URL、请求方法和定时规则
5. 任务创建后会自动开始执行

## 管理员指南

管理员需要在Firebase控制台中手动创建用户账号。详细步骤请参考 [ADMIN_GUIDE.md](ADMIN_GUIDE.md)。

## 安全与会话

- 所有用户数据（任务）存储在浏览器 `localStorage`，并以 `webhook_tasks_<uid>`（每用户隔离）为 key。
- 统一在根 Worker 做登录拦截。首次进入受保护页面若无 Cookie 会 302 至登录页。
- 已实现“会话预热”：登录页在成功登录后跳回根页 `/?redirect=<目标页>`，根页确认 Firebase 已登录后再进入目标，减少“闪一下”。
- 仅管理员在 Firebase 控制台创建账号，不提供自助注册。

## 技术栈

- Cloudflare Workers：提供serverless运行环境
- Firebase Authentication：提供用户认证服务
- HTML/CSS/JavaScript：前端界面
- localStorage：本地数据存储（按用户隔离）
- Day.js：日期时间处理库

## 注意事项

- 使用 `localStorage` 存储，清除浏览器数据会丢失任务；建议定期导出备份。
- 浏览器 `localStorage` 存储约 5MB，任务多时注意容量并分用户保存。
- 若将 `/cron` 单独部署（见 `cron/wrangler.toml`），需在该 Worker 内自行注入 Firebase 配置，或复用根 Worker 的 `/firebase-config.js`。

## 路由与页面
- `/`：工具首页（显示用户邮箱、提供退出）
- `/cron`：Webhook 定时任务（支持明暗主题、导入导出、立即触发、按用户存储）
- `/Gomoku`：五子棋（人机/双人、支持悔棋）
- `/auth/login`：登录页（邮箱/密码）
- `/auth/logout`：退出登录

## 本地开发建议
- 使用 `wrangler dev` 本地预览，确认 `/firebase-config.js` 注入和 Cookie 行为。
- 若需要单独开发 `cron` 子应用，可进入 `cron/` 使用其 `wrangler.toml` 独立部署预览。

## 第三方许可与版权说明
- Emoji/符号：页面中的动物/水果/形状等符号为标准 Unicode 字符，由用户设备与浏览器的系统字体渲染，本项目不打包或分发任何第三方表情图片或字体文件。
- Material Symbols（用于 favicon）：来自 Google 的 Material Symbols Outlined，通过 Google Fonts 在线加载，许可证为 Apache-2.0。参考：[Material Symbols](https://fonts.google.com/icons) · [Apache-2.0 许可](https://www.apache.org/licenses/LICENSE-2.0).
- Tailwind CSS（CDN 版本）：许可证 MIT。参考：[Tailwind CSS](https://tailwindcss.com/) · [License](https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE).
- Firebase Web SDK：许可证 Apache-2.0。参考：[Firebase JS SDK](https://github.com/firebase/firebase-js-sdk) · [License](https://github.com/firebase/firebase-js-sdk/blob/HEAD/LICENSE).
- Day.js：许可证 MIT。参考：[Day.js](https://day.js.org/) · [License](https://github.com/iamkun/dayjs/blob/dev/LICENSE).

说明：若未来需要统一 Emoji 风格并进行离线分发，可考虑接入 Twemoji（CC-BY 4.0，需署名）或本地托管开源 SVG 图标集（如 Heroicons，MIT；Material Symbols，本地托管并附带许可证）。
