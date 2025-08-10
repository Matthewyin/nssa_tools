# Firebase Dynamic Links 停用通知

## 重要提示

Firebase Dynamic Links 将于 **2025年8月25日** 停用。这将影响我们应用中的以下功能：

### 受影响的功能

1. **移动应用的电子邮件链接身份验证**
   - 包括电子邮件登录链接
   - 密码重置链接
   - 电子邮件验证链接

2. **Cordova应用中的OAuth支持**（如果适用）

## 迁移计划

为确保我们的应用在2025年8月25日后继续正常运行，我们需要执行以下操作：

### 对于iOS应用

1. 升级到最新的Firebase Authentication SDK
2. 按照[Firebase iOS迁移指南](https://firebase.google.com/docs/dynamic-links/ios/receive)实施替代解决方案
3. 使用Apple的Universal Links替代Dynamic Links

### 对于Android应用

1. 将Firebase Authentication Android SDK更新到至少v20.0.0或BoM版本26.0.0以上
2. 按照[Firebase Android迁移指南](https://firebase.google.com/docs/dynamic-links/android/receive)实施替代解决方案
3. 使用Android App Links替代Dynamic Links

### 对于Web应用

Web应用中的Firebase Authentication电子邮件操作不受影响，无需迁移。

## 时间线

- **现在至2025年8月25日**：现有功能将继续正常运行
- **2025年8月25日**：Firebase Dynamic Links服务关停
- **2025年8月25日后**：未迁移的应用将无法使用受影响的认证功能

## 后续步骤

1. 评估我们当前的认证实现
2. 确定是否使用了受影响的功能
3. 制定迁移计划
4. 在2025年8月25日之前完成迁移

## 参考资料

- [Firebase Dynamic Links弃用常见问题解答](https://firebase.google.com/support/dynamic-links-faq)
- [iOS迁移指南](https://firebase.google.com/docs/dynamic-links/ios/receive)
- [Android迁移指南](https://firebase.google.com/docs/dynamic-links/android/receive)

## 备注

即使我们不采取任何措施，应用和最终用户也能够在2025年8月25日之前继续使用这些功能。但为了确保服务的连续性，建议提前规划并实施迁移。
