import { Events } from './events';
import { Hotspot } from './hotspots';
import { Splat } from './splat';
import { Vec3 } from 'playcanvas';

class HotspotAdjuster {
    private events: Events;
    private adjustPanel: HTMLElement | null = null;
    private currentHotspot: Hotspot | null = null;

    constructor(events: Events) {
        this.events = events;
        this.setupEventListeners();
    }

    private setupEventListeners() {
        // 监听热点点击事件，长按进入编辑模式
        this.events.on('hotspots.rightclicked', (hotspot: Hotspot) => {
            this.openAdjustPanel(hotspot);
        });
    }

    private createAdjustPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.top = '50%';
        panel.style.left = '50%';
        panel.style.transform = 'translate(-50%, -50%)';
        panel.style.background = 'rgba(20, 20, 20, 0.95)';
        panel.style.border = '1px solid #555';
        panel.style.borderRadius = '8px';
        panel.style.padding = '20px';
        panel.style.color = 'white';
        panel.style.fontFamily = 'Arial, sans-serif';
        panel.style.fontSize = '14px';
        panel.style.zIndex = '10000';
        panel.style.minWidth = '300px';
        panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';

        return panel;
    }

    private openAdjustPanel(hotspot: Hotspot) {
        if (this.adjustPanel) {
            this.closeAdjustPanel();
        }

        this.currentHotspot = hotspot;
        this.adjustPanel = this.createAdjustPanel();

        // 标题
        const title = document.createElement('h3');
        title.textContent = `调整热点: ${hotspot.name}`;
        title.style.margin = '0 0 15px 0';
        title.style.color = '#ffcc00';
        this.adjustPanel.appendChild(title);

        // 名称输入
        this.addInputField('名称:', hotspot.name, (value) => {
            this.updateHotspot({ name: value });
        });

        // 位置输入
        this.addPositionInputs(hotspot.position);

        // 大小输入
        this.addInputField('大小:', hotspot.size.toString(), (value) => {
            const size = parseFloat(value);
            if (!isNaN(size) && size > 0) {
                this.updateHotspot({ size });
            }
        });

        // 跳转目标选择
        this.addTargetSelector(hotspot.targetSplatName);

        // 按钮区域
        const buttonArea = document.createElement('div');
        buttonArea.style.marginTop = '20px';
        buttonArea.style.display = 'flex';
        buttonArea.style.gap = '10px';
        buttonArea.style.justifyContent = 'flex-end';

        // 删除按钮
        const deleteBtn = this.createButton('删除', '#ff4444', () => {
            if (confirm(`确定要删除热点 "${hotspot.name}" 吗？`)) {
                this.events.fire('hotspots.remove', hotspot.id);
                this.closeAdjustPanel();
            }
        });

        // 关闭按钮
        const closeBtn = this.createButton('关闭', '#666', () => {
            this.closeAdjustPanel();
        });

        buttonArea.appendChild(deleteBtn);
        buttonArea.appendChild(closeBtn);
        this.adjustPanel.appendChild(buttonArea);

        // 添加到页面
        document.body.appendChild(this.adjustPanel);

        // 点击外部关闭
        setTimeout(() => {
            const clickOutside = (event: MouseEvent) => {
                if (this.adjustPanel && !this.adjustPanel.contains(event.target as Node)) {
                    this.closeAdjustPanel();
                    document.removeEventListener('click', clickOutside);
                }
            };
            document.addEventListener('click', clickOutside);
        }, 100);
    }

    private addInputField(label: string, defaultValue: string, onChange: (value: string) => void) {
        const container = document.createElement('div');
        container.style.marginBottom = '10px';

        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.style.display = 'block';
        labelElement.style.marginBottom = '5px';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = defaultValue;
        input.style.width = '100%';
        input.style.padding = '6px';
        input.style.background = '#333';
        input.style.border = '1px solid #555';
        input.style.borderRadius = '4px';
        input.style.color = 'white';
        input.style.boxSizing = 'border-box';

        input.addEventListener('input', () => {
            onChange(input.value);
        });

        container.appendChild(labelElement);
        container.appendChild(input);
        this.adjustPanel!.appendChild(container);
    }

    private addPositionInputs(position: Vec3) {
        const container = document.createElement('div');
        container.style.marginBottom = '10px';

        const label = document.createElement('label');
        label.textContent = '位置:';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        container.appendChild(label);

        const positionContainer = document.createElement('div');
        positionContainer.style.display = 'flex';
        positionContainer.style.gap = '5px';

        const axes = ['X', 'Y', 'Z'];
        const values = [position.x, position.y, position.z];

        axes.forEach((axis, index) => {
            const axisContainer = document.createElement('div');
            axisContainer.style.flex = '1';

            const axisLabel = document.createElement('span');
            axisLabel.textContent = axis;
            axisLabel.style.fontSize = '12px';
            axisLabel.style.color = '#ccc';

            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.1';
            input.value = values[index].toFixed(2);
            input.style.width = '100%';
            input.style.padding = '4px';
            input.style.background = '#333';
            input.style.border = '1px solid #555';
            input.style.borderRadius = '4px';
            input.style.color = 'white';
            input.style.fontSize = '12px';
            input.style.boxSizing = 'border-box';

            input.addEventListener('input', () => {
                const newPosition = new Vec3(position.x, position.y, position.z);
                const value = parseFloat(input.value);
                if (!isNaN(value)) {
                    if (index === 0) newPosition.x = value;
                    else if (index === 1) newPosition.y = value;
                    else newPosition.z = value;
                    
                    this.updateHotspot({ position: newPosition });
                }
            });

            axisContainer.appendChild(axisLabel);
            axisContainer.appendChild(input);
            positionContainer.appendChild(axisContainer);
        });

        container.appendChild(positionContainer);
        this.adjustPanel!.appendChild(container);
    }

    private addTargetSelector(currentTarget?: string) {
        const container = document.createElement('div');
        container.style.marginBottom = '10px';

        const label = document.createElement('label');
        label.textContent = '跳转目标:';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        container.appendChild(label);

        const select = document.createElement('select');
        select.style.width = '100%';
        select.style.padding = '6px';
        select.style.background = '#333';
        select.style.border = '1px solid #555';
        select.style.borderRadius = '4px';
        select.style.color = 'white';
        select.style.boxSizing = 'border-box';

        // 无跳转选项
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '无跳转';
        select.appendChild(noneOption);

        // 获取所有PLY文件
        const allSplats = this.events.invoke('scene.allSplats') as Splat[] || [];
        allSplats.forEach(splat => {
            const option = document.createElement('option');
            option.value = splat.name;
            option.textContent = splat.name;
            if (splat.name === currentTarget) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.addEventListener('change', () => {
            const targetSplatName = select.value || undefined;
            this.updateHotspot({ targetSplatName });
        });

        container.appendChild(select);
        this.adjustPanel!.appendChild(container);
    }

    private createButton(text: string, color: string, onClick: () => void): HTMLElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.padding = '8px 16px';
        button.style.background = color;
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.style.fontSize = '12px';

        button.addEventListener('click', onClick);
        
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '0.8';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
        });

        return button;
    }

    private updateHotspot(updates: Partial<Hotspot>) {
        if (this.currentHotspot) {
            this.events.fire('hotspots.update', this.currentHotspot.id, updates);
            // 更新当前热点引用
            Object.assign(this.currentHotspot, updates);
        }
    }

    private closeAdjustPanel() {
        if (this.adjustPanel) {
            document.body.removeChild(this.adjustPanel);
            this.adjustPanel = null;
            this.currentHotspot = null;
        }
    }

    public destroy() {
        this.closeAdjustPanel();
    }
}

export { HotspotAdjuster }; 