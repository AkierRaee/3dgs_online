# DLSS功能测试指南

## 功能概述
本项目已成功集成神经网络上采样技术（类似NVIDIA DLSS），提供AI增强的超分辨率渲染功能，在提高视觉质量的同时提升渲染性能。

## 主要功能特性

### 1. 神经网络上采样
- **Edge Detection**: 智能边缘检测，增强细节表现
- **Bicubic Upscaling**: 使用双三次插值算法进行上采样
- **Temporal Accumulation**: 时序累积技术，减少画面抖动
- **Adaptive Sharpening**: 自适应锐化，提升图像清晰度

### 2. 质量模式
- **Performance**: 2.0x上采样，最高性能
- **Balanced**: 1.7x上采样，性能与质量平衡
- **Quality**: 1.5x上采样，最佳视觉质量
- **Ultra Performance**: 2.3x上采样，极限性能模式

### 3. 渲染优化
- **低分辨率渲染**: 场景在较低分辨率下渲染
- **神经网络增强**: AI算法智能提升到目标分辨率
- **运动矢量**: 用于时序稳定性
- **性能监控**: 实时性能指标统计

## 如何使用

### 1. 打开DLSS设置
1. 在顶部菜单栏点击 "Render"
2. 选择 "NEURAL UPSCALING SETTINGS"
3. DLSS设置对话框将打开

### 2. 配置DLSS选项
- **Enable Neural Upscaling**: 开启/关闭神经网络上采样
- **Quality Mode**: 选择性能模式（Performance/Balanced/Quality/Ultra）
- **Temporal Accumulation**: 开启时序累积（推荐开启）
- **Sharpening**: 调整锐化程度（0.0-1.0）

### 3. 应用设置
点击"Render"按钮应用设置，系统将：
- 配置神经网络上采样器
- 更新渲染管道
- 强制重新渲染场景

## 技术实现

### 文件结构
```
src/
├── neural-upscaler.ts          # 核心神经网络上采样实现
├── ui/dlss-settings-dialog.ts  # DLSS设置对话框
├── scene.ts                    # 场景集成
├── render.ts                   # 渲染事件处理
└── ui/
    ├── menu.ts                 # 菜单集成
    ├── editor.ts               # 编辑器集成
    ├── localization.ts         # 多语言支持
    └── scss/settings-dialog.scss # 样式文件
```

### 集成点
1. **Scene类**: 集成NeuralUpscaler实例
2. **Render模块**: 添加DLSS配置事件
3. **UI Menu**: 添加DLSS设置菜单项
4. **Editor**: 注册DLSS设置对话框

## 性能指标

可通过以下方式获取性能数据：
```javascript
const metrics = events.invoke('dlss.getMetrics');
console.log('DLSS Metrics:', metrics);
```

返回数据包括：
- `enabled`: 是否启用
- `scaleFactor`: 缩放因子
- `renderTime`: 渲染时间（毫秒）
- `frameCount`: 帧计数
- `lowResolution`: 低分辨率尺寸
- `highResolution`: 高分辨率尺寸

## 兼容性

### 系统要求
- WebGL 2.0 支持
- 现代浏览器（Chrome 80+, Firefox 75+, Safari 14+）
- 支持片段着色器的GPU

### 检查支持性
```javascript
const isSupported = events.invoke('dlss.isSupported');
if (isSupported) {
    console.log('Neural Upscaling is supported');
} else {
    console.log('Neural Upscaling is not supported');
}
```

## 故障排除

### 常见问题
1. **DLSS选项显示为灰色**: 检查WebGL 2.0支持
2. **性能没有提升**: 确保启用了合适的质量模式
3. **画面质量下降**: 尝试调整锐化设置或切换到Quality模式

### 调试信息
查看浏览器控制台获取详细日志：
```
Neural Upscaling configured: {enabled: true, qualityMode: "quality", ...}
```

## 未来改进

### 计划功能
- **更高级的AI算法**: 集成更复杂的神经网络
- **动态质量调整**: 根据性能自动调整质量
- **预设配置**: 针对不同硬件的预设配置
- **实时性能图表**: 可视化性能数据

### 优化方向
- 减少内存使用
- 提高时序稳定性
- 优化shader性能
- 支持更多渲染特效

## 结论

通过集成神经网络上采样技术，本项目在保持高质量视觉效果的同时显著提升了渲染性能。用户可以根据自己的硬件配置和质量需求选择最适合的设置，获得最佳的使用体验。 