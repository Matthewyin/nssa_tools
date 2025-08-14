# 设备特定居中系统

## 🎯 概述

MLG游戏现在支持针对不同设备类型的智能居中算法，确保立方体布局在手机端和PC端都能完美居中，且两者不相互影响。

## 📱 设备分类

### 设备检测规则
```javascript
const screenWidth = window.innerWidth;
const isMobile = screenWidth <= 768;      // 手机端
const isTablet = screenWidth > 768 && screenWidth <= 1024;  // 平板端
const isDesktop = screenWidth > 1024;     // PC端
```

### 设备特性
| 设备类型 | 屏幕范围 | 特点 | 优化重点 |
|---------|----------|------|----------|
| **手机端** | ≤768px | 触摸操作、竖屏为主 | 更激进的居中补偿 |
| **平板端** | 769-1024px | 触摸+鼠标、横竖屏切换 | 中等程度的补偿 |
| **PC端** | >1024px | 鼠标操作、横屏为主 | 保守的补偿策略 |

## 🧮 居中算法

### 视觉中心偏移策略

由于45度角的层级偏移会让立方体群组的视觉重心向右下方移动，需要通过向左上补偿来实现真正的视觉居中。

#### 补偿系数
```javascript
if (isMobile) {
  // 手机端：更激进的居中补偿
  visualCenterOffsetX = maxLayerOffset * 0.6;  // 60%
  visualCenterOffsetY = maxLayerOffset * 0.4;  // 40%
} else if (isTablet) {
  // 平板端：中等程度的补偿
  visualCenterOffsetX = maxLayerOffset * 0.55; // 55%
  visualCenterOffsetY = maxLayerOffset * 0.45; // 45%
} else {
  // PC端：保守的补偿
  visualCenterOffsetX = maxLayerOffset * 0.5;  // 50%
  visualCenterOffsetY = maxLayerOffset * 0.5;  // 50%
}
```

### 边距策略

不同设备使用不同的安全边距：

```javascript
const margin = isMobile ? 10 : 20; // 手机端边距更小
```

- **手机端**: 10px边距，最大化可用空间
- **平板/PC端**: 20px边距，保持视觉舒适度

## 🎨 视觉效果

### 手机端优化
- **更激进的水平补偿** (60%): 考虑到手机屏幕较窄，需要更多的左偏移
- **适中的垂直补偿** (40%): 避免过度上移影响顶部UI
- **更小的边距**: 最大化游戏区域

### 平板端平衡
- **平衡的补偿策略** (55%/45%): 兼顾横竖屏使用场景
- **适中的边距**: 平衡空间利用和视觉舒适度

### PC端保守
- **均衡的补偿** (50%/50%): 保持传统的视觉平衡
- **标准边距**: 确保充足的视觉呼吸空间

## 🔧 技术实现

### 核心算法
```javascript
// 水平居中计算
if (totalWidth <= canvasWidth) {
  const basicCenterX = Math.floor((canvasWidth - totalWidth) / 2);
  startX = basicCenterX - visualCenterOffsetX;
  startX = Math.max(5, startX); // 防止超出左边界
} else {
  const availableWidth = canvasWidth - margin * 2;
  const gridCenterOffset = Math.floor((availableWidth - baseGridWidth) / 2);
  startX = Math.max(margin, gridCenterOffset - visualCenterOffsetX);
}
```

### 边界保护
- **最小边距**: 确保内容不会贴边显示
- **溢出处理**: 内容超出画布时的智能裁剪
- **安全区域**: 避免与UI元素重叠

## 🧪 测试工具

### 调试模式
在URL后添加 `?debug=center` 可在控制台查看详细的居中计算信息：

```javascript
console.log('居中计算详情:', {
  设备类型: 'Mobile/Tablet/Desktop',
  屏幕宽度: screenWidth,
  画布尺寸: `${cssWidth}×${cssHeight}`,
  网格尺寸: `${baseGridWidth}×${baseGridHeight}`,
  总尺寸: `${totalWidth}×${totalHeight}`,
  层级偏移: maxLayerOffset,
  视觉偏移: `(${visualCenterOffsetX}, ${visualCenterOffsetY})`,
  起点位置: `(${startX}, ${startY})`
});
```

### 可视化测试页面
访问 `/mlg/test-device-center.html` 可以：

- **实时预览**: 不同设备类型的居中效果
- **参数调整**: 动态修改网格大小、层级数等参数
- **可视化指示**: 显示各种边界线和偏移箭头
- **设备信息**: 实时显示当前设备类型和计算结果

#### 测试页面功能
- 🎛️ **参数控制**: 调整网格列数、行数、层级数、立方体大小
- 📊 **实时计算**: 显示居中计算的详细数据
- 🎨 **可视化**: 多种颜色的边界线和指示器
- 📱 **响应式**: 支持实时调整窗口大小测试

## 📐 CSS响应式优化

### 媒体查询
```css
/* 手机端 */
@media (max-width: 640px) {
  .game-container { padding: 8px; }
  .game-canvas { border-radius: 8px; }
}

/* 平板竖屏 */
@media (min-width: 641px) and (max-width: 768px) {
  .game-container { padding: 12px; }
  .game-canvas { border-radius: 10px; }
}

/* 平板横屏 */
@media (min-width: 769px) and (max-width: 1024px) {
  .game-container { padding: 16px; }
  .game-canvas { border-radius: 12px; }
}
```

### 立方体大小缩放
```javascript
let screenScale = 1;
if (screenWidth <= 480) {
  screenScale = 0.6; // 超小屏幕
} else if (screenWidth <= 640) {
  screenScale = 0.7; // 小屏幕手机
} else if (screenWidth <= 768) {
  screenScale = 0.85; // 平板竖屏
}
```

## 🎯 效果验证

### 预期效果
- ✅ **手机端**: 立方体群组在小屏幕上完美居中，充分利用空间
- ✅ **平板端**: 在横竖屏切换时保持良好的居中效果
- ✅ **PC端**: 保持传统的视觉平衡，适合鼠标操作

### 测试场景
1. **不同屏幕尺寸**: iPhone SE、iPhone 14、iPad、MacBook等
2. **横竖屏切换**: 平板设备的方向变化
3. **窗口调整**: PC端浏览器窗口大小变化
4. **不同关卡**: 各种网格大小和层级数的组合

## 🚀 性能优化

### 计算缓存
- 设备类型检测结果缓存
- 避免重复的数学计算
- 智能的重绘触发机制

### 渲染优化
- 基于设备类型的渲染策略
- 适配不同DPR的高清显示
- 流畅的动画和交互体验

---

**注意**: 此系统确保了在不同设备上的一致性体验，同时针对各设备特点进行了专门优化。
