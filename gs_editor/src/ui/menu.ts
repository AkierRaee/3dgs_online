import { Container, Element, Label, Button } from 'pcui';
import { Vec3 } from 'playcanvas';

import { Events } from '../events';
import { localize } from './localization';
import { MenuPanel } from './menu-panel';
import arrowSvg from './svg/arrow.svg';
import collapseSvg from './svg/collapse.svg';
import selectDelete from './svg/delete.svg';
import sceneExport from './svg/export.svg';
import sceneImport from './svg/import.svg';
import sceneNew from './svg/new.svg';
import sceneOpen from './svg/open.svg';
import logoSvg from './svg/playcanvas-logo.svg';
import scenePublish from './svg/publish.svg';
import sceneSave from './svg/save.svg';
import selectAll from './svg/select-all.svg';
import selectDuplicate from './svg/select-duplicate.svg';
import selectInverse from './svg/select-inverse.svg';
import selectLock from './svg/select-lock.svg';
import selectNone from './svg/select-none.svg';
import selectSeparate from './svg/select-separate.svg';
import selectUnlock from './svg/select-unlock.svg';

const createSvg = (svgString: string) => {
    const decodedStr = decodeURIComponent(svgString.substring('data:image/svg+xml,'.length));
    return new Element({
        dom: new DOMParser().parseFromString(decodedStr, 'image/svg+xml').documentElement
    });
};

class Menu extends Container {
    constructor(events: Events, args = {}) {
        args = {
            ...args,
            id: 'menu'
        };

        super(args);

        const menubar = new Container({
            id: 'menu-bar'
        });

        menubar.dom.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });

        const iconDom = document.createElement('img');
        iconDom.src = logoSvg;
        iconDom.setAttribute('id', 'app-icon');
        iconDom.addEventListener('pointerdown', (event) => {
            window.open('https://playcanvas.com', '_blank').focus();
        });

        const icon = new Element({
            dom: iconDom
        });

        const scene = new Label({
            text: localize('file'),
            class: 'menu-option'
        });

        const render = new Label({
            text: localize('render'),
            class: 'menu-option'
        });

        const selection = new Label({
            text: localize('select'),
            class: 'menu-option'
        });

        const help = new Label({
            text: localize('help'),
            class: 'menu-option'
        });

        // 添加热点菜单选项
        const hotspots = new Label({
            text: '🎯 热点',
            class: 'menu-option'
        });

        const toggleCollapsed = () => {
            document.body.classList.toggle('collapsed');
        };

        // collapse menu on mobile
        if (document.body.clientWidth < 600) {
            toggleCollapsed();
        }

        const collapse = createSvg(collapseSvg);
        collapse.dom.classList.add('menu-icon');
        collapse.dom.setAttribute('id', 'menu-collapse');
        collapse.dom.addEventListener('click', toggleCollapsed);

        const arrow = createSvg(arrowSvg);
        arrow.dom.classList.add('menu-icon');
        arrow.dom.setAttribute('id', 'menu-arrow');
        arrow.dom.addEventListener('click', toggleCollapsed);

        const buttonsContainer = new Container({
            id: 'menu-bar-options'
        });
        buttonsContainer.append(scene);
        buttonsContainer.append(selection);
        buttonsContainer.append(render);
        buttonsContainer.append(hotspots);
        buttonsContainer.append(help);
        buttonsContainer.append(collapse);
        buttonsContainer.append(arrow);

        menubar.append(icon);
        menubar.append(buttonsContainer);

        const exportMenuPanel = new MenuPanel([{
            text: localize('file.export.ply'),
            icon: createSvg(sceneExport),
            isEnabled: () => !events.invoke('scene.empty'),
            onSelect: () => events.invoke('scene.export', 'ply')
        }, {
            text: localize('file.export.compressed-ply'),
            icon: createSvg(sceneExport),
            isEnabled: () => !events.invoke('scene.empty'),
            onSelect: () => events.invoke('scene.export', 'compressed-ply')
        }, {
            text: localize('file.export.splat'),
            icon: createSvg(sceneExport),
            isEnabled: () => !events.invoke('scene.empty'),
            onSelect: () => events.invoke('scene.export', 'splat')
        }, {
            // separator
        }, {
            text: localize('file.export.viewer'),
            icon: createSvg(sceneExport),
            isEnabled: () => !events.invoke('scene.empty'),
            onSelect: () => events.invoke('scene.export', 'viewer')
        }]);

        const fileMenuPanel = new MenuPanel([{
            text: localize('file.new'),
            icon: createSvg(sceneNew),
            isEnabled: () => !events.invoke('scene.empty'),
            onSelect: () => events.invoke('doc.new')
        }, {
            text: localize('file.open'),
            icon: createSvg(sceneOpen),
            onSelect: async () => {
                await events.invoke('doc.open');
            }
        }, {
            // separator
        }, {
            text: localize('file.save'),
            icon: createSvg(sceneSave),
            isEnabled: () => events.invoke('doc.name'),
            onSelect: async () => await events.invoke('doc.save')
        }, {
            text: localize('file.save-as'),
            icon: createSvg(sceneSave),
            isEnabled: () => !events.invoke('scene.empty'),
            onSelect: async () => await events.invoke('doc.saveAs')
        }, {
            // separator
        }, {
            text: localize('file.import'),
            icon: createSvg(sceneImport),
            onSelect: async () => {
                await events.invoke('scene.import');
            }
        }, {
            text: localize('file.export'),
            icon: createSvg(sceneExport),
            subMenu: exportMenuPanel
        }, {
            text: localize('file.publish'),
            icon: createSvg(scenePublish),
            isEnabled: () => !events.invoke('scene.empty'),
            onSelect: async () => await events.invoke('show.publishSettingsDialog')
        }]);

        const selectionMenuPanel = new MenuPanel([{
            text: localize('select.all'),
            icon: createSvg(selectAll),
            extra: 'Ctrl + A',
            onSelect: () => events.fire('select.all')
        }, {
            text: localize('select.none'),
            icon: createSvg(selectNone),
            extra: 'Shift + A',
            onSelect: () => events.fire('select.none')
        }, {
            text: localize('select.invert'),
            icon: createSvg(selectInverse),
            extra: 'Ctrl + I',
            onSelect: () => events.fire('select.invert')
        }, {
            // separator
        }, {
            text: localize('select.lock'),
            icon: createSvg(selectLock),
            extra: 'H',
            isEnabled: () => events.invoke('selection.splats'),
            onSelect: () => events.fire('select.hide')
        }, {
            text: localize('select.unlock'),
            icon: createSvg(selectUnlock),
            extra: 'U',
            onSelect: () => events.fire('select.unhide')
        }, {
            text: localize('select.delete'),
            icon: createSvg(selectDelete),
            extra: 'Delete',
            isEnabled: () => events.invoke('selection.splats'),
            onSelect: () => events.fire('select.delete')
        }, {
            text: localize('select.reset'),
            onSelect: () => events.fire('scene.reset')
        }, {
            // separator
        }, {
            text: localize('select.duplicate'),
            icon: createSvg(selectDuplicate),
            isEnabled: () => events.invoke('selection.splats'),
            onSelect: () => events.fire('select.duplicate')
        }, {
            text: localize('select.separate'),
            icon: createSvg(selectSeparate),
            isEnabled: () => events.invoke('selection.splats'),
            onSelect: () => events.fire('select.separate')
        }]);

        const renderMenuPanel = new MenuPanel([{
            text: localize('render.image'),
            icon: createSvg(sceneExport),
            onSelect: async () => await events.invoke('show.imageSettingsDialog')
        }, {
            text: localize('render.video'),
            icon: createSvg(sceneExport),
            onSelect: async () => await events.invoke('show.videoSettingsDialog')
        }, {
            // separator
        }, {
            text: localize('dlss.header'),
            icon: 'E164', // gear icon
            onSelect: async () => await events.invoke('show.dlssSettingsDialog')
        }]);

        const helpMenuPanel = new MenuPanel([{
            text: localize('help.shortcuts'),
            icon: 'E136',
            onSelect: () => events.fire('show.shortcuts')
        }, {
            text: localize('help.user-guide'),
            icon: 'E232',
            onSelect: () => window.open('https://github.com/playcanvas/supersplat/wiki', '_blank').focus()
        }, {
            text: localize('help.log-issue'),
            icon: 'E336',
            onSelect: () => window.open('https://github.com/playcanvas/supersplat/issues', '_blank').focus()
        }, {
            text: localize('help.github-repo'),
            icon: 'E259',
            onSelect: () => window.open('https://github.com/playcanvas/supersplat', '_blank').focus()
        }, {
            // separator
        }, {
            text: localize('help.basics-video'),
            icon: 'E261',
            onSelect: () => window.open('https://youtu.be/MwzaEM2I55I', '_blank').focus()
        }, {
            // separator
        }, {
            text: localize('help.discord'),
            icon: 'E233',
            onSelect: () => window.open('https://discord.gg/T3pnhRTTAY', '_blank').focus()
        }, {
            text: localize('help.forum'),
            icon: 'E432',
            onSelect: () => window.open('https://forum.playcanvas.com', '_blank').focus()
        }, {
            // separator
        }, {
            text: localize('help.about'),
            icon: 'E138',
            onSelect: () => events.invoke('show.about')
        }]);

        // 创建热点菜单面板
        const hotspotsMenuPanel = new MenuPanel([{
            text: '添加热点',
            icon: 'E164',
            onSelect: () => {
                try {
                    // 检查当前选择状态
                    const currentSelection = events.invoke('selection');
                    
                    if (!currentSelection) {
                        alert('请先在左侧列表中选择一个PLY文件');
                        return;
                    }
                    
                    // 创建简单的热点添加对话框
                    const name = prompt('请输入热点名称:', '新热点');
                    if (name) {
                        const x = parseFloat(prompt('X坐标:', '0') || '0');
                        const y = parseFloat(prompt('Y坐标:', '0') || '0');
                        const z = parseFloat(prompt('Z坐标:', '0') || '0');
                        const size = parseFloat(prompt('热点大小:', '1.0') || '1.0');
                        
                        events.fire('hotspots.add', {
                            name: name,
                            position: new Vec3(x, y, z),
                            size: size, // 移除大小限制
                            description: '',
                            visible: true
                        });
                    }
                } catch (error) {
                    console.error('添加热点失败', error);
                    alert('添加热点失败: ' + error.message);
                }
            }
        }, {
            text: '编辑热点',
            icon: 'E125',
            onSelect: () => {
                try {
                    const hotspots = events.invoke('hotspots.list') || [];
                    if (hotspots.length === 0) {
                        alert('当前没有热点，请先添加热点');
                        return;
                    }
                    
                    // 显示所有热点供选择
                    let hotspotList = '请选择要编辑的热点:\n';
                    hotspots.forEach((hotspot: any, index: number) => {
                        hotspotList += `${index + 1}. ${hotspot.name} (大小: ${hotspot.size})\n`;
                    });
                    
                    const choice = prompt(hotspotList + '\n请输入热点编号:');
                    const index = parseInt(choice) - 1;
                    
                    if (index >= 0 && index < hotspots.length) {
                        const hotspot = hotspots[index];
                        
                        // 编辑各项属性
                        const newName = prompt(`编辑名称 (当前: "${hotspot.name}"):`, hotspot.name);
                        if (!newName) return;
                        
                        const newX = parseFloat(prompt(`编辑X坐标 (当前: ${hotspot.position.x}):`, hotspot.position.x.toString()) || hotspot.position.x.toString());
                        const newY = parseFloat(prompt(`编辑Y坐标 (当前: ${hotspot.position.y}):`, hotspot.position.y.toString()) || hotspot.position.y.toString());
                        const newZ = parseFloat(prompt(`编辑Z坐标 (当前: ${hotspot.position.z}):`, hotspot.position.z.toString()) || hotspot.position.z.toString());
                        const newSize = parseFloat(prompt(`编辑大小 (当前: ${hotspot.size}):`, hotspot.size.toString()) || hotspot.size.toString());
                        
                        events.fire('hotspots.update', hotspot.id, {
                            name: newName,
                            position: new Vec3(newX, newY, newZ),
                            size: newSize
                        });
                        
                        alert(`热点 "${newName}" 已更新`);
                    } else {
                        alert('无效的热点编号');
                    }
                } catch (error) {
                    console.error('编辑热点失败', error);
                    alert('编辑热点失败');
                }
            }
        }, {
            text: '设置跳转目标',
            icon: 'E127',
            onSelect: () => {
                try {
                    const hotspots = events.invoke('hotspots.list') || [];
                    if (hotspots.length === 0) {
                        alert('当前没有热点，请先添加热点');
                        return;
                    }
                    
                    // 获取所有PLY列表
                    const allSplats = events.invoke('scene.allSplats') || [];
                    if (allSplats.length === 0) {
                        alert('没有可用的PLY文件');
                        return;
                    }
                    
                    // 显示热点选择
                    let hotspotList = '请选择要设置跳转的热点:\n';
                    hotspots.forEach((hotspot: any, index: number) => {
                        const target = hotspot.targetSplatName ? `-> ${hotspot.targetSplatName}` : '(无跳转)';
                        hotspotList += `${index + 1}. ${hotspot.name} ${target}\n`;
                    });
                    
                    const hotspotChoice = prompt(hotspotList + '\n请输入热点编号:');
                    const hotspotIndex = parseInt(hotspotChoice) - 1;
                    
                    if (hotspotIndex >= 0 && hotspotIndex < hotspots.length) {
                        const hotspot = hotspots[hotspotIndex];
                        
                        // 显示PLY选择
                        let splatList = '请选择跳转目标PLY:\n0. 取消跳转\n';
                        allSplats.forEach((splat: any, index: number) => {
                            splatList += `${index + 1}. ${splat.name}\n`;
                        });
                        
                        const splatChoice = prompt(splatList + '\n请输入PLY编号:');
                        const splatIndex = parseInt(splatChoice) - 1;
                        
                        let targetSplatName = undefined;
                        if (splatIndex >= 0 && splatIndex < allSplats.length) {
                            targetSplatName = allSplats[splatIndex].name;
                        } else if (parseInt(splatChoice) === 0) {
                            targetSplatName = undefined; // 取消跳转
                        } else {
                            alert('无效的PLY编号');
                            return;
                        }
                        
                        events.fire('hotspots.update', hotspot.id, {
                            targetSplatName: targetSplatName
                        });
                        
                        if (targetSplatName) {
                            alert(`热点 "${hotspot.name}" 的跳转目标已设置为 "${targetSplatName}"`);
                        } else {
                            alert(`热点 "${hotspot.name}" 的跳转已取消`);
                        }
                    } else {
                        alert('无效的热点编号');
                    }
                } catch (error) {
                    console.error('设置跳转目标失败', error);
                    alert('设置跳转目标失败');
                }
            }
        }, {
            text: '删除热点',
            icon: 'E216',
            onSelect: () => {
                try {
                    const hotspots = events.invoke('hotspots.list') || [];
                    if (hotspots.length === 0) {
                        alert('当前没有热点');
                        return;
                    }
                    
                    // 显示所有热点供选择
                    let hotspotList = '请选择要删除的热点:\n';
                    hotspots.forEach((hotspot: any, index: number) => {
                        hotspotList += `${index + 1}. ${hotspot.name}\n`;
                    });
                    
                    const choice = prompt(hotspotList + '\n请输入热点编号:');
                    const index = parseInt(choice) - 1;
                    
                    if (index >= 0 && index < hotspots.length) {
                        const hotspot = hotspots[index];
                        
                        if (confirm(`确定要删除热点 "${hotspot.name}" 吗？`)) {
                            events.fire('hotspots.remove', hotspot.id);
                            alert(`热点 "${hotspot.name}" 已删除`);
                        }
                    } else {
                        alert('无效的热点编号');
                    }
                } catch (error) {
                    console.error('删除热点失败', error);
                    alert('删除热点失败');
                }
            }
        }, {
            text: '快速调整面板',
            icon: 'E126',
            onSelect: () => {
                try {
                    const hotspots = events.invoke('hotspots.list') || [];
                    if (hotspots.length === 0) {
                        alert('当前没有热点，请先添加热点');
                        return;
                    }
                    
                    alert('右键点击任意热点可打开详细调整面板\n\n功能说明:\n• 左键点击热点：执行跳转\n• 右键点击热点：打开调整面板\n• 调整面板支持修改：名称、位置、大小、跳转目标');
                } catch (error) {
                    console.error('显示帮助失败', error);
                }
            }
        }, {
            text: '调节热点大小',
            icon: 'E161',
            onSelect: () => {
                try {
                    const hotspots = events.invoke('hotspots.list') || [];
                    if (hotspots.length === 0) {
                        alert('当前没有热点，请先添加热点');
                        return;
                    }
                    
                    // 显示所有热点供选择
                    let hotspotList = '请选择要调节的热点:\n';
                    hotspots.forEach((hotspot: any, index: number) => {
                        hotspotList += `${index + 1}. ${hotspot.name} (当前大小: ${hotspot.size})\n`;
                    });
                    
                    const choice = prompt(hotspotList + '\n请输入热点编号:');
                    const index = parseInt(choice) - 1;
                    
                    if (index >= 0 && index < hotspots.length) {
                        const hotspot = hotspots[index];
                        const newSize = parseFloat(prompt(
                            `调节 "${hotspot.name}" 的大小:\n当前大小: ${hotspot.size}\n请输入新大小:`, 
                            hotspot.size.toString()
                        ) || hotspot.size.toString());
                        
                        if (newSize !== hotspot.size) {
                            events.fire('hotspots.update', hotspot.id, {
                                size: newSize // 移除大小限制
                            });
                            alert(`"${hotspot.name}" 的大小已更新为 ${newSize}`);
                        }
                    } else {
                        alert('无效的热点编号');
                    }
                } catch (error) {
                    console.error('调节热点大小失败', error);
                    alert('调节热点大小失败');
                }
            }
        }, {
            text: '保存热点',
            icon: 'E114',
            onSelect: () => {
                try {
                    events.fire('hotspots.save');
                } catch (error) {
                    console.error('保存热点失败', error);
                    alert('保存热点失败');
                }
            }
        }, {
            text: '加载热点',
            icon: 'E117',
            onSelect: () => {
                try {
                    events.fire('hotspots.load');
                } catch (error) {
                    console.error('加载热点失败', error);
                    alert('加载热点失败');
                }
            }
        }]);

        this.append(menubar);
        this.append(fileMenuPanel);
        this.append(exportMenuPanel);
        this.append(selectionMenuPanel);
        this.append(renderMenuPanel);
        this.append(hotspotsMenuPanel);
        this.append(helpMenuPanel);

        const options: { dom: HTMLElement, menuPanel: MenuPanel }[] = [{
            dom: scene.dom,
            menuPanel: fileMenuPanel
        }, {
            dom: selection.dom,
            menuPanel: selectionMenuPanel
        }, {
            dom: render.dom,
            menuPanel: renderMenuPanel
        }, {
            dom: hotspots.dom,
            menuPanel: hotspotsMenuPanel
        }, {
            dom: help.dom,
            menuPanel: helpMenuPanel
        }];

        options.forEach((option) => {
            const activate = () => {
                option.menuPanel.position(option.dom, 'bottom', 2);
                options.forEach((opt) => {
                    opt.menuPanel.hidden = opt !== option;
                });
            };

            option.dom.addEventListener('pointerdown', (event: PointerEvent) => {
                if (!option.menuPanel.hidden) {
                    option.menuPanel.hidden = true;
                } else {
                    activate();
                }
            });

            option.dom.addEventListener('pointerenter', (event: PointerEvent) => {
                if (!options.every(opt => opt.menuPanel.hidden)) {
                    activate();
                }
            });
        });

        const checkEvent = (event: PointerEvent) => {
            if (!this.dom.contains(event.target as Node)) {
                options.forEach((opt) => {
                    opt.menuPanel.hidden = true;
                });
            }
        };

        window.addEventListener('pointerdown', checkEvent, true);
        window.addEventListener('pointerup', checkEvent, true);
    }
}

export { Menu };
