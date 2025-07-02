// tests/unit/components/ResourceMeter.test.js
// Comprehensive test suite for ResourceMeter component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ResourceMeter from '../../../public/js/components/ResourceMeter.js';

// Mock Canvas API for testing
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    scale: vi.fn(),
    set strokeStyle(value) { this._strokeStyle = value; },
    get strokeStyle() { return this._strokeStyle; },
    set fillStyle(value) { this._fillStyle = value; },
    get fillStyle() { return this._fillStyle; },
    set lineWidth(value) { this._lineWidth = value; },
    get lineWidth() { return this._lineWidth; },
    set lineCap(value) { this._lineCap = value; },
    get lineCap() { return this._lineCap; },
    set font(value) { this._font = value; },
    get font() { return this._font; },
    set textAlign(value) { this._textAlign = value; },
    get textAlign() { return this._textAlign; },
    set textBaseline(value) { this._textBaseline = value; },
    get textBaseline() { return this._textBaseline; },
    set imageSmoothingEnabled(value) { this._imageSmoothingEnabled = value; },
    get imageSmoothingEnabled() { return this._imageSmoothingEnabled; },
    set imageSmoothingQuality(value) { this._imageSmoothingQuality = value; },
    get imageSmoothingQuality() { return this._imageSmoothingQuality; },
    set shadowColor(value) { this._shadowColor = value; },
    get shadowColor() { return this._shadowColor; },
    set shadowBlur(value) { this._shadowBlur = value; },
    get shadowBlur() { return this._shadowBlur; }
  })),
  width: 200,
  height: 200,
  style: {},
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setAttribute: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({ width: 200, height: 200, left: 0, top: 0 }))
};

// Mock DOM methods
global.document = {
  createElement: vi.fn((tag) => {
    if (tag === 'canvas') {
      return mockCanvas;
    }
    return {
      style: {},
      className: '',
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({ width: 200, height: 200, left: 0, top: 0 }))
    };
  }),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};

global.window = {
  devicePixelRatio: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('ResourceMeter', () => {
  let container;
  let meter;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create container element
    container = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({ width: 200, height: 200, left: 0, top: 0 })),
      style: {}
    };
  });

  afterEach(() => {
    if (meter && !meter.isDestroyed) {
      meter.destroy();
    }
  });

  describe('Constructor and Initialization', () => {
    it('should throw error if no container provided', () => {
      expect(() => new ResourceMeter()).toThrow('ResourceMeter: Container element is required');
    });

    it('should initialize with default options', () => {
      meter = new ResourceMeter(container);
      
      expect(meter.options.type).toBe('circular');
      expect(meter.options.metric).toBe('cpu');
      expect(meter.options.animate).toBe(true);
      expect(meter.options.showLabel).toBe(true);
      expect(meter.options.showValue).toBe(true);
    });

    it('should merge custom options with defaults', () => {
      const customOptions = {
        type: 'linear',
        metric: 'memory',
        animate: false,
        thresholds: { low: 20, medium: 60, high: 80 }
      };
      
      meter = new ResourceMeter(container, customOptions);
      
      expect(meter.options.type).toBe('linear');
      expect(meter.options.metric).toBe('memory');
      expect(meter.options.animate).toBe(false);
      expect(meter.options.thresholds.low).toBe(20);
      expect(meter.options.thresholds.medium).toBe(60);
      expect(meter.options.thresholds.high).toBe(80);
    });

    it('should create canvas element', () => {
      meter = new ResourceMeter(container);
      
      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(container.appendChild).toHaveBeenCalled();
    });

    it('should create tooltip element', () => {
      meter = new ResourceMeter(container);
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should setup accessibility attributes', () => {
      meter = new ResourceMeter(container);
      
      expect(mockCanvas.setAttribute).toHaveBeenCalledWith('role', 'img');
      expect(mockCanvas.setAttribute).toHaveBeenCalledWith('tabindex', '0');
      expect(mockCanvas.setAttribute).toHaveBeenCalledWith('aria-label', expect.any(String));
    });
  });

  describe('Value Updates', () => {
    beforeEach(() => {
      meter = new ResourceMeter(container, { animate: false });
    });

    it('should update value immediately when animation disabled', () => {
      meter.update(50);
      expect(meter.currentValue).toBe(50);
    });

    it('should clamp values to valid range', () => {
      meter.update(-10);
      expect(meter.currentValue).toBe(0);
      
      meter.update(150);
      expect(meter.currentValue).toBe(100);
    });

    it('should handle custom max values', () => {
      meter = new ResourceMeter(container, { max: 1000, animate: false });
      meter.update(500);
      expect(meter.currentValue).toBe(500);
      
      meter.update(1500);
      expect(meter.currentValue).toBe(1000);
    });

    it('should start animation when animation enabled', () => {
      meter = new ResourceMeter(container, { animate: true });
      meter.update(75);
      
      expect(meter.targetValue).toBe(75);
      expect(requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      meter = new ResourceMeter(container);
    });

    it('should clear canvas before rendering', () => {
      meter.render();
      expect(meter.ctx.clearRect).toHaveBeenCalled();
    });

    it('should set high-quality rendering options', () => {
      meter.render();
      expect(meter.ctx.imageSmoothingEnabled).toBe(true);
      expect(meter.ctx.imageSmoothingQuality).toBe('high');
    });

    it('should render circular type by default', () => {
      meter.render();
      expect(meter.ctx.arc).toHaveBeenCalled();
    });

    it('should render linear type when specified', () => {
      meter.setType('linear');
      meter.render();
      expect(meter.ctx.fillRect).toHaveBeenCalled();
    });

    it('should render arc type when specified', () => {
      meter.setType('arc');
      meter.render();
      expect(meter.ctx.arc).toHaveBeenCalled();
    });
  });

  describe('Color Thresholds', () => {
    beforeEach(() => {
      meter = new ResourceMeter(container);
    });

    it('should return low color for values below low threshold', () => {
      const color = meter.getValueColor(20);
      expect(color).toBe(meter.options.colors.low);
    });

    it('should return medium color for values between low and medium thresholds', () => {
      const color = meter.getValueColor(50);
      expect(color).toBe(meter.options.colors.medium);
    });

    it('should return high color for values above medium threshold', () => {
      const color = meter.getValueColor(80);
      expect(color).toBe(meter.options.colors.high);
    });
  });

  describe('Configuration Methods', () => {
    beforeEach(() => {
      meter = new ResourceMeter(container, { animate: false });
    });

    it('should update thresholds', () => {
      const newThresholds = { low: 25, medium: 65, high: 85 };
      meter.setThresholds(newThresholds);
      
      expect(meter.options.thresholds.low).toBe(25);
      expect(meter.options.thresholds.medium).toBe(65);
      expect(meter.options.thresholds.high).toBe(85);
    });

    it('should change visualization type', () => {
      meter.setType('linear');
      expect(meter.options.type).toBe('linear');
      
      meter.setType('arc');
      expect(meter.options.type).toBe('arc');
    });

    it('should reject invalid visualization types', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      meter.setType('invalid');
      
      expect(meter.options.type).toBe('circular'); // Should remain unchanged
      expect(consoleSpy).toHaveBeenCalledWith('ResourceMeter: Invalid type "invalid"');
      
      consoleSpy.mockRestore();
    });

    it('should update max value', () => {
      meter.setMax(500);
      expect(meter.options.max).toBe(500);
    });

    it('should re-clamp current value when max is reduced', () => {
      meter.update(150);
      meter.setMax(100);
      expect(meter.currentValue).toBe(100);
    });
  });

  describe('Animation System', () => {
    beforeEach(() => {
      meter = new ResourceMeter(container, { animate: true, animationDuration: 100 });
    });

    it('should use easing function for smooth transitions', () => {
      const t = 0.5;
      const result = meter.easeInOutCubic(t);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should cancel previous animation when starting new one', () => {
      meter.update(50);
      const firstAnimationId = meter.animationId;

      meter.update(75);
      expect(cancelAnimationFrame).toHaveBeenCalledWith(firstAnimationId);
    });

    it('should complete animation and clear animation state', (done) => {
      meter.update(50);

      setTimeout(() => {
        expect(meter.animationId).toBeNull();
        expect(meter.animationStartTime).toBeNull();
        done();
      }, 150);
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      meter = new ResourceMeter(container);
    });

    it('should show tooltip on mouse move', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 100
      };

      meter.handleMouseMove(mockEvent);
      expect(meter.tooltip.style.opacity).toBe('1');
    });

    it('should hide tooltip on mouse leave', () => {
      meter.handleMouseLeave();
      expect(meter.tooltip.style.opacity).toBe('0');
    });

    it('should handle resize events', () => {
      const renderSpy = vi.spyOn(meter, 'render');
      meter.handleResize();
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      meter = new ResourceMeter(container, { animate: false });
    });

    it('should update aria-label when value changes', () => {
      meter.update(75);
      expect(mockCanvas.setAttribute).toHaveBeenCalledWith(
        'aria-label',
        expect.stringContaining('75')
      );
    });

    it('should use custom label format', () => {
      meter = new ResourceMeter(container, {
        animate: false,
        labelFormat: (value, metric) => `Custom ${metric}: ${value}%`
      });

      meter.update(50);
      expect(mockCanvas.setAttribute).toHaveBeenCalledWith(
        'aria-label',
        'Custom cpu: 50%'
      );
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      meter = new ResourceMeter(container);
    });

    it('should handle rapid updates efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        meter.update(Math.random() * 100);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 100 updates in reasonable time
      expect(duration).toBeLessThan(100);
    });

    it('should not render when destroyed', () => {
      const renderSpy = vi.spyOn(meter, 'render');
      meter.destroy();
      meter.update(50);

      expect(renderSpy).not.toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      meter = new ResourceMeter(container);
    });

    it('should clean up resources on destroy', () => {
      meter.destroy();

      expect(meter.isDestroyed).toBe(true);
      expect(meter.canvas).toBeNull();
      expect(meter.ctx).toBeNull();
      expect(meter.tooltip).toBeNull();
      expect(meter.container).toBeNull();
    });

    it('should remove event listeners on destroy', () => {
      meter.destroy();

      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith('mousemove', meter.handleMouseMove);
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith('mouseleave', meter.handleMouseLeave);
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', meter.handleResize);
    });

    it('should cancel animation on destroy', () => {
      meter.update(50); // Start animation
      meter.destroy();

      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      meter.destroy();
      expect(() => meter.destroy()).not.toThrow();
    });
  });

  describe('Device Pixel Ratio Support', () => {
    it('should scale canvas for high DPI displays', () => {
      global.window.devicePixelRatio = 2;
      meter = new ResourceMeter(container);

      expect(meter.options.devicePixelRatio).toBe(2);
      expect(meter.ctx.scale).toHaveBeenCalledWith(2, 2);
    });
  });

  describe('Custom Metrics', () => {
    it('should handle custom units and max values', () => {
      meter = new ResourceMeter(container, {
        metric: 'custom',
        customUnit: 'GB',
        max: 1000,
        animate: false,
        valueFormat: (value) => `${value.toFixed(0)} GB`
      });

      meter.update(500);
      expect(meter.currentValue).toBe(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing canvas context gracefully', () => {
      const mockCanvasNoContext = {
        ...mockCanvas,
        getContext: vi.fn(() => null)
      };

      document.createElement = vi.fn(() => mockCanvasNoContext);

      expect(() => new ResourceMeter(container)).not.toThrow();
    });

    it('should handle invalid threshold values', () => {
      meter = new ResourceMeter(container);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      meter.setMax(-10);
      expect(consoleSpy).toHaveBeenCalledWith('ResourceMeter: Invalid max value "-10"');

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with ConsciousnessTransformer Data', () => {
    it('should work with CPU data from consciousness updates', () => {
      meter = new ResourceMeter(container, { metric: 'cpu', animate: false });

      // Simulate data from ConsciousnessTransformer
      const cpuData = { percentage: 67.5 };
      meter.update(cpuData.percentage);

      expect(meter.currentValue).toBe(67.5);
    });

    it('should work with memory data from consciousness updates', () => {
      meter = new ResourceMeter(container, {
        metric: 'memory',
        max: 8192,
        animate: false,
        valueFormat: (value) => `${value.toFixed(0)} MB`
      });

      // Simulate memory data
      const memoryData = { used: 4096, total: 8192 };
      meter.update(memoryData.used);

      expect(meter.currentValue).toBe(4096);
    });

    it('should work with thread data from consciousness updates', () => {
      meter = new ResourceMeter(container, {
        metric: 'threads',
        max: 32,
        animate: false,
        valueFormat: (value) => `${value.toFixed(0)} threads`
      });

      // Simulate thread data
      const threadData = { active: 12, total: 32 };
      meter.update(threadData.active);

      expect(meter.currentValue).toBe(12);
    });
  });
});
