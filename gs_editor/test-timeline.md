# 测试独立关键帧功能

## 修改内容

✅ 已完成以下修改：

1. **timeline.ts** - 修改时间轴系统：
   - 将全局关键帧存储改为每个splat独立存储
   - 添加 `splatKeys` Map 来管理每个splat的关键帧
   - 当选择变化时触发UI更新显示对应splat的关键帧
   - 支持序列化和反序列化每个splat的关键帧数据

2. **camera-poses.ts** - 修改相机pose系统：
   - 将全局pose存储改为每个splat独立存储
   - 添加 `splatPoses` Map 来管理每个splat的相机poses
   - 当选择变化时重建spline以适应当前选中splat的poses

3. **timeline-panel.ts** - 修改UI界面：
   - 监听 `timeline.selectionChanged` 事件重建时间轴显示
   - 更新删除按钮状态以反映当前选中splat的关键帧状态

## 测试步骤

### 准备测试
1. 启动SuperSplat：`npm run develop`
2. 在浏览器中打开 `http://localhost:3000`

### 测试场景
1. **加载多个PLY文件**：
   - 拖放或导入至少2个不同的.ply文件到场景中
   - 确认在Scene Manager中可以看到多个splat

2. **测试独立关键帧**：
   - 选择第一个splat
   - 在timeline中添加几个关键帧（点击Add Key按钮）
   - 选择第二个splat
   - 验证timeline显示为空（没有关键帧）
   - 为第二个splat添加不同的关键帧
   - 切换回第一个splat，确认原来的关键帧仍然存在

3. **测试相机poses**：
   - 选择第一个splat
   - 调整相机位置并添加相机关键帧
   - 选择第二个splat
   - 确认相机pose不受影响
   - 为第二个splat设置不同的相机poses

4. **测试保存/加载**：
   - 创建多个splat的关键帧后保存文档
   - 重新加载文档
   - 确认每个splat的关键帧都正确恢复

## 预期结果

✅ **成功标准**：
- 每个splat都有独立的关键帧，不会相互影响
- 切换splat选择时，timeline正确显示当前splat的关键帧
- 相机poses也是每个splat独立的
- 保存和加载功能正常工作

## 技术实现

### 关键改动
- 使用 `Map<Splat, number[]>` 存储每个splat的关键帧
- 使用 `Map<Splat, Pose[]>` 存储每个splat的相机poses
- 添加 `timeline.selectionChanged` 事件来通知UI更新
- 在序列化时保存所有splat的数据，在反序列化时恢复

### 事件流程
1. 用户选择不同的splat
2. 触发 `selection.changed` 事件
3. timeline系统发出 `timeline.selectionChanged` 事件
4. UI重建timeline显示当前splat的关键帧
5. 用户操作关键帧时只影响当前选中的splat 