import { GraphicsDevice } from 'playcanvas';
import { Events } from './events';

/**
 * Simplified DLSS-like functionality for immediate visual effect demonstration
 * This focuses on performance scaling and visual feedback rather than complex neural processing
 */
class SimpleDLSS {
    private device: GraphicsDevice;
    private events: Events;
    private enabled: boolean = false;
    private qualityMode: 'performance' | 'balanced' | 'quality' | 'ultra' = 'quality';
    private originalResolution: { width: number; height: number } | null = null;
    private isUpdatingResolution: boolean = false;
    private performanceMetrics = {
        frameCount: 0,
        lastFrameTime: 0,
        averageFPS: 0
    };

    constructor(device: GraphicsDevice, events: Events) {
        this.device = device;
        this.events = events;
        this.originalResolution = {
            width: device.canvas.width,
            height: device.canvas.height
        };
    }

    setEnabled(enabled: boolean) {
        console.log(`🔧 DLSS: setEnabled called with: ${enabled} (current: ${this.enabled})`);
        this.enabled = enabled;
        this.applyResolutionScaling();
        this.logStatus();
    }

    setQualityMode(mode: 'performance' | 'balanced' | 'quality' | 'ultra') {
        this.qualityMode = mode;
        if (this.enabled) {
            this.applyResolutionScaling();
        }
        this.logStatus();
    }

    private getScaleFactor(): number {
        switch (this.qualityMode) {
            case 'performance': return 2.0;  // Most aggressive scaling
            case 'balanced': return 1.7;
            case 'quality': return 1.5;     // Least aggressive scaling
            case 'ultra': return 2.3;       // Maximum performance
            default: return 1.5;
        }
    }

    private applyResolutionScaling() {
        if (!this.originalResolution || this.isUpdatingResolution) return;

        this.isUpdatingResolution = true;
        const canvas = this.device.canvas;
        
        if (this.enabled) {
            const scaleFactor = this.getScaleFactor();
            const newWidth = Math.floor(this.originalResolution.width / scaleFactor);
            const newHeight = Math.floor(this.originalResolution.height / scaleFactor);
            
            // Apply resolution scaling with visual feedback
            canvas.style.imageRendering = 'auto'; // Enable browser upscaling
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            console.log(`🎮 DLSS: Scaled resolution from ${this.originalResolution.width}x${this.originalResolution.height} to ${newWidth}x${newHeight} (${scaleFactor.toFixed(1)}x scaling)`);
            
            // Add visual border to show DLSS is active
            canvas.style.border = '2px solid #00ff00';
            canvas.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
            
            // Show performance boost notification
            this.showNotification(`DLSS ${this.qualityMode.toUpperCase()} 已启用 - 预期性能提升 ${Math.round((scaleFactor - 1) * 100)}%`);
            
        } else {
            // Restore original resolution
            canvas.width = this.originalResolution.width;
            canvas.height = this.originalResolution.height;
            canvas.style.imageRendering = 'auto';
            canvas.style.border = '';
            canvas.style.boxShadow = '';
            
            console.log(`🖥️ DLSS: Restored to native resolution ${this.originalResolution.width}x${this.originalResolution.height}`);
            this.showNotification('DLSS 已禁用 - 原生分辨率渲染');
        }

        // Note: Avoid calling resizeCanvas to prevent triggering canvas resize events
        // The browser will handle the scaling automatically
        
        this.isUpdatingResolution = false;
    }

    private logStatus() {
        if (this.enabled) {
            const scaleFactor = this.getScaleFactor();
            console.log(`✅ DLSS Status: ENABLED`);
            console.log(`📊 Quality Mode: ${this.qualityMode.toUpperCase()}`);
            console.log(`🔧 Scale Factor: ${scaleFactor.toFixed(1)}x`);
            console.log(`⚡ Performance Boost: ~${Math.round((scaleFactor - 1) * 100)}%`);
            console.log(`🎯 Current Resolution: ${this.device.canvas.width}x${this.device.canvas.height}`);
        } else {
            console.log(`❌ DLSS Status: DISABLED (Native Resolution)`);
        }
    }

    private showNotification(message: string) {
        // Create a temporary notification overlay
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border-left: 4px solid #00ff00;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    updatePerformanceMetrics() {
        const now = performance.now();
        if (this.performanceMetrics.lastFrameTime > 0) {
            const deltaTime = now - this.performanceMetrics.lastFrameTime;
            const fps = 1000 / deltaTime;
            
            // Simple moving average
            this.performanceMetrics.averageFPS = this.performanceMetrics.averageFPS * 0.9 + fps * 0.1;
        }
        this.performanceMetrics.lastFrameTime = now;
        this.performanceMetrics.frameCount++;
    }

    getPerformanceMetrics() {
        return {
            enabled: this.enabled,
            qualityMode: this.qualityMode,
            scaleFactor: this.getScaleFactor(),
            frameCount: this.performanceMetrics.frameCount,
            averageFPS: Math.round(this.performanceMetrics.averageFPS),
            currentResolution: `${this.device.canvas.width}x${this.device.canvas.height}`,
            originalResolution: this.originalResolution ? `${this.originalResolution.width}x${this.originalResolution.height}` : 'Unknown'
        };
    }

    destroy() {
        if (this.enabled) {
            this.setEnabled(false);
        }
    }
}

export { SimpleDLSS }; 