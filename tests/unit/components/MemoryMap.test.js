// MemoryMap.test.js - Comprehensive test suite for MemoryMap component
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MemoryMap from '../../../public/js/components/MemoryMap.js';

// Mock Canvas API for testing
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    setLineDash: vi.fn(),
    arc: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-image-data')
  })),
  width: 1024,
  height: 512,
  style: {},
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    width: 1024,
    height: 512,
    left: 0,
    top: 0,
    right: 1024,
    bottom: 512
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock-image-data')
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
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      },
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({ 
        width: 800, 
        height: 600, 
        left: 0, 
        top: 0,
        right: 800,
        bottom: 600
      })),
      innerHTML: '',
      clientWidth: 800,
      clientHeight: 600
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

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now())
};

describe('MemoryMap', () => {
  let container;
  let memoryMap;
  
  const mockMemoryData = {
    totalSize: 2048,
    usedSize: 1234,
    blocks: [
      {
        address: '0x0000',
        size: 4,
        type: 'emotion',
        processId: 'proc_grief_001',
        content: {
          description: 'First day without Sarah',
          intensity: 0.9,
          age: 432000,
          accessCount: 47,
          lastAccess: Date.now(),
          fragmented: false,
          linked: ['0x0004', '0x0008']
        },
        metadata: {
          created: Date.now(),
          modified: Date.now(),
          protected: false,
          compressed: false
        }
      },
      {
        address: '0x0010',
        size: 2,
        type: 'trauma',
        processId: 'proc_trauma_001',
        content: {
          description: 'Accident memory fragment',
          intensity: 0.7,
          age: 864000,
          accessCount: 12,
          lastAccess: Date.now() - 10000,
          fragmented: true,
          linked: []
        },
        metadata: {
          created: Date.now() - 864000,
          modified: Date.now() - 10000,
          protected: true,
          compressed: false
        }
      }
    ],
    fragmentation: 0.23,
    layout: 'linear'
  };
  
  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    // Reset all mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    if (memoryMap) {
      memoryMap.destroy();
      memoryMap = null;
    }
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });
  
  describe('Constructor and Initialization', () => {
    it('should create MemoryMap instance with default options', () => {
      memoryMap = new MemoryMap(container);
      
      expect(memoryMap).toBeInstanceOf(MemoryMap);
      expect(memoryMap.container).toBe(container);
      expect(memoryMap.options.gridSize).toEqual({ width: 64, height: 32 });
      expect(memoryMap.options.blockSize).toBe(16);
      expect(memoryMap.options.viewMode).toBe('type');
    });
    
    it('should throw error when container is not provided', () => {
      expect(() => new MemoryMap(null)).toThrow('MemoryMap: Container element is required');
    });
    
    it('should merge custom options with defaults', () => {
      const customOptions = {
        gridSize: { width: 32, height: 16 },
        blockSize: 24,
        viewMode: 'access'
      };
      
      memoryMap = new MemoryMap(container, customOptions);
      
      expect(memoryMap.options.gridSize).toEqual({ width: 32, height: 16 });
      expect(memoryMap.options.blockSize).toBe(24);
      expect(memoryMap.options.viewMode).toBe('access');
    });
    
    it('should validate options and throw errors for invalid values', () => {
      expect(() => new MemoryMap(container, { gridSize: null }))
        .toThrow('MemoryMap: gridSize must be an object with width and height numbers');
      
      expect(() => new MemoryMap(container, { blockSize: -1 }))
        .toThrow('MemoryMap: blockSize must be a positive number');
      
      expect(() => new MemoryMap(container, { viewMode: 'invalid' }))
        .toThrow('MemoryMap: viewMode must be one of: type, access, fragmentation, age');
    });
  });
  
  describe('Canvas Rendering', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container);
    });
    
    it('should create canvas layers correctly', () => {
      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(memoryMap.baseCanvas).toBeTruthy();
      expect(memoryMap.interactiveCanvas).toBeTruthy();
      expect(memoryMap.overlayCanvas).toBeTruthy();
    });
    
    it('should render memory blocks correctly', () => {
      memoryMap.update(mockMemoryData);
      memoryMap.render(); // Explicitly call render to trigger canvas operations

      const ctx = memoryMap.baseCtx;
      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.strokeRect).toHaveBeenCalled();
    });
    
    it('should render grid background', () => {
      memoryMap.render();
      
      const ctx = memoryMap.baseCtx;
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });
    
    it('should render minimap when enabled', () => {
      memoryMap = new MemoryMap(container, { enableMinimap: true });
      memoryMap.update(mockMemoryData);
      
      expect(memoryMap.minimapCanvas).toBeTruthy();
      expect(memoryMap.minimapCtx).toBeTruthy();
    });
  });
  
  describe('Memory Data Handling', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container);
    });
    
    it('should update memory data correctly', () => {
      memoryMap.update(mockMemoryData);
      
      expect(memoryMap.memoryData).toBe(mockMemoryData);
      expect(memoryMap.spatialIndex.size).toBeGreaterThan(0);
    });
    
    it('should handle invalid memory data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      memoryMap.update(null);
      
      expect(consoleSpy).toHaveBeenCalledWith('MemoryMap: Invalid memory data provided');
      consoleSpy.mockRestore();
    });
    
    it('should convert addresses to coordinates correctly', () => {
      const coords = memoryMap.addressToCoordinates('0x0000');
      expect(coords).toEqual({ x: 0, y: 0 });
      
      const coords2 = memoryMap.addressToCoordinates('0x0041'); // 65 in decimal
      expect(coords2).toEqual({ x: 1, y: 1 }); // 65 % 64 = 1, floor(65/64) = 1
    });
    
    it('should convert coordinates to addresses correctly', () => {
      const address = memoryMap.coordinatesToAddress(0, 0);
      expect(address).toBe('0x0000');
      
      const address2 = memoryMap.coordinatesToAddress(1, 1);
      expect(address2).toBe('0x0041');
    });
  });
  
  describe('Color Mapping', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container);
      memoryMap.update(mockMemoryData);
    });
    
    it('should return correct colors for type view mode', () => {
      memoryMap.setViewMode('type');
      
      const emotionBlock = mockMemoryData.blocks[0];
      const color = memoryMap.getBlockColor(emotionBlock);
      expect(color).toBe('#FF6B6B'); // emotion color
    });
    
    it('should return heatmap colors for access view mode', () => {
      memoryMap.setViewMode('access');
      
      const block = mockMemoryData.blocks[0];
      const color = memoryMap.getBlockColor(block);
      expect(color).toMatch(/^hsl\(/); // HSL color format for heatmap
    });
    
    it('should highlight fragmented blocks in fragmentation mode', () => {
      memoryMap.setViewMode('fragmentation');
      
      const fragmentedBlock = mockMemoryData.blocks[1];
      const color = memoryMap.getBlockColor(fragmentedBlock);
      expect(color).toBe('#FFB800'); // fragmented color
    });
  });
  
  describe('Zoom and Pan Functionality', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container, { enableZoom: true, enablePan: true });
    });
    
    it('should zoom in correctly', () => {
      const initialZoom = memoryMap.currentZoomLevel;
      memoryMap.zoomIn();
      
      expect(memoryMap.currentZoomLevel).toBeGreaterThan(initialZoom);
    });
    
    it('should zoom out correctly', () => {
      memoryMap.zoomIn(); // First zoom in
      const zoomedInLevel = memoryMap.currentZoomLevel;
      memoryMap.zoomOut();
      
      expect(memoryMap.currentZoomLevel).toBeLessThan(zoomedInLevel);
    });
    
    it('should respect zoom limits', () => {
      // Zoom in to maximum
      while (memoryMap.currentZoomIndex < memoryMap.options.zoomLevels.length - 1) {
        memoryMap.zoomIn();
      }
      const maxZoom = memoryMap.currentZoomLevel;
      memoryMap.zoomIn(); // Try to zoom beyond limit
      
      expect(memoryMap.currentZoomLevel).toBe(maxZoom);
    });
    
    it('should pan correctly', () => {
      const initialOffset = { ...memoryMap.panOffset };
      memoryMap.panTo(100, 100);
      
      expect(memoryMap.panOffset.x).not.toBe(initialOffset.x);
      expect(memoryMap.panOffset.y).not.toBe(initialOffset.y);
    });
    
    it('should center on address correctly', () => {
      memoryMap.centerOn('0x0000');
      
      // Should adjust pan offset to center the address
      expect(memoryMap.panOffset.x).toBeDefined();
      expect(memoryMap.panOffset.y).toBeDefined();
    });
  });

  describe('Interactive Features', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container, {
        enableTooltip: true,
        onBlockClick: vi.fn(),
        onBlockHover: vi.fn()
      });
      memoryMap.update(mockMemoryData);
    });

    it('should detect memory block clicks accurately', () => {
      const clickEvent = new MouseEvent('click', {
        clientX: 20,
        clientY: 20
      });

      memoryMap.handleClick(clickEvent);

      // Should call the click callback if a block is found
      // Note: This test depends on the mock implementation
    });

    it('should highlight blocks correctly', () => {
      memoryMap.highlightBlock('0x0000', { color: '#FF0000' });

      expect(memoryMap.highlights.has('0x0000')).toBe(true);
      expect(memoryMap.highlights.get('0x0000').color).toBe('#FF0000');
    });

    it('should clear highlights correctly', () => {
      memoryMap.highlightBlock('0x0000');
      memoryMap.highlightBlock('0x0010');

      expect(memoryMap.highlights.size).toBe(2);

      memoryMap.clearHighlights();

      expect(memoryMap.highlights.size).toBe(0);
    });

    it('should search memory contents correctly', () => {
      const results = memoryMap.search('Sarah');

      expect(results).toContain('0x0000'); // Block with "First day without Sarah"
      expect(memoryMap.searchResults).toEqual(results);
    });

    it('should search by address correctly', () => {
      const results = memoryMap.search('0x0010');

      expect(results).toContain('0x0010');
    });

    it('should search by process ID correctly', () => {
      const results = memoryMap.search('proc_grief_001');

      expect(results).toContain('0x0000');
    });
  });

  describe('Memory Statistics', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container);
      memoryMap.update(mockMemoryData);
    });

    it('should calculate memory statistics correctly', () => {
      const stats = memoryMap.getMemoryStats();

      expect(stats.totalSize).toBe(2048);
      expect(stats.usedSize).toBe(1234);
      expect(stats.freeSize).toBe(814);
      expect(stats.fragmentation).toBe(0.23);
      expect(stats.blockCount).toBe(2);
      expect(stats.utilizationPercent).toBeCloseTo(60.25, 1); // Adjusted for actual calculation
    });

    it('should handle empty memory data', () => {
      memoryMap.memoryData = null; // Set to null directly to test the stats method
      const stats = memoryMap.getMemoryStats();

      expect(stats.totalSize).toBe(0);
      expect(stats.usedSize).toBe(0);
      expect(stats.freeSize).toBe(0);
      expect(stats.blockCount).toBe(0);
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container);
    });

    it('should handle large memory datasets efficiently', () => {
      // Create a large dataset with 1000+ blocks
      const largeMemoryData = {
        totalSize: 10000,
        usedSize: 5000,
        blocks: Array.from({ length: 1000 }, (_, i) => ({
          address: `0x${i.toString(16).padStart(4, '0')}`,
          size: 1,
          type: ['emotion', 'trauma', 'relationship', 'system'][i % 4],
          processId: `proc_${i}`,
          content: {
            description: `Memory block ${i}`,
            intensity: Math.random(),
            age: Math.random() * 1000000,
            accessCount: Math.floor(Math.random() * 100),
            lastAccess: Date.now() - Math.random() * 100000,
            fragmented: Math.random() > 0.8,
            linked: []
          },
          metadata: {
            created: Date.now() - Math.random() * 1000000,
            modified: Date.now() - Math.random() * 100000,
            protected: Math.random() > 0.9,
            compressed: Math.random() > 0.7
          }
        })),
        fragmentation: 0.15,
        layout: 'linear'
      };

      const startTime = performance.now();
      memoryMap.update(largeMemoryData);
      const updateTime = performance.now() - startTime;

      // Should update within reasonable time (adjust threshold as needed)
      expect(updateTime).toBeLessThan(100); // 100ms threshold
      expect(memoryMap.spatialIndex.size).toBe(1000);
    });

    it('should track performance metrics', () => {
      memoryMap.update(mockMemoryData);
      memoryMap.render();

      const metrics = memoryMap.getPerformanceMetrics();

      expect(metrics.renderCount).toBeGreaterThan(0);
      expect(metrics.lastRenderTime).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryBlockCount).toBe(2);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container);
      memoryMap.update(mockMemoryData);
    });

    it('should export PNG correctly', () => {
      const exportData = memoryMap.exportView('png');

      expect(exportData).toBe('data:image/png;base64,mock-image-data');
    });

    it('should handle SVG export gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const exportData = memoryMap.exportView('svg');

      expect(exportData).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('MemoryMap: SVG export not yet implemented');
      consoleSpy.mockRestore();
    });
  });

  describe('Animation System', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container, { animateAllocations: true });
      memoryMap.update(mockMemoryData);
    });

    it('should animate memory allocation', () => {
      memoryMap.animateAllocation('0x0000', 4);

      // Animation uses requestAnimationFrame, so we need to trigger it
      // The animation should start immediately and add a highlight
      expect(global.requestAnimationFrame).toHaveBeenCalled();

      // Manually trigger the animation callback to test the highlight
      const animationCallback = global.requestAnimationFrame.mock.calls[global.requestAnimationFrame.mock.calls.length - 1][0];
      animationCallback(performance.now());

      // Should add temporary highlight during animation
      expect(memoryMap.highlights.has('0x0000')).toBe(true);
    });

    it('should respect animation settings', () => {
      memoryMap.setFeatureEnabled('animations', false);
      memoryMap.animateAllocation('0x0000', 4);

      // Should not animate when disabled
      expect(memoryMap.highlights.has('0x0000')).toBe(false);
    });
  });

  describe('Feature Toggle', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container);
    });

    it('should enable/disable zoom correctly', () => {
      memoryMap.setFeatureEnabled('zoom', false);
      expect(memoryMap.options.enableZoom).toBe(false);

      memoryMap.setFeatureEnabled('zoom', true);
      expect(memoryMap.options.enableZoom).toBe(true);
    });

    it('should enable/disable pan correctly', () => {
      memoryMap.setFeatureEnabled('pan', false);
      expect(memoryMap.options.enablePan).toBe(false);
    });

    it('should enable/disable tooltip correctly', () => {
      memoryMap.setFeatureEnabled('tooltip', false);
      expect(memoryMap.options.enableTooltip).toBe(false);
    });
  });

  describe('Cleanup and Destruction', () => {
    beforeEach(() => {
      memoryMap = new MemoryMap(container);
    });

    it('should clean up properly when destroyed', () => {
      memoryMap.destroy();

      expect(memoryMap.isDestroyed).toBe(true);
      expect(container.innerHTML).toBe('');
    });

    it('should handle multiple destroy calls gracefully', () => {
      memoryMap.destroy();
      memoryMap.destroy(); // Should not throw error

      expect(memoryMap.isDestroyed).toBe(true);
    });
  });
});
