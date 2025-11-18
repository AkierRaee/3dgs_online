# 测试空格键播放/暂停功能

## 功能说明
将关键帧的播放/暂停控制绑定到空格键，替换原有的相机覆盖层切换功能。

## 修改内容

✅ **已完成的修改**：

1. **src/main.ts** - 修改快捷键绑定：
   - 将空格键从 `camera.toggleOverlay` 改为 `timeline.togglePlaying`

2. **src/timeline.ts** - 添加播放切换事件：
   - 添加 `timeline.togglePlaying` 事件处理
   - 实现播放状态切换逻辑

3. **src/ui/timeline-panel.ts** - 同步UI状态：
   - 添加对 `timeline.playing` 事件的监听
   - 确保播放按钮图标与播放状态同步

4. **src/ui/shortcuts-popup.ts** - 更新快捷键说明：
   - 将空格键描述从"toggle-splat-overlay"改为"play-pause-timeline"

5. **src/ui/localization.ts** - 添加本地化文本：
   - 为新的快捷键功能添加多语言支持

## 测试步骤

### 1. 启动应用
```bash
npm run develop
```
然后在浏览器中打开 `http://localhost:3000`

### 2. 准备测试场景
1. 导入一个PLY文件到场景中
2. 选择导入的splat对象
3. 在timeline中添加几个关键帧：
   - 调整相机位置
   - 点击"Add Key"按钮添加关键帧
   - 重复几次以创建多个关键帧

### 3. 测试空格键功能
1. **按空格键开始播放**：
   - 按下空格键
   - 确认播放按钮图标变为暂停符号（||）
   - 确认时间轴开始播放动画

2. **按空格键暂停播放**：
   - 再次按下空格键
   - 确认播放按钮图标变为播放符号（▶）
   - 确认时间轴停止播放

3. **UI同步测试**：
   - 用鼠标点击播放按钮开始播放
   - 按空格键应该能暂停播放
   - 按空格键开始播放，用鼠标点击播放按钮应该能暂停

### 4. 验证快捷键帮助
1. 按 `?` 键或通过菜单打开快捷键帮助
2. 确认空格键显示为"播放/暂停 Timeline"而不是"切换Splat叠加"

## 预期结果

✅ **成功标准**：
- 空格键能够切换时间轴的播放/暂停状态
- 播放按钮的图标与播放状态保持同步
- 快捷键帮助中正确显示空格键的新功能
- 原有的播放按钮点击功能仍然正常工作

## 技术实现

### 事件流程
1. 用户按下空格键
2. `Shortcuts` 系统捕获按键事件
3. 触发 `timeline.togglePlaying` 事件
4. Timeline系统切换播放状态
5. 发出 `timeline.playing` 事件通知UI更新
6. TimelinePanel更新播放按钮图标

### 核心代码变更
```typescript
// src/main.ts - 快捷键绑定
shortcuts.register([' '], { event: 'timeline.togglePlaying' });

// src/timeline.ts - 事件处理
events.on('timeline.togglePlaying', () => {
    setPlaying(!playing);
});

// src/ui/timeline-panel.ts - UI同步
events.on('timeline.playing', (isPlaying: boolean) => {
    play.text = isPlaying ? '\uE135' : '\uE131';
});
``` 