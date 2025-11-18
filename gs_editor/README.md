# SM_NOTE: 
新增功能：
1.点击“场景管理器”下的ply名就能切换显示，且同时只能显示一个ply。

2.独立的关键帧，支持保存和加载关键帧。且切换ply后自动播放关键帧（避免坐标系不一致切换后一篇空白）。空格键绑定为播放/暂停关键帧。

3.新增“热点”功能，选定ply后操作，通过xyz添加。

4.热点调整功能，绑定热点到其他ply，点击名字后即可切换显示。

5.不太确定的DLSS，在“渲染”下拉菜单中打开。有效降低渲染质量但是提高渲染速率。打开和关闭都在右上角及控制台提醒。

6.FPS显示功能，左上角显示。无视角变换时默认60fps，视角连续变换时计算最近1秒的平均fps值。

# CXZ_NOTE:
新增功能：
1.实现了从3dgs训练结果加载cameras.json相机位姿文件，将每一个相机位姿作为timeline上的一个关键帧，两个相邻关键帧之间相差18帧。

2.SIM按钮可以简化关键帧的选取，仅仅等比例的选取10个关键帧用于展示。

3.实现了加载原始图像的功能，右上角显示当前关键帧对应的原始图像。支持鼠标拖动、双击放大操作。

4.实现了跳转至最近关键帧相机位姿的功能，具体实现为3s的插值跳转。

5.支持WASD前后左右移动视角，QE上升/下降。

6.左侧实时计算当前视角在世界坐标系的位置和方向。

7.重写了原来supersplat轨道相机的逻辑（原来的逻辑是相机围绕目标点target做旋转来观察），现在修改为自由相机模式，通过相机的旋转矩阵转化为四元数并插值。

# SuperSplat - 3D Gaussian Splat Editor

| [SuperSplat Editor](https://superspl.at/editor) | [User Guide](https://github.com/playcanvas/supersplat/wiki) | [Forum](https://forum.playcanvas.com/) | [Discord](https://discord.gg/RSaMRzg) |

SuperSplat is a free and open source tool for inspecting, editing, optimizing and publishing 3D Gaussian Splats. It is built on web technologies and runs in the browser, so there's nothing to download or install.

A live version of this tool is available at: https://playcanvas.com/supersplat/editor

![image](https://github.com/user-attachments/assets/b6cbb5cc-d3cc-4385-8c71-ab2807fd4fba)

To learn more about using SuperSplat, please refer to the [User Guide](https://github.com/playcanvas/supersplat/wiki).

## Local Development

To initialize a local development environment for SuperSplat, ensure you have [Node.js](https://nodejs.org/) 18 or later installed. Follow these steps:

1. Clone the repository:

   ```sh
   git clone https://github.com/playcanvas/supersplat.git
   cd supersplat
   ```

2. Install dependencies:

   ```sh
   git submodule update --init
   npm install
   ```

3. Build SuperSplat and start a local web server:

   ```sh
   npm run develop
   or
   npm run build
   npm run serve
   ```

4. Open a web browser tab and make sure network caching is disabled on the network tab and the other application caches are clear:

   - On Safari you can use `Cmd+Option+e` or Develop->Empty Caches.
   - On Chrome ensure the options "Update on reload" and "Bypass for network" are enabled in the Application->Service workers tab:

   <img width="846" alt="Screenshot 2025-04-25 at 16 53 37" src="https://github.com/user-attachments/assets/888bac6c-25c1-4813-b5b6-4beecf437ac9" />

5. Navigate to `http://localhost:3000`

When changes to the source are detected, SuperSplat is rebuilt automatically. Simply refresh your browser to see your changes.

## Contributors

SuperSplat is made possible by our amazing open source community:

<a href="https://github.com/playcanvas/supersplat/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=playcanvas/supersplat" />
</a>






