import { 
    Entity, 
    Vec3, 
    Color,
    GraphicsDevice,
    AppBase,
    MeshInstance,
    Material,
    StandardMaterial,
    Mesh,
    createSphere,
    createPlane,
    CULLFACE_NONE,
    BLEND_NORMAL,
    Camera
} from 'playcanvas';
import { Events } from './events';
import { Splat } from './splat';
import { Hotspot } from './hotspots';

// 扩展Entity类型来支持hotspotData
declare module 'playcanvas' {
    interface Entity {
        hotspotData?: Hotspot;
        clickHandler?: (event: any) => void;
        contextMenuHandler?: (event: any) => void;
        labelElement?: HTMLElement;
    }
}

class HotspotRenderer {
    private events: Events;
    private app: AppBase;
    private device: GraphicsDevice;
    private hotspotEntities = new Map<string, Entity>();
    private currentSplat: Splat | null = null;
    private rootEntity: Entity;
    private labelContainer: HTMLElement;

    constructor(events: Events, app: AppBase) {
        this.events = events;
        this.app = app;
        this.device = app.graphicsDevice;

        // 创建热点根实体
        this.rootEntity = new Entity('hotspots-root');
        app.root.addChild(this.rootEntity);

        // 创建文字标签容器
        this.createLabelContainer();

        this.setupEventListeners();
    }

    private createLabelContainer() {
        this.labelContainer = document.createElement('div');
        this.labelContainer.style.position = 'absolute';
        this.labelContainer.style.top = '0';
        this.labelContainer.style.left = '0';
        this.labelContainer.style.width = '100%';
        this.labelContainer.style.height = '100%';
        this.labelContainer.style.pointerEvents = 'none';
        this.labelContainer.style.zIndex = '1000';
        this.labelContainer.style.fontFamily = 'Arial, sans-serif';
        this.labelContainer.id = 'hotspot-labels';
        
        // 添加到画布容器
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.appendChild(this.labelContainer);
            canvasContainer.style.position = 'relative'; // 确保容器是相对定位
        } else {
            document.body.appendChild(this.labelContainer);
        }
    }

    private setupEventListeners() {
        // 监听热点相关事件
        this.events.on('hotspots.updated', () => {
            this.updateHotspots();
        });

        this.events.on('hotspots.removed', (hotspot: Hotspot) => {
            this.removeHotspotEntity(hotspot.id);
        });

        this.events.on('hotspots.hotspotUpdated', (hotspot: Hotspot) => {
            this.updateHotspotEntity(hotspot);
        });

        this.events.on('selection.changed', () => {
            const newSplat = this.events.invoke('selection') as Splat;
            if (newSplat !== this.currentSplat) {
                this.currentSplat = newSplat;
                this.updateHotspots();
                this.updateHotspotVisibility();
            }
        });

        // 监听预渲染事件，更新热点朝向
        this.events.on('prerender', () => {
            this.updateHotspotOrientations();
        });

        // 监听splat显示/隐藏变化
        this.events.on('splat.visibility', (splat: Splat) => {
            // 只有当变化的splat是当前选中的splat时才更新热点可见性
            const currentSplat = this.events.invoke('selection') as Splat;
            if (splat === currentSplat) {
                this.updateHotspotVisibility();
            }
        });

        // 添加全局点击事件监听器
        const canvas = this.app.graphicsDevice.canvas;
        const handleClick = (event: MouseEvent) => {
            this.handleHotspotClick(event);
        };
        const handleContextMenu = (event: MouseEvent) => {
            // 只有在点击热点附近时才阻止默认右键菜单
            if (this.isNearHotspot(event)) {
                event.preventDefault();
            }
        };

        canvas.addEventListener('mousedown', handleClick);
        canvas.addEventListener('contextmenu', handleContextMenu);

        // 存储事件处理器用于清理
        (this as any).globalClickHandler = handleClick;
        (this as any).globalContextMenuHandler = handleContextMenu;
    }

    private updateHotspotVisibility() {
        // 确保热点与当前选中的PLY的可见性保持同步
        const currentSplat = this.events.invoke('selection') as Splat;
        const isVisible = currentSplat ? currentSplat.visible : false;
        
        // 控制整个热点系统的可见性
        this.rootEntity.enabled = isVisible;
        this.labelContainer.style.display = isVisible ? 'block' : 'none';
        
        // 更新每个热点实体的可见性
        this.hotspotEntities.forEach((entity, hotspotId) => {
            if (entity.hotspotData) {
                const shouldShow = isVisible && entity.hotspotData.visible;
                entity.enabled = shouldShow;
                
                // 同时控制HTML标签
                if (entity.labelElement) {
                    entity.labelElement.style.visibility = shouldShow ? 'visible' : 'hidden';
                }
            }
        });
    }

    private createHotspotMaterial(hotspot: Hotspot): Material {
        const material = new StandardMaterial();
        material.diffuse = new Color(1, 0.3, 0.3); // 红色
        material.emissive = new Color(0.2, 0.1, 0.1);
        material.metalness = 0;
        material.opacity = 0.9;
        material.blendType = BLEND_NORMAL;
        material.cull = CULLFACE_NONE;
        material.depthWrite = false;
        material.update();
        
        return material;
    }

    private createSimpleMaterial(color: Color, opacity: number = 1): Material {
        const material = new StandardMaterial();
        material.diffuse = color;
        material.opacity = opacity;
        material.blendType = BLEND_NORMAL;
        material.cull = CULLFACE_NONE;
        material.depthWrite = false;
        material.update();
        
        return material;
    }

    private createTextLabel(hotspot: Hotspot, parentEntity: Entity): HTMLElement {
        // 创建HTML文字标签
        const labelElement = document.createElement('div');
        labelElement.style.position = 'absolute';
        labelElement.style.color = 'white';
        labelElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        labelElement.style.padding = '4px 8px';
        labelElement.style.borderRadius = '4px';
        labelElement.style.fontSize = '14px'; // 固定14像素字体大小
        labelElement.style.fontWeight = 'bold';
        labelElement.style.textAlign = 'center';
        labelElement.style.whiteSpace = 'nowrap';
        labelElement.style.pointerEvents = 'auto'; // 改为可点击
        labelElement.style.zIndex = '1001';
        labelElement.style.transform = 'translate(-50%, -50%)'; // 改为居中显示，与热点球体重叠
        labelElement.style.cursor = 'pointer'; // 添加鼠标指针样式
        
        labelElement.textContent = hotspot.name;
        
        // 添加点击事件监听器到文字标签
        labelElement.addEventListener('mousedown', (event) => {
            console.log(`文字标签点击: ${hotspot.name}`);
            event.stopPropagation();
            
            if (event.button === 0) { // 左键点击
                this.events.fire('hotspots.clicked', hotspot);
            } else if (event.button === 2) { // 右键点击
                this.events.fire('hotspots.rightclicked', hotspot);
                event.preventDefault();
            }
        });
        
        // 添加右键菜单事件
        labelElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        console.log(`创建热点标签: "${hotspot.name}"`);
        
        // 添加到标签容器
        this.labelContainer.appendChild(labelElement);
        
        // 存储引用
        parentEntity.labelElement = labelElement;
        
        return labelElement;
    }

    private createHotspotEntity(hotspot: Hotspot): Entity {
        // 主热点实体
        const entity = new Entity(`hotspot_${hotspot.id}`);
        entity.setPosition(hotspot.position);

        // 创建球体几何体作为热点标记
        const sphereMesh = createSphere(this.device, {
            radius: hotspot.size * 0.1,
            latitudeBands: 16,
            longitudeBands: 16
        });

        // 球体实体
        const sphereEntity = new Entity('hotspot-sphere');
        sphereEntity.addComponent('render', {
            type: 'sphere',
            material: this.createHotspotMaterial(hotspot)
        });
        sphereEntity.render!.meshInstances = [new MeshInstance(sphereMesh, this.createHotspotMaterial(hotspot))];

        // 创建HTML文字标签
        const labelElement = this.createTextLabel(hotspot, entity);

        // 组装实体 - 移除脉冲动画球
        entity.addChild(sphereEntity);

        // 添加用户数据
        entity.tags.add('hotspot');
        entity.hotspotData = hotspot;

        // 添加点击检测
        entity.addComponent('collision', {
            type: 'sphere',
            radius: hotspot.size * 0.2
        });

        // 添加到场景
        this.rootEntity.addChild(entity);
        this.hotspotEntities.set(hotspot.id, entity);

        // 添加点击事件处理
        this.addClickHandler(entity);

        return entity;
    }

    private addClickHandler(entity: Entity) {
        // 我们不为每个热点单独添加事件监听器
        // 而是在 setupEventListeners 中添加全局监听器
        // 这里只是标记这个实体需要点击检测
        entity.tags.add('clickable-hotspot');
    }

    private handleHotspotClick(event: MouseEvent) {
        const camera = this.events.invoke('camera.entity') as Entity;
        if (!camera || !camera.camera) return;

        const canvas = this.app.graphicsDevice.canvas;
        const rect = canvas.getBoundingClientRect();

        // 添加调试信息
        console.log(`📐 画布尺寸: ${canvas.width}x${canvas.height}, CSS尺寸: ${rect.width}x${rect.height}`);

        // 使用CSS坐标系统计算鼠标位置（与热点显示位置一致）
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        console.log(`🖱️ 鼠标点击位置: (${mouseX.toFixed(1)}, ${mouseY.toFixed(1)}) [CSS坐标]`);

        // 检查所有热点
        let clickedHotspot: Entity | null = null;
        let minDistance = Infinity;

        this.hotspotEntities.forEach((entity) => {
            if (!entity.hotspotData) return;

            // 使用统一的坐标计算方法
            const hotspotPosition = this.getHotspotScreenPosition(entity);
            
            if (!hotspotPosition.isVisible) return;

            // 直接使用worldToScreen返回的像素坐标作为CSS坐标
            // 因为worldToScreen应该已经返回了CSS像素坐标
            const hotspotCSSX = hotspotPosition.x;
            const hotspotCSSY = hotspotPosition.y;

            // 计算鼠标与热点的距离（使用CSS坐标）
            const distanceX = mouseX - hotspotCSSX;
            const distanceY = mouseY - hotspotCSSY;
            const pixelDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            console.log(`  热点 "${entity.hotspotData.name}": 画布位置 (${hotspotPosition.x.toFixed(1)}, ${hotspotPosition.y.toFixed(1)}) -> CSS位置 (${hotspotCSSX.toFixed(1)}, ${hotspotCSSY.toFixed(1)}), 距离: ${pixelDistance.toFixed(1)}px`);

            // 找到最近的热点（10像素范围内）
            if (pixelDistance <= 10 && pixelDistance < minDistance) {
                minDistance = pixelDistance;
                clickedHotspot = entity;
            }
        });

        // 如果找到了点击的热点
        if (clickedHotspot && clickedHotspot.hotspotData) {
            console.log(`✅ 点击了热点: "${clickedHotspot.hotspotData.name}", 距离: ${minDistance.toFixed(1)}px`);

            if (event.button === 0) { // 左键点击
                if (clickedHotspot.hotspotData.targetSplatName) {
                    console.log(`🔄 正在跳转到: ${clickedHotspot.hotspotData.targetSplatName}`);
                }
                this.events.fire('hotspots.clicked', clickedHotspot.hotspotData);
            } else if (event.button === 2) { // 右键点击
                console.log(`🖱️ 右键点击热点: ${clickedHotspot.hotspotData.name}`);
                this.events.fire('hotspots.rightclicked', clickedHotspot.hotspotData);
                event.preventDefault();
            }
        }
    }

    private isNearHotspot(event: MouseEvent): boolean {
        const camera = this.events.invoke('camera.entity') as Entity;
        if (!camera || !camera.camera) return false;

        const canvas = this.app.graphicsDevice.canvas;
        const rect = canvas.getBoundingClientRect();
        
        // 使用CSS坐标系统
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // 检查是否靠近任何热点
        for (const [, entity] of this.hotspotEntities) {
            if (!entity.hotspotData) continue;

            const hotspotPosition = this.getHotspotScreenPosition(entity);
            
            if (!hotspotPosition.isVisible) continue;

            // 直接使用worldToScreen返回的像素坐标
            const hotspotCSSX = hotspotPosition.x;
            const hotspotCSSY = hotspotPosition.y;

            const distanceX = mouseX - hotspotCSSX;
            const distanceY = mouseY - hotspotCSSY;
            const pixelDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (pixelDistance <= 10) {
                return true;
            }
        }

        return false;
    }

    private getHotspotScreenPosition(entity: Entity): { x: number, y: number, isVisible: boolean } {
        const camera = this.events.invoke('camera.entity') as Entity;
        if (!camera || !camera.camera || !entity.hotspotData) {
            return { x: 0, y: 0, isVisible: false };
        }

        // 获取热点球体的实际世界位置
        const sphereEntity = entity.findByName('hotspot-sphere') as Entity;
        let hotspotWorldPos: Vec3;
        
        if (sphereEntity) {
            // 使用球体的世界变换矩阵获取世界位置
            const worldTransform = sphereEntity.getWorldTransform();
            hotspotWorldPos = new Vec3();
            worldTransform.getTranslation(hotspotWorldPos);
        } else {
            // 回退到主实体的世界位置
            const worldTransform = entity.getWorldTransform();
            hotspotWorldPos = new Vec3();
            worldTransform.getTranslation(hotspotWorldPos);
        }
        
        // 转换为屏幕坐标
        const screenPos = new Vec3();
        camera.camera.worldToScreen(hotspotWorldPos, screenPos);
        
        // 检查是否在相机前方
        const cameraPos = camera.getPosition();
        const toHotspot = new Vec3().sub2(hotspotWorldPos, cameraPos);
        const cameraForward = camera.forward;
        const isInFront = toHotspot.dot(cameraForward) > 0;
        
        // 检查是否可见
        const isVisible = isInFront && screenPos.z > 0;
        
        console.log(`热点 "${entity.hotspotData.name}" 世界位置: (${hotspotWorldPos.x.toFixed(2)}, ${hotspotWorldPos.y.toFixed(2)}, ${hotspotWorldPos.z.toFixed(2)}) -> 屏幕位置: (${screenPos.x.toFixed(1)}, ${screenPos.y.toFixed(1)})`);
        
        return {
            x: screenPos.x,
            y: screenPos.y,
            isVisible: isVisible
        };
    }

    private updateHotspotOrientations() {
        const camera = this.events.invoke('camera.entity') as Entity;
        if (!camera || !camera.camera) {
            console.log('无法获取相机');
            return;
        }

        console.log(`更新热点位置，热点数量: ${this.hotspotEntities.size}`);

        this.hotspotEntities.forEach((entity, hotspotId) => {
            if (entity.labelElement && entity.hotspotData) {
                // 获取热点的基础屏幕位置
                const basePosition = this.getHotspotScreenPosition(entity);
                
                if (basePosition.isVisible) {
                    const canvas = this.app.graphicsDevice.canvas;
                    const rect = canvas.getBoundingClientRect();
                    
                    // 直接使用worldToScreen返回的像素坐标作为CSS坐标
                    const baseCSSX = basePosition.x;
                    const baseCSSY = basePosition.y;
                    
                    // 文字标签直接显示在热点球体的中心位置，无偏移
                    const labelX = baseCSSX;
                    const labelY = baseCSSY; // 不再向上偏移
                    
                    // 简单边界检查（CSS坐标系统）
                    if (labelX >= -50 && labelX <= rect.width + 50 && labelY >= -50 && labelY <= rect.height + 50) {
                        // 设置标签位置
                        entity.labelElement.style.left = `${labelX}px`;
                        entity.labelElement.style.top = `${labelY}px`;
                        entity.labelElement.style.display = 'block';
                        entity.labelElement.style.visibility = 'visible';
                        
                        console.log(`热点 "${entity.hotspotData.name}" 显示在: CSS位置 (${labelX.toFixed(1)}, ${labelY.toFixed(1)}) [画布位置: ${basePosition.x.toFixed(1)}, ${basePosition.y.toFixed(1)}] 无偏移`);
                    } else {
                        // 热点不在视野内，隐藏标签
                        entity.labelElement.style.display = 'none';
                        console.log(`热点 "${entity.hotspotData.name}" 超出边界: x=${labelX.toFixed(1)}, y=${labelY.toFixed(1)}`);
                    }
                } else {
                    // 热点不在视野内，隐藏标签
                    entity.labelElement.style.display = 'none';
                    console.log(`热点 "${entity.hotspotData.name}" 不在相机前方`);
                }
            }
        });
    }

    private updateHotspotEntity(hotspot: Hotspot) {
        const entity = this.hotspotEntities.get(hotspot.id);
        if (!entity) return;

        // 更新位置
        entity.setPosition(hotspot.position);

        // 更新大小
        const sphereEntity = entity.findByName('hotspot-sphere') as Entity;
        if (sphereEntity?.render) {
            sphereEntity.setLocalScale(hotspot.size, hotspot.size, hotspot.size);
        }

        // 更新HTML文字标签
        if (entity.labelElement) {
            entity.labelElement.textContent = hotspot.name;
            // 保持固定字体大小14px，不再根据热点大小变化
            entity.labelElement.style.fontSize = '14px';
            
            // 重新绑定点击事件（移除旧事件监听器并添加新的）
            const newLabelElement = entity.labelElement.cloneNode(true) as HTMLElement;
            
            // 添加点击事件监听器到新的文字标签
            newLabelElement.addEventListener('mousedown', (event) => {
                console.log(`文字标签点击: ${hotspot.name}`);
                event.stopPropagation();
                
                if (event.button === 0) { // 左键点击
                    this.events.fire('hotspots.clicked', hotspot);
                } else if (event.button === 2) { // 右键点击
                    this.events.fire('hotspots.rightclicked', hotspot);
                    event.preventDefault();
                }
            });
            
            // 添加右键菜单事件
            newLabelElement.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
            
            // 替换旧的标签元素
            this.labelContainer.replaceChild(newLabelElement, entity.labelElement);
            entity.labelElement = newLabelElement;
        }

        // 更新碰撞体大小
        if (entity.collision) {
            entity.collision.radius = hotspot.size * 0.2;
        }

        // 更新用户数据
        entity.hotspotData = hotspot;

        // 更新可见性
        const currentSplat = this.events.invoke('selection') as Splat;
        const isVisible = currentSplat ? currentSplat.visible : false;
        entity.enabled = isVisible && hotspot.visible;
        
        // 更新标签可见性
        if (entity.labelElement) {
            entity.labelElement.style.visibility = (isVisible && hotspot.visible) ? 'visible' : 'hidden';
        }
    }

    private removeHotspotEntity(hotspotId: string) {
        const entity = this.hotspotEntities.get(hotspotId);
        if (entity) {
            // 清理HTML标签
            if (entity.labelElement) {
                this.labelContainer.removeChild(entity.labelElement);
            }
            
            entity.destroy();
            this.hotspotEntities.delete(hotspotId);
        }
    }

    private updateHotspots() {
        // 清除所有现有热点
        this.hotspotEntities.forEach((entity) => {
            // 清理HTML标签
            if (entity.labelElement) {
                this.labelContainer.removeChild(entity.labelElement);
            }
            
            entity.destroy();
        });
        this.hotspotEntities.clear();

        // 获取当前选中splat的热点并创建实体
        const hotspots = this.events.invoke('hotspots.list') as Hotspot[];
        hotspots.forEach((hotspot) => {
            if (hotspot.visible) {
                this.createHotspotEntity(hotspot);
            }
        });

        // 更新朝向
        this.updateHotspotOrientations();
        
        // 更新可见性
        this.updateHotspotVisibility();
    }

    public setVisible(visible: boolean) {
        this.rootEntity.enabled = visible;
        // 同时控制HTML标签容器的可见性
        this.labelContainer.style.display = visible ? 'block' : 'none';
    }

    public destroy() {
        // 清理所有热点实体
        this.hotspotEntities.forEach((entity) => {
            // 清理HTML标签
            if (entity.labelElement) {
                this.labelContainer.removeChild(entity.labelElement);
            }
            
            entity.destroy();
        });
        this.hotspotEntities.clear();

        // 清理全局事件监听器
        const canvas = this.app.graphicsDevice.canvas;
        if ((this as any).globalClickHandler) {
            canvas.removeEventListener('mousedown', (this as any).globalClickHandler);
        }
        if ((this as any).globalContextMenuHandler) {
            canvas.removeEventListener('contextmenu', (this as any).globalContextMenuHandler);
        }

        // 移除标签容器
        if (this.labelContainer.parentNode) {
            this.labelContainer.parentNode.removeChild(this.labelContainer);
        }

        // 销毁根实体
        this.rootEntity.destroy();
    }
}

export { HotspotRenderer }; 