# 管理员指南：在Firebase控制台创建用户

本指南将介绍如何在Firebase控制台中手动创建用户账号，以便用户可以登录到Webhook定时任务工具。

## 前提条件

1. 已创建Firebase项目
2. 已在Firebase项目中启用Authentication服务
3. 已将Firebase配置集成到应用程序中

## 在Firebase控制台创建用户

### 方法一：使用Firebase控制台UI

1. 访问[Firebase控制台](https://console.firebase.google.com/)
2. 选择您的项目
3. 在左侧导航栏中点击"Authentication"
4. 切换到"用户"选项卡
5. 点击"添加用户"按钮
6. 输入用户的电子邮件地址和密码
7. 点击"添加用户"按钮完成创建

![Firebase添加用户示意图](https://firebase.google.com/docs/auth/images/auth-users.png)

### 方法二：使用Firebase Admin SDK

如果需要批量创建用户或通过脚本创建用户，可以使用Firebase Admin SDK。

#### 安装Firebase Admin SDK

```bash
npm install firebase-admin
```

#### 创建用户脚本示例

```javascript
const admin = require('firebase-admin');

// 初始化Firebase Admin SDK
// 请替换serviceAccountPath为您的服务账号密钥文件路径
const serviceAccountPath = './path-to-your-service-account-key.json';
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 创建单个用户
async function createUser(email, password, displayName) {
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      emailVerified: false,
      password: password,
      displayName: displayName,
      disabled: false
    });
    console.log('成功创建用户:', userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

// 批量创建用户示例
async function createMultipleUsers(users) {
  for (const user of users) {
    try {
      await createUser(user.email, user.password, user.displayName);
    } catch (error) {
      console.error(`创建用户 ${user.email} 失败:`, error);
    }
  }
}

// 使用示例
const users = [
  { email: 'user1@example.com', password: 'password123', displayName: '用户1' },
  { email: 'user2@example.com', password: 'password456', displayName: '用户2' }
];

createMultipleUsers(users)
  .then(() => console.log('批量创建用户完成'))
  .catch(error => console.error('批量创建用户失败:', error));
```

## 获取服务账号密钥

要使用Firebase Admin SDK，您需要获取服务账号密钥：

1. 在Firebase控制台中，点击项目设置（⚙️图标）
2. 切换到"服务账号"选项卡
3. 点击"生成新的私钥"按钮
4. 下载生成的JSON文件并安全保存

## 用户管理

### 重置用户密码

1. 在Firebase控制台的"Authentication"页面中找到用户
2. 点击用户行末尾的三点菜单
3. 选择"重置密码"
4. 输入新密码或选择发送密码重置邮件

### 禁用/启用用户账号

1. 在Firebase控制台的"Authentication"页面中找到用户
2. 点击用户行末尾的三点菜单
3. 选择"禁用账号"或"启用账号"

### 删除用户

1. 在Firebase控制台的"Authentication"页面中找到用户
2. 点击用户行末尾的三点菜单
3. 选择"删除账号"
4. 确认删除操作

## 安全提示

1. 确保使用强密码创建用户账号
2. 定期审核用户列表，删除不再需要的账号
3. 安全保管服务账号密钥，避免泄露
4. 考虑使用自定义声明为用户分配角色（如管理员、普通用户等）

## 故障排除

### 常见错误

- **AUTH_EMAIL_ALREADY_EXISTS**: 电子邮件地址已被其他账号使用
- **AUTH_INVALID_PASSWORD**: 密码不符合安全要求（至少6个字符）
- **AUTH_TOO_MANY_ATTEMPTS_TRY_LATER**: 尝试次数过多，请稍后再试

### 联系支持

如有问题，请参考[Firebase Authentication文档](https://firebase.google.com/docs/auth)或联系Firebase支持团队。
