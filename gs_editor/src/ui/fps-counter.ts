import { Container, Label } from 'pcui';
import { Events } from '../events';
import { localize } from './localization';

class FPSCounter extends Container {
    private fpsLabel: Label;
    private events: Events;
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private fps: number = 0;
    private updateInterval: NodeJS.Timeout;
    private isVisible: boolean = true;
    private animationFrameId: number = 0;
    private frameHistory: number[] = [];
    private timeWindow: number = 1000; // 时间窗口：1秒（1000毫秒）

    constructor(events: Events, args = {}) {
        args = {
            ...args,
            id: 'fps-counter',
            class: 'fps-counter'
        };

        super(args);

        this.events = events;

        // Create FPS label
        this.fpsLabel = new Label({
            text: 'FPS: --',
            class: 'fps-label'
        });

        this.append(this.fpsLabel);

        // Start real-time FPS calculation using requestAnimationFrame
        this.startRealTimeFPSCalculation();

        // Update FPS display every 50ms for very responsive reading
        this.updateInterval = setInterval(() => {
            this.updateFPSDisplay();
        }, 50);

        // Allow toggling visibility
        this.dom.addEventListener('click', () => {
            this.toggleDetailed();
        });

        // Add keyboard shortcut to toggle FPS counter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F3' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                this.toggleVisibility();
            }
        });
    }

    private startRealTimeFPSCalculation() {
        const calculateFPS = () => {
            const now = performance.now();
            
            // 添加当前帧时间到历史记录
            this.frameHistory.push(now);
            
            // 移除超过时间窗口的旧帧数据（保留最近1秒内的帧）
            const cutoffTime = now - this.timeWindow;
            while (this.frameHistory.length > 0 && this.frameHistory[0] < cutoffTime) {
                this.frameHistory.shift();
            }
            
            // 计算FPS：最近1秒内的帧数
            if (this.frameHistory.length >= 2) {
                // FPS = 最近1秒内的帧数
                // 因为frameHistory包含了时间窗口内的所有帧，所以帧数就是length-1
                // 但为了更精确，我们使用实际的时间跨度
                const oldestTime = this.frameHistory[0];
                const newestTime = this.frameHistory[this.frameHistory.length - 1];
                const actualTimeSpan = newestTime - oldestTime;
                
                if (actualTimeSpan > 0) {
                    // 帧数除以实际时间跨度（秒），得到FPS
                    const frameCount = this.frameHistory.length - 1;
                    this.fps = (frameCount * 1000) / actualTimeSpan;
                }
            }
            
            this.frameCount++;
            this.lastFrameTime = now;
            
            // 继续下一帧
            this.animationFrameId = requestAnimationFrame(calculateFPS);
        };
        
        // 开始FPS计算循环
        this.animationFrameId = requestAnimationFrame(calculateFPS);
    }

    private updateFPSDisplay() {
        if (!this.isVisible) return;

        // 只有当有足够的帧数据时才显示FPS（至少需要0.1秒的数据）
        if (this.frameHistory.length < 2) {
            this.fpsLabel.text = 'FPS: --';
            return;
        }
        
        // 如果时间跨度太短，也等待更多数据
        const timeSpan = this.frameHistory[this.frameHistory.length - 1] - this.frameHistory[0];
        if (timeSpan < 100) { // 少于100ms的数据不够稳定
            this.fpsLabel.text = 'FPS: --';
            return;
        }

        // 使用平滑处理的FPS值
        const displayFPS = Math.max(0, Math.min(999, Math.round(this.fps)));
        let fpsText = `FPS: ${displayFPS}`;
        let fpsClass = 'fps-good';

        // Color coding based on FPS
        if (displayFPS < 30) {
            fpsClass = 'fps-poor';
        } else if (displayFPS < 60) {
            fpsClass = 'fps-fair';
        }

        // Check if DLSS is enabled and show additional info
        const dlssMetrics = this.events.invoke('dlss.getMetrics');
        if (dlssMetrics && dlssMetrics.enabled) {
            fpsText += ` | DLSS: ${dlssMetrics.qualityMode.toUpperCase()}`;
            fpsText += ` | ${dlssMetrics.currentResolution}`;
        }

        this.fpsLabel.text = fpsText;
        
        // Update CSS class for color coding
        this.fpsLabel.dom.className = this.fpsLabel.dom.className.replace(
            /fps-(good|fair|poor)/g, 
            ''
        );
        this.fpsLabel.dom.classList.add(fpsClass);
    }

    private toggleDetailed() {
        const dlssMetrics = this.events.invoke('dlss.getMetrics');
        
        if (dlssMetrics) {
            console.log('📊 FPS Counter - Detailed Performance Metrics:');
            console.log(`🎮 Current FPS: ${Math.round(this.fps)}`);
            console.log(`🖼️ Frame Count: ${this.frameCount}`);
            console.log(`⚡ DLSS Enabled: ${dlssMetrics.enabled}`);
            
            if (dlssMetrics.enabled) {
                console.log(`🔧 DLSS Mode: ${dlssMetrics.qualityMode.toUpperCase()}`);
                console.log(`📏 Scale Factor: ${dlssMetrics.scaleFactor}x`);
                console.log(`🎯 Render Resolution: ${dlssMetrics.currentResolution}`);
                console.log(`🖥️ Original Resolution: ${dlssMetrics.originalResolution}`);
                console.log(`⏱️ DLSS Frame Count: ${dlssMetrics.frameCount}`);
            }
        }

        // Show notification
        this.showNotification(localize('fps.metrics.logged'));
    }

    private toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.hidden = !this.isVisible;
        
        if (this.isVisible) {
            this.showNotification(localize('fps.enabled'));
        } else {
            this.showNotification(localize('fps.disabled'));
        }
    }

    private showNotification(message: string) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            pointer-events: none;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        super.destroy();
    }
}

export { FPSCounter }; 