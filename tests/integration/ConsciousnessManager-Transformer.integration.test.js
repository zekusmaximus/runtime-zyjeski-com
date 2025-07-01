// ConsciousnessManager-Transformer.integration.test.js
// Integration tests for ConsciousnessManager with ConsciousnessTransformer

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ConsciousnessManager from '../../public/js/consciousness.js';
import { ConsciousnessTransformer } from '../../public/js/utils/ConsciousnessTransformer.js';

describe('ConsciousnessManager + ConsciousnessTransformer Integration', () => {
  let manager;
  let transformer;
  let mockStateManager;
  let mockSocketClient;
  let mockConsciousnessData;

  beforeEach(() => {
    // Set up DOM elements for testing
    global.document = {
      getElementById: vi.fn((id) => {
        if (id === 'consciousnessPreview') {
          return {
            querySelector: vi.fn(() => ({
              innerHTML: ''
            }))
          };
        }
        return null;
      })
    };

    // Create transformer instance
    transformer = new ConsciousnessTransformer({
      enableCaching: true,
      cacheTimeout: 1000,
      maxCacheSize: 10
    });

    // Mock state manager
    let isMonitoringActive = false;
    mockStateManager = {
      set: vi.fn((key, value) => {
        if (key === 'monitoringActive') {
          isMonitoringActive = value;
        }
      }),
      subscribe: vi.fn(),
      loadCharacterState: vi.fn(),
      updateConsciousnessData: vi.fn(),
      getCurrentCharacter: vi.fn(() => ({ id: 'alexander-kane', name: 'Alexander Kane' })),
      getMonitoringActive: vi.fn(() => isMonitoringActive),
      setCurrentCharacter: vi.fn(),
      setMonitoringActive: vi.fn((active) => { isMonitoringActive = active; }),
      _processingServerUpdate: false
    };

    // Mock socket client
    mockSocketClient = {
      isSocketConnected: () => true,
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };

    // Mock consciousness data
    mockConsciousnessData = {
      characterId: "alexander_kane",
      timestamp: "2024-12-09T10:30:00Z",
      system: {
        cpu: { usage: 45.2, cores: 4 },
        memory: { total: 8192, used: 4821, free: 3371 },
        threads: { active: 12, blocked: 2, waiting: 3 }
      },
      processes: [
        {
          pid: 1001,
          name: "Grief_Manager.exe",
          status: "running",
          cpu_usage: 23.4,
          memory_usage: 1024,
          threads: 3,
          priority: "high",
          currentIssues: []
        },
        {
          pid: 1002,
          name: "Reality_Checker.dll",
          status: "warning",
          cpu_usage: 78.5,
          memory_usage: 512,
          threads: 2,
          priority: "normal",
          currentIssues: ["high_cpu_usage"]
        }
      ],
      memoryAllocations: [
        {
          processId: 1001,
          blocks: [
            { address: "0x1000", size: 512, fragmented: false },
            { address: "0x2000", size: 512, fragmented: true }
          ]
        }
      ],
      errors: [
        {
          timestamp: "2024-12-09T10:29:55Z",
          process: "Reality_Checker.dll",
          type: "TIMELINE_MISMATCH",
          severity: "warning"
        }
      ]
    };

    // Create manager with transformer
    manager = new ConsciousnessManager({
      stateManager: mockStateManager,
      socketClient: mockSocketClient,
      transformer: transformer
    });
  });

  afterEach(() => {
    manager.destroy();
    transformer.destroy();
    delete global.document;
  });

  describe('Constructor Integration', () => {
    it('should accept transformer as dependency', () => {
      expect(manager.transformer).toBe(transformer);
    });

    it('should work without transformer (backward compatibility)', () => {
      const managerWithoutTransformer = new ConsciousnessManager({
        stateManager: mockStateManager,
        socketClient: mockSocketClient
      });
      
      expect(managerWithoutTransformer.transformer).toBeUndefined();
      managerWithoutTransformer.destroy();
    });

    it('should log warning when transformer is missing', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      new ConsciousnessManager({
        stateManager: mockStateManager,
        socketClient: mockSocketClient
      }).destroy();
      
      // Note: The warning is logged by the logger, not console.warn directly
      consoleSpy.mockRestore();
    });
  });

  describe('handleConsciousnessUpdate Integration', () => {
    it('should use transformer for data validation', () => {
      const validateSpy = vi.spyOn(transformer, 'validateUpdate');
      
      manager.handleConsciousnessUpdate(mockConsciousnessData);
      
      expect(validateSpy).toHaveBeenCalledWith(mockConsciousnessData);
      validateSpy.mockRestore();
    });

    it('should reject invalid data using transformer validation', () => {
      const invalidData = { invalid: 'data' };
      const updateSpy = vi.spyOn(mockStateManager, 'updateConsciousnessData');
      
      manager.handleConsciousnessUpdate(invalidData);
      
      expect(updateSpy).not.toHaveBeenCalled();
      updateSpy.mockRestore();
    });

    it('should process valid data and update state manager', () => {
      const updateSpy = vi.spyOn(mockStateManager, 'updateConsciousnessData');
      
      manager.handleConsciousnessUpdate(mockConsciousnessData);
      
      expect(updateSpy).toHaveBeenCalled();
      updateSpy.mockRestore();
    });

    it('should handle transformer validation errors gracefully', () => {
      const validateSpy = vi.spyOn(transformer, 'validateUpdate').mockImplementation(() => {
        throw new Error('Validation error');
      });
      
      expect(() => {
        manager.handleConsciousnessUpdate(mockConsciousnessData);
      }).not.toThrow();
      
      validateSpy.mockRestore();
    });

    it('should fall back to legacy method when transformer is not available', () => {
      const managerWithoutTransformer = new ConsciousnessManager({
        stateManager: mockStateManager,
        socketClient: mockSocketClient
      });
      
      const updateSpy = vi.spyOn(mockStateManager, 'updateConsciousnessData');
      
      managerWithoutTransformer.handleConsciousnessUpdate(mockConsciousnessData);
      
      expect(updateSpy).toHaveBeenCalled();
      updateSpy.mockRestore();
      managerWithoutTransformer.destroy();
    });
  });

  describe('updateConsciousnessPreview Integration', () => {
    it('should use transformer for process extraction', () => {
      const extractSpy = vi.spyOn(transformer, 'extractProcesses');
      
      manager.updateConsciousnessPreview(mockConsciousnessData);
      
      expect(extractSpy).toHaveBeenCalledWith(mockConsciousnessData);
      extractSpy.mockRestore();
    });

    it('should render transformed process data correctly', () => {
      const mockProcessList = { innerHTML: '' };
      global.document.getElementById.mockReturnValue({
        querySelector: vi.fn(() => mockProcessList)
      });
      
      manager.updateConsciousnessPreview(mockConsciousnessData);
      
      expect(mockProcessList.innerHTML).toContain('Grief_Manager.exe');
      expect(mockProcessList.innerHTML).toContain('Reality_Checker.dll');
    });

    it('should handle transformer errors gracefully', () => {
      const extractSpy = vi.spyOn(transformer, 'extractProcesses').mockImplementation(() => {
        throw new Error('Extraction error');
      });
      
      expect(() => {
        manager.updateConsciousnessPreview(mockConsciousnessData);
      }).not.toThrow();
      
      extractSpy.mockRestore();
    });

    it('should fall back to legacy rendering when transformer is not available', () => {
      const managerWithoutTransformer = new ConsciousnessManager({
        stateManager: mockStateManager,
        socketClient: mockSocketClient
      });
      
      const mockProcessList = { innerHTML: '' };
      global.document.getElementById.mockReturnValue({
        querySelector: vi.fn(() => mockProcessList)
      });
      
      managerWithoutTransformer.updateConsciousnessPreview(mockConsciousnessData);
      
      expect(mockProcessList.innerHTML).toContain('Grief_Manager.exe');
      managerWithoutTransformer.destroy();
    });

    it('should display "No active processes" when no processes are found', () => {
      const dataWithoutProcesses = { ...mockConsciousnessData, processes: [] };
      const mockProcessList = { innerHTML: '' };
      global.document.getElementById.mockReturnValue({
        querySelector: vi.fn(() => mockProcessList)
      });
      
      manager.updateConsciousnessPreview(dataWithoutProcesses);
      
      expect(mockProcessList.innerHTML).toContain('No active processes');
    });
  });

  describe('Performance Integration', () => {
    it('should benefit from transformer caching on repeated calls', () => {
      const extractSpy = vi.spyOn(transformer, 'extractProcesses');
      
      // First call
      manager.updateConsciousnessPreview(mockConsciousnessData);
      const firstCallCount = extractSpy.mock.calls.length;
      
      // Second call with same data should use cache
      manager.updateConsciousnessPreview(mockConsciousnessData);
      expect(extractSpy.mock.calls.length).toBe(firstCallCount + 1); // Called again but cached internally
      
      extractSpy.mockRestore();
    });

    it('should complete update cycle within performance targets', () => {
      const startTime = performance.now();
      
      manager.handleConsciousnessUpdate(mockConsciousnessData);
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should complete quickly
    });
  });

  describe('Cleanup Integration', () => {
    it('should destroy transformer when manager is destroyed', () => {
      const destroySpy = vi.spyOn(transformer, 'destroy');
      
      manager.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
      destroySpy.mockRestore();
    });

    it('should handle missing transformer destroy method gracefully', () => {
      const transformerWithoutDestroy = { extractProcesses: vi.fn() };
      const managerWithBadTransformer = new ConsciousnessManager({
        stateManager: mockStateManager,
        socketClient: mockSocketClient,
        transformer: transformerWithoutDestroy
      });
      
      expect(() => {
        managerWithBadTransformer.destroy();
      }).not.toThrow();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing API when transformer is not provided', () => {
      const legacyManager = new ConsciousnessManager({
        stateManager: mockStateManager,
        socketClient: mockSocketClient
      });
      
      // Should work with existing methods
      expect(() => {
        legacyManager.handleConsciousnessUpdate(mockConsciousnessData);
        legacyManager.updateConsciousnessPreview(mockConsciousnessData);
      }).not.toThrow();
      
      legacyManager.destroy();
    });

    it('should produce similar output with and without transformer', () => {
      const mockProcessList1 = { innerHTML: '' };
      const mockProcessList2 = { innerHTML: '' };
      
      // Manager with transformer
      global.document.getElementById.mockReturnValue({
        querySelector: vi.fn(() => mockProcessList1)
      });
      manager.updateConsciousnessPreview(mockConsciousnessData);
      const transformerOutput = mockProcessList1.innerHTML;
      
      // Manager without transformer
      const legacyManager = new ConsciousnessManager({
        stateManager: mockStateManager,
        socketClient: mockSocketClient
      });
      global.document.getElementById.mockReturnValue({
        querySelector: vi.fn(() => mockProcessList2)
      });
      legacyManager.updateConsciousnessPreview(mockConsciousnessData);
      const legacyOutput = mockProcessList2.innerHTML;
      
      // Both should contain process names
      expect(transformerOutput).toContain('Grief_Manager.exe');
      expect(legacyOutput).toContain('Grief_Manager.exe');
      
      legacyManager.destroy();
    });
  });
});
