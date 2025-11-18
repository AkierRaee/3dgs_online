import { Vec3 } from 'playcanvas';
import { Events } from './events';
import { Splat } from './splat';
import { ElementType } from './element';

export type Hotspot = {
    id: string;
    name: string;
    position: Vec3;
    size: number;
    description: string;
    targetSplatName?: string; // 目标PLY名称
    visible: boolean;
};

const registerHotspotsEvents = (events: Events) => {
    // 每个splat都有自己的热点数组
    const splatHotspots = new Map<Splat, Hotspot[]>();
    
    // 获取当前选中splat的热点
    const getCurrentSplatHotspots = (): Hotspot[] => {
        const selectedSplat = events.invoke('selection') as Splat;
        if (!selectedSplat) {
            return [];
        }
        
        if (!splatHotspots.has(selectedSplat)) {
            splatHotspots.set(selectedSplat, []);
        }
        
        return splatHotspots.get(selectedSplat)!;
    };

    // 生成唯一ID
    const generateId = (): string => {
        return 'hotspot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };

    // 添加热点
    const addHotspot = (hotspot: Omit<Hotspot, 'id'>): string => {
        const selectedSplat = events.invoke('selection') as Splat;
        if (!selectedSplat) {
            return '';
        }

        const newHotspot: Hotspot = {
            id: generateId(),
            ...hotspot
        };

        if (!splatHotspots.has(selectedSplat)) {
            splatHotspots.set(selectedSplat, []);
        }

        const hotspots = splatHotspots.get(selectedSplat)!;
        hotspots.push(newHotspot);

        // 触发热点更新事件
        events.fire('hotspots.updated');
        events.fire('hotspots.added', newHotspot);

        return newHotspot.id;
    };

    // 删除热点
    const removeHotspot = (id: string): boolean => {
        const selectedSplat = events.invoke('selection') as Splat;
        if (!selectedSplat) {
            return false;
        }

        const hotspots = splatHotspots.get(selectedSplat);
        if (!hotspots) {
            return false;
        }

        const index = hotspots.findIndex(h => h.id === id);
        if (index === -1) {
            return false;
        }

        const removedHotspot = hotspots.splice(index, 1)[0];
        events.fire('hotspots.updated');
        events.fire('hotspots.removed', removedHotspot);

        return true;
    };

    // 更新热点
    const updateHotspot = (id: string, updates: Partial<Hotspot>): boolean => {
        const selectedSplat = events.invoke('selection') as Splat;
        if (!selectedSplat) {
            return false;
        }

        const hotspots = splatHotspots.get(selectedSplat);
        if (!hotspots) {
            return false;
        }

        const hotspot = hotspots.find(h => h.id === id);
        if (!hotspot) {
            return false;
        }

        Object.assign(hotspot, updates);
        events.fire('hotspots.updated');
        events.fire('hotspots.hotspotUpdated', hotspot);

        return true;
    };

    // 获取所有热点（当前选中的splat）
    events.function('hotspots.list', () => {
        return getCurrentSplatHotspots();
    });

    // 获取所有splat的热点
    events.function('hotspots.allSplats', () => {
        const result = new Map<string, Hotspot[]>();
        splatHotspots.forEach((hotspots, splat) => {
            result.set(splat.name, hotspots);
        });
        return result;
    });

    // 添加热点事件
    events.on('hotspots.add', (hotspotData: Omit<Hotspot, 'id'>) => {
        addHotspot(hotspotData);
    });

    // 删除热点事件
    events.on('hotspots.remove', (id: string) => {
        removeHotspot(id);
    });

    // 更新热点事件
    events.on('hotspots.update', (id: string, updates: Partial<Hotspot>) => {
        updateHotspot(id, updates);
    });

    // 热点点击事件 - 跳转到目标PLY
    events.on('hotspots.clicked', (hotspot: Hotspot) => {
        if (hotspot.targetSplatName) {
            // 查找目标splat
            const allSplats = events.invoke('scene.allSplats') as Splat[];
            const targetSplat = allSplats.find(s => s.name === hotspot.targetSplatName);
            
            if (targetSplat) {
                // 模拟场景管理器的完整切换逻辑
                // 1. 设置所有PLY的可见性（只显示目标PLY）
                allSplats.forEach((splat) => {
                    const shouldBeVisible = splat === targetSplat;
                    splat.visible = shouldBeVisible;
                    // 触发可见性变化事件
                    events.fire('splat.visibility', splat);
                });
                
                // 2. 设置选择
                events.fire('selection', targetSplat);
                
                // 3. 自动开始播放时间轴
                setTimeout(() => {
                    events.fire('timeline.setPlaying', true);
                    console.log(`跳转成功：从热点 "${hotspot.name}" 跳转到 "${hotspot.targetSplatName}" 并自动开始播放`);
                }, 50); // 短暂延迟以确保选择状态已经更新
                
            } else {
                console.error(`跳转失败：找不到目标PLY "${hotspot.targetSplatName}"`);
            }
        } else {
            console.log(`热点 "${hotspot.name}" 没有设置跳转目标`);
        }
    });

    // 当选择变化时，触发热点更新
    events.on('selection.changed', () => {
        events.fire('hotspots.selectionChanged');
    });

    // 当splat被移除时，清理其热点数据
    events.on('scene.elementRemoved', (element: any) => {
        if (element.type === ElementType.splat) {
            splatHotspots.delete(element as Splat);
        }
    });

    // 序列化热点数据（用于项目保存）
    events.function('docSerialize.hotspots', (): any[] => {
        const result: any[] = [];
        
        splatHotspots.forEach((hotspots, splat) => {
            if (hotspots.length > 0) {
                result.push({
                    splatName: splat.name,
                    hotspots: hotspots.map(hotspot => ({
                        id: hotspot.id,
                        name: hotspot.name,
                        position: [hotspot.position.x, hotspot.position.y, hotspot.position.z],
                        size: hotspot.size,
                        description: hotspot.description,
                        targetSplatName: hotspot.targetSplatName,
                        visible: hotspot.visible
                    }))
                });
            }
        });

        return result;
    });

    // 反序列化热点数据（用于项目加载）
    events.function('docDeserialize.hotspots', (hotspotsData: any[]) => {
        if (!hotspotsData || hotspotsData.length === 0) {
            return;
        }

        // 延迟恢复，等待所有splat加载完成
        setTimeout(() => {
            const allSplats = events.invoke('scene.allSplats') as Splat[];
            
            hotspotsData.forEach((data: any) => {
                const splat = allSplats.find(s => s.name === data.splatName);
                if (splat && data.hotspots) {
                    const hotspots: Hotspot[] = data.hotspots.map((h: any) => ({
                        id: h.id,
                        name: h.name,
                        position: new Vec3(h.position[0], h.position[1], h.position[2]),
                        size: h.size,
                        description: h.description,
                        targetSplatName: h.targetSplatName,
                        visible: h.visible !== false // 默认为true
                    }));
                    
                    splatHotspots.set(splat, hotspots);
                }
            });

            events.fire('hotspots.updated');
        }, 100);
    });

    // 保存热点到JSON文件
    events.on('hotspots.save', () => {
        const selectedSplat = events.invoke('selection') as Splat;
        if (!selectedSplat) {
            events.invoke('showPopup', {
                type: 'error',
                header: '保存失败',
                message: '请先选择一个Splat对象'
            });
            return;
        }

        const hotspots = getCurrentSplatHotspots();
        if (hotspots.length === 0) {
            events.invoke('showPopup', {
                type: 'error',
                header: '保存失败',
                message: '当前选中的Splat没有热点数据'
            });
            return;
        }

        const data = {
            version: 1,
            splatName: selectedSplat.name,
            timestamp: new Date().toISOString(),
            hotspots: hotspots.map(hotspot => ({
                id: hotspot.id,
                name: hotspot.name,
                position: [hotspot.position.x, hotspot.position.y, hotspot.position.z],
                size: hotspot.size,
                description: hotspot.description,
                targetSplatName: hotspot.targetSplatName,
                visible: hotspot.visible
            }))
        };

        // 创建并下载JSON文件
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedSplat.name}_hotspots.json`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        events.invoke('showPopup', {
            type: 'info',
            header: '保存成功',
            message: `已保存 ${selectedSplat.name} 的 ${hotspots.length} 个热点\n文件名: ${selectedSplat.name}_hotspots.json`
        });
    });

    // 从JSON文件加载热点
    events.on('hotspots.load', () => {
        const selectedSplat = events.invoke('selection') as Splat;
        if (!selectedSplat) {
            events.invoke('showPopup', {
                type: 'error',
                header: '加载失败',
                message: '请先选择一个Splat对象'
            });
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const result = e.target?.result as string;
                    const data = JSON.parse(result);
                    
                    if (!data.hotspots || !Array.isArray(data.hotspots)) {
                        events.invoke('showPopup', {
                            type: 'error',
                            header: '加载失败',
                            message: '无效的热点文件格式'
                        });
                        return;
                    }

                    // 清除当前热点
                    splatHotspots.set(selectedSplat, []);

                    // 加载新热点
                    const newHotspots: Hotspot[] = data.hotspots.map((h: any) => ({
                        id: h.id || generateId(),
                        name: h.name,
                        position: new Vec3(h.position[0], h.position[1], h.position[2]),
                        size: h.size,
                        description: h.description,
                        targetSplatName: h.targetSplatName,
                        visible: h.visible !== false
                    }));

                    splatHotspots.set(selectedSplat, newHotspots);
                    events.fire('hotspots.updated');

                    events.invoke('showPopup', {
                        type: 'info',
                        header: '加载成功',
                        message: `已为 ${selectedSplat.name} 加载 ${newHotspots.length} 个热点`
                    });
                    
                } catch (error) {
                    events.invoke('showPopup', {
                        type: 'error',
                        header: '加载失败',
                        message: `文件解析错误: ${error.message || error}`
                    });
                }
            };
            reader.readAsText(file);
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    });
};

export { registerHotspotsEvents }; 