# 关键帧保存与加载功能

## 功能介绍

此功能允许您为每个PLY文件（Splat对象）独立保存和加载相机关键帧，方便在不同项目间复用相机动画设置。

## 使用方法

### 保存关键帧

1. 在场景中选择一个Splat对象
2. 为该对象设置相机关键帧（使用时间轴上的"+"按钮添加关键帧）
3. 点击时间轴上的保存按钮（💾图标）
4. 系统将自动下载一个名为 `{SplatName}_keyframes.json` 的文件
5. 建议将下载的文件保存到项目的 `keyframes/` 目录下

### 加载关键帧

1. 在场景中选择要应用关键帧的Splat对象
2. 点击时间轴上的加载按钮（📁图标）
3. 选择之前保存的关键帧JSON文件
4. 系统将自动应用关键帧到当前选中的Splat对象

## 文件格式

关键帧文件使用JSON格式，包含以下字段：

```json
{
  "version": 1,                    // 版本号
  "splatName": "splat_name",       // 原始Splat名称
  "frameCount": 180,               // 原始总帧数
  "frameRate": 30,                 // 原始帧率
  "timestamp": "2024-01-01T00:00:00.000Z", // 创建时间
  "poses": [                       // 关键帧数组
    {
      "name": "camera_0",          // 关键帧名称
      "frame": 0,                  // 帧号
      "position": [2, 1, 2],       // 相机位置 [x, y, z]
      "target": [0, 0, 0]          // 相机目标 [x, y, z]
    }
  ]
}
```

## 注意事项

1. **每个Splat独立管理**：每个PLY文件都有自己独立的关键帧系统
2. **文件命名**：保存时会自动使用 `{SplatName}_keyframes.json` 格式命名
3. **跨Splat应用**：可以将一个Splat的关键帧文件应用到另一个Splat上
4. **数据验证**：加载时会验证文件格式和数据完整性
5. **覆盖警告**：加载关键帧会替换当前Splat的所有现有关键帧

## 建议的文件组织

```
项目目录/
├── keyframes/
│   ├── scene1_keyframes.json
│   ├── scene2_keyframes.json
│   ├── character_keyframes.json
│   └── environment_keyframes.json
├── src/
└── dist/
```

## 示例文件

参考 `example_keyframes.json` 文件了解正确的格式。 