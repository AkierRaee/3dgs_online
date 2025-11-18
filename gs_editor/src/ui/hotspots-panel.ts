import { Container, Element, Label, Panel, Button } from 'pcui';
import { Events } from '../events';
import { Splat } from '../splat';
import { Hotspot } from '../hotspots';
import { Tooltips } from './tooltips';
import { Vec3 } from 'playcanvas';

const createHotspotsPanel = (events: Events, tooltips: Tooltips): Panel => {
    const panel = new Panel({
        headerText: '🎯 热点',
        collapsible: true,
        collapsed: false
    });

    // 热点列表容器
    const hotspotsList = new Container({
        class: 'hotspots-list'
    });

    // 控制按钮区域
    const controls = new Container({
        class: 'hotspots-controls'
    });

    // 添加热点按钮
    const addButton = new Button({
        text: '+ 添加热点',
        class: 'button button-primary'
    });

    // 保存按钮
    const saveButton = new Button({
        text: '💾 保存',
        class: 'button'
    });

    // 加载按钮
    const loadButton = new Button({
        text: '📁 加载',
        class: 'button'
    });

    controls.append(addButton);
    controls.append(saveButton);
    controls.append(loadButton);

    panel.append(controls);
    panel.append(hotspotsList);

    // 简化的创建热点对话框
    const createSimpleHotspotDialog = (onSave?: (hotspotData: Omit<Hotspot, 'id'>) => void): HTMLElement => {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2a2a2a;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 20px;
            width: 350px;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
        `;

        const title = document.createElement('h3');
        title.textContent = '添加热点';
        title.style.cssText = 'margin: 0 0 15px 0; color: #fff;';

        const nameInput = document.createElement('input');
        nameInput.placeholder = '热点名称';
        nameInput.style.cssText = 'width: 100%; margin: 10px 0; padding: 8px; background: #333; border: 1px solid #555; color: white; border-radius: 4px;';

        const posLabel = document.createElement('div');
        posLabel.textContent = '位置坐标:';
        posLabel.style.cssText = 'margin: 10px 0 5px 0; color: #ccc;';

        const posContainer = document.createElement('div');
        posContainer.style.cssText = 'display: flex; gap: 5px; margin-bottom: 10px;';

        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.placeholder = 'X';
        xInput.value = '0';
        xInput.style.cssText = 'flex: 1; padding: 8px; background: #333; border: 1px solid #555; color: white; border-radius: 4px;';

        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.placeholder = 'Y';
        yInput.value = '0';
        yInput.style.cssText = 'flex: 1; padding: 8px; background: #333; border: 1px solid #555; color: white; border-radius: 4px;';

        const zInput = document.createElement('input');
        zInput.type = 'number';
        zInput.placeholder = 'Z';
        zInput.value = '0';
        zInput.style.cssText = 'flex: 1; padding: 8px; background: #333; border: 1px solid #555; color: white; border-radius: 4px;';

        posContainer.appendChild(xInput);
        posContainer.appendChild(yInput);
        posContainer.appendChild(zInput);

        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.placeholder = '大小';
        sizeInput.value = '1.0';
        sizeInput.step = '0.1';
        sizeInput.min = '0.1';
        sizeInput.style.cssText = 'width: 100%; margin: 10px 0; padding: 8px; background: #333; border: 1px solid #555; color: white; border-radius: 4px;';

        const descInput = document.createElement('textarea');
        descInput.placeholder = '描述（可选）';
        descInput.style.cssText = 'width: 100%; height: 60px; margin: 10px 0; padding: 8px; background: #333; border: 1px solid #555; color: white; border-radius: 4px; resize: vertical;';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.cssText = 'padding: 8px 16px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer;';
        cancelBtn.onclick = () => {
            document.body.removeChild(dialog);
        };

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '添加';
        saveBtn.style.cssText = 'padding: 8px 16px; background: #007ACC; color: white; border: none; border-radius: 4px; cursor: pointer;';
        saveBtn.onclick = () => {
            const hotspotData = {
                name: nameInput.value.trim() || '未命名热点',
                position: new Vec3(
                    parseFloat(xInput.value) || 0,
                    parseFloat(yInput.value) || 0,
                    parseFloat(zInput.value) || 0
                ),
                size: parseFloat(sizeInput.value) || 1.0,
                description: descInput.value.trim(),
                visible: true
            };

            if (onSave) {
                onSave(hotspotData);
            }

            document.body.removeChild(dialog);
        };

        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(saveBtn);

        dialog.appendChild(title);
        dialog.appendChild(nameInput);
        dialog.appendChild(posLabel);
        dialog.appendChild(posContainer);
        dialog.appendChild(sizeInput);
        dialog.appendChild(descInput);
        dialog.appendChild(buttonContainer);

        return dialog;
    };

    // 创建简化的热点列表项
    const createSimpleHotspotItem = (hotspot: Hotspot): Element => {
        const item = new Container({
            class: 'hotspot-item'
        });

        const header = new Container({
            class: 'hotspot-header',
            flex: true
        });

        const nameLabel = new Label({
            text: hotspot.name,
            class: 'hotspot-name'
        });

        const deleteButton = new Button({
            text: '🗑️',
            class: 'button button-small'
        });

        header.append(nameLabel);
        header.append(deleteButton);

        const positionInfo = new Label({
            text: `坐标: (${hotspot.position.x.toFixed(1)}, ${hotspot.position.y.toFixed(1)}, ${hotspot.position.z.toFixed(1)})`,
            class: 'hotspot-info'
        });

        item.append(header);
        item.append(positionInfo);

        // 删除事件
        deleteButton.on('click', () => {
            if (confirm(`确定要删除热点 "${hotspot.name}" 吗？`)) {
                events.fire('hotspots.remove', hotspot.id);
            }
        });

        // 注册工具提示
        tooltips.register(deleteButton, '删除热点', 'top');

        return item;
    };

    // 更新热点列表
    const updateHotspotsList = () => {
        hotspotsList.clear();

        try {
            const hotspots = events.invoke('hotspots.list') as Hotspot[];
            
            if (!hotspots || hotspots.length === 0) {
                const emptyMessage = new Label({
                    text: '暂无热点\n点击 "+ 添加热点" 开始创建',
                    class: 'empty-message'
                });
                hotspotsList.append(emptyMessage);
            } else {
                hotspots.forEach(hotspot => {
                    const item = createSimpleHotspotItem(hotspot);
                    hotspotsList.append(item);
                });
            }
        } catch (error) {
            console.warn('无法获取热点列表', error);
            const errorMessage = new Label({
                text: '无法加载热点列表',
                class: 'empty-message'
            });
            hotspotsList.append(errorMessage);
        }
    };

    // 事件监听
    addButton.on('click', () => {
        try {
            const dialog = createSimpleHotspotDialog((hotspotData) => {
                events.fire('hotspots.add', hotspotData);
            });
            document.body.appendChild(dialog);
        } catch (error) {
            console.error('创建热点对话框失败', error);
        }
    });

    saveButton.on('click', () => {
        try {
            events.fire('hotspots.save');
        } catch (error) {
            console.error('保存热点失败', error);
        }
    });

    loadButton.on('click', () => {
        try {
            events.fire('hotspots.load');
        } catch (error) {
            console.error('加载热点失败', error);
        }
    });

    // 监听热点更新事件
    events.on('hotspots.updated', () => {
        try {
            updateHotspotsList();
        } catch (error) {
            console.error('更新热点列表失败', error);
        }
    });

    events.on('hotspots.selectionChanged', () => {
        try {
            updateHotspotsList();
        } catch (error) {
            console.error('更新热点列表失败', error);
        }
    });

    events.on('selection.changed', () => {
        try {
            updateHotspotsList();
        } catch (error) {
            console.error('更新热点列表失败', error);
        }
    });

    // 注册工具提示
    tooltips.register(addButton, '添加新热点到当前选中的PLY', 'top');
    tooltips.register(saveButton, '保存当前PLY的热点到JSON文件', 'top');
    tooltips.register(loadButton, '从JSON文件加载热点到当前PLY', 'top');

    // 初始化列表
    try {
        updateHotspotsList();
    } catch (error) {
        console.error('初始化热点列表失败', error);
    }

    return panel;
};

export { createHotspotsPanel }; 