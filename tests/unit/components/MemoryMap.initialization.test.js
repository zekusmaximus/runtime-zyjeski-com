// MemoryMap.initialization.test.js - Test for initialization behavior fix
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MemoryMap from '../../../public/js/components/MemoryMap.js';

describe('MemoryMap Initialization Fix', () => {
  let container;
  let memoryMap;
  let consoleSpy;

  beforeEach(() => {
    // Create mock container
    container = {
      style: { width: '800px', height: '600px' },
      className: '',
      classList: { add: vi.fn(), remove: vi.fn() },
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600, left: 0, top: 0 })),
      innerHTML: '',
      clientWidth: 800,
      clientHeight: 600
    };

    // Mock document.createElement for canvas
    global.document = {
      createElement: vi.fn((tagName) => {
        if (tagName === 'canvas') {
          return {
            getContext: vi.fn(() => ({
              clearRect: vi.fn(),
              fillRect: vi.fn(),
              strokeRect: vi.fn(),
              beginPath: vi.fn(),
              moveTo: vi.fn(),
              lineTo: vi.fn(),
              stroke: vi.fn(),
              fillText: vi.fn(),
              measureText: vi.fn(() => ({ width: 10 })),
              save: vi.fn(),
              restore: vi.fn(),
              translate: vi.fn(),
              scale: vi.fn(),
              setLineDash: vi.fn(),
              createLinearGradient: vi.fn(() => ({
                addColorStop: vi.fn()
              }))
            })),
            width: 1024,
            height: 512,
            style: {},
            classList: { add: vi.fn() },
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            toDataURL: vi.fn(() => 'data:image/png;base64,mock')
          };
        }
        return {
          style: {},
          classList: { add: vi.fn() },
          appendChild: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        };
      })
    };

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((callback) => {
      setTimeout(callback, 16);
      return 1;
    });

    // Mock cancelAnimationFrame
    global.cancelAnimationFrame = vi.fn();

    // Spy on console.warn to check for warnings
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    if (memoryMap && !memoryMap.isDestroyed) {
      memoryMap.destroy();
    }
    consoleSpy.mockRestore();
  });

  it('should not log warning about missing memory data during initialization', () => {
    // Create MemoryMap instance - this triggers initialization
    memoryMap = new MemoryMap(container);

    // Check that no warning about missing memory data was logged
    const warningCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('No memory data available for rendering')
    );

    expect(warningCalls).toHaveLength(0);
  });

  it('should handle null memoryData gracefully during render', () => {
    memoryMap = new MemoryMap(container);

    // Explicitly call render with null memoryData (simulating initialization state)
    expect(memoryMap.memoryData).toBeNull();
    
    // This should not throw an error or log a warning
    expect(() => memoryMap.render()).not.toThrow();

    // Check that no warning about missing memory data was logged
    const warningCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('No memory data available for rendering')
    );

    expect(warningCalls).toHaveLength(0);
  });

  it('should render properly after update is called', () => {
    memoryMap = new MemoryMap(container);

    const mockMemoryData = {
      totalSize: 2048,
      usedSize: 512,
      blocks: [
        {
          address: '0x0000',
          size: 4,
          type: 'emotion',
          processId: 'test_process',
          content: {
            description: 'Test memory block',
            intensity: 0.5,
            age: 1000,
            accessCount: 1,
            lastAccess: Date.now(),
            fragmented: false,
            linked: []
          },
          metadata: {
            created: Date.now(),
            modified: Date.now(),
            protected: false,
            compressed: false
          }
        }
      ],
      fragmentation: 0.1,
      layout: 'linear'
    };

    // Update with valid data
    memoryMap.update(mockMemoryData);

    // Now memoryData should be set
    expect(memoryMap.memoryData).toBe(mockMemoryData);

    // Render should work without warnings
    expect(() => memoryMap.render()).not.toThrow();

    // Check that no warning about missing memory data was logged
    const warningCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('No memory data available for rendering')
    );

    expect(warningCalls).toHaveLength(0);
  });

  it('should only warn when memoryData is invalid (not null)', () => {
    memoryMap = new MemoryMap(container);

    // Set memoryData to an invalid value (not null, but missing blocks)
    memoryMap.memoryData = { totalSize: 100 }; // Missing blocks array

    // This should trigger a warning since memoryData is not null but invalid
    memoryMap.render();

    // Check that warning was logged for invalid data
    const warningCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('No memory data available for rendering')
    );

    expect(warningCalls).toHaveLength(1);
  });
});
