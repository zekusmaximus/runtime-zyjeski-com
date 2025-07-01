// ConsciousnessTransformer.test.js - Comprehensive unit tests
// Tests all transformation methods, caching, error handling, and edge cases

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsciousnessTransformer } from './ConsciousnessTransformer.js';

describe('ConsciousnessTransformer', () => {
  let transformer;
  let mockConsciousnessData;
  let mockProcessData;

  beforeEach(() => {
    // Create fresh transformer instance for each test
    transformer = new ConsciousnessTransformer({
      enableCaching: true,
      cacheTimeout: 1000,
      maxCacheSize: 10
    });

    // Mock consciousness data matching backend format
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

    mockProcessData = {
      pid: 1001,
      name: "Test_Process.exe",
      status: "running",
      cpu_usage: 45.0,
      memory_usage: 800,
      threads: 2,
      priority: "normal",
      currentIssues: []
    };
  });

  afterEach(() => {
    transformer.destroy();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultTransformer = new ConsciousnessTransformer();
      expect(defaultTransformer.config.enableCaching).toBe(true);
      expect(defaultTransformer.config.cacheTimeout).toBe(60000);
      expect(defaultTransformer.config.maxCacheSize).toBe(100);
      defaultTransformer.destroy();
    });

    it('should accept custom configuration', () => {
      const customTransformer = new ConsciousnessTransformer({
        enableCaching: false,
        cacheTimeout: 5000,
        maxCacheSize: 50
      });
      expect(customTransformer.config.enableCaching).toBe(false);
      expect(customTransformer.config.cacheTimeout).toBe(5000);
      expect(customTransformer.config.maxCacheSize).toBe(50);
      customTransformer.destroy();
    });

    it('should initialize cache and cleanup interval', () => {
      expect(transformer._cache).toBeInstanceOf(Map);
      expect(transformer._lastTimestamp).toBeNull();
      expect(transformer._cacheCleanupInterval).toBeDefined();
    });
  });

  describe('extractProcesses', () => {
    it('should extract and format processes correctly', () => {
      const processes = transformer.extractProcesses(mockConsciousnessData);
      
      expect(processes).toHaveLength(2);
      expect(processes[0]).toMatchObject({
        pid: 1001,
        name: "Grief_Manager.exe",
        status: "running",
        cpu: 23.4,
        memory: 1024,
        threads: 3,
        priority: "high"
      });
      expect(processes[0].health).toBeGreaterThan(0);
      expect(processes[0].indicator).toHaveProperty('color');
      expect(processes[0].indicator).toHaveProperty('icon');
      expect(processes[0].indicator).toHaveProperty('pulse');
    });

    it('should handle missing process data gracefully', () => {
      const result = transformer.extractProcesses({});
      expect(result).toEqual([]);
    });

    it('should handle null/undefined data', () => {
      expect(transformer.extractProcesses(null)).toEqual([]);
      expect(transformer.extractProcesses(undefined)).toEqual([]);
    });

    it('should return default process for invalid process data', () => {
      const dataWithInvalidProcess = {
        timestamp: "2024-12-09T10:30:00Z",
        processes: [null, undefined, "invalid"]
      };
      
      const processes = transformer.extractProcesses(dataWithInvalidProcess);
      expect(processes).toHaveLength(3);
      processes.forEach(process => {
        expect(process.name).toBe('Unknown Process');
        expect(process.status).toBe('error');
        expect(process.health).toBe(0);
      });
    });

    it('should use caching when enabled', () => {
      const spy = vi.spyOn(transformer, 'formatProcessForUI');
      
      // First call
      transformer.extractProcesses(mockConsciousnessData);
      const firstCallCount = spy.mock.calls.length;
      
      // Second call with same data should use cache
      transformer.extractProcesses(mockConsciousnessData);
      expect(spy.mock.calls.length).toBe(firstCallCount); // No additional calls
      
      spy.mockRestore();
    });
  });

  describe('formatProcessForUI', () => {
    it('should format process with all required fields', () => {
      const formatted = transformer.formatProcessForUI(mockProcessData);
      
      expect(formatted).toHaveProperty('pid', 1001);
      expect(formatted).toHaveProperty('name', 'Test_Process.exe');
      expect(formatted).toHaveProperty('status', 'running');
      expect(formatted).toHaveProperty('health');
      expect(formatted).toHaveProperty('indicator');
      expect(formatted).toHaveProperty('warnings');
      expect(formatted).toHaveProperty('trend');
      expect(formatted).toHaveProperty('cpu', 45.0);
      expect(formatted).toHaveProperty('memory', 800);
      expect(formatted).toHaveProperty('debuggable', true);
    });

    it('should calculate health score correctly', () => {
      const lowCpuProcess = { ...mockProcessData, cpu_usage: 10 };
      const highCpuProcess = { ...mockProcessData, cpu_usage: 90 };
      
      const lowCpuFormatted = transformer.formatProcessForUI(lowCpuProcess);
      const highCpuFormatted = transformer.formatProcessForUI(highCpuProcess);
      
      expect(lowCpuFormatted.health).toBeGreaterThan(highCpuFormatted.health);
    });

    it('should handle crashed processes correctly', () => {
      const crashedProcess = { ...mockProcessData, status: 'crashed' };
      const formatted = transformer.formatProcessForUI(crashedProcess);
      
      expect(formatted.status).toBe('crashed');
      expect(formatted.health).toBe(0);
      expect(formatted.indicator.color).toBe('#F44336');
    });

    it('should return default process for invalid input', () => {
      const result = transformer.formatProcessForUI(null);
      expect(result.name).toBe('Unknown Process');
      expect(result.status).toBe('error');
      expect(result.health).toBe(0);
    });
  });

  describe('normalizeResources', () => {
    it('should normalize system resources correctly', () => {
      const resources = transformer.normalizeResources(mockConsciousnessData);
      
      expect(resources).toHaveProperty('cpu');
      expect(resources).toHaveProperty('memory');
      expect(resources).toHaveProperty('threads');
      
      expect(resources.cpu.usage).toBe(45.2);
      expect(resources.cpu.cores).toBe(4);
      expect(resources.cpu.label).toBe('CPU: 45.2%');
      
      expect(resources.memory.used).toBe(4821);
      expect(resources.memory.total).toBe(8192);
      expect(resources.memory.percentage).toBeCloseTo(58.85, 0);
      
      expect(resources.threads.active).toBe(12);
      expect(resources.threads.total).toBe(17); // active + blocked + waiting
    });

    it('should return default resources for missing data', () => {
      const resources = transformer.normalizeResources({});
      
      expect(resources.cpu.usage).toBe(0);
      expect(resources.memory.used).toBe(0);
      expect(resources.threads.active).toBe(0);
    });

    it('should handle null/undefined system data', () => {
      const resources = transformer.normalizeResources({ system: null });
      expect(resources).toEqual(transformer._getDefaultResources());
    });
  });

  describe('extractMemoryAllocations', () => {
    it('should extract memory allocations correctly', () => {
      const memoryMap = transformer.extractMemoryAllocations(mockConsciousnessData);
      
      expect(memoryMap).toHaveProperty('totalBlocks');
      expect(memoryMap).toHaveProperty('usedBlocks');
      expect(memoryMap).toHaveProperty('fragmentedBlocks');
      expect(memoryMap).toHaveProperty('visualization');
      expect(memoryMap).toHaveProperty('heatmap');
      
      expect(memoryMap.usedBlocks).toBe(2);
      expect(memoryMap.fragmentedBlocks).toBe(1);
      expect(memoryMap.visualization).toHaveLength(2);
    });

    it('should return default memory map for missing data', () => {
      const memoryMap = transformer.extractMemoryAllocations({});
      
      expect(memoryMap.totalBlocks).toBe(16);
      expect(memoryMap.usedBlocks).toBe(0);
      expect(memoryMap.visualization).toEqual([]);
    });
  });

  describe('validateUpdate', () => {
    it('should validate correct data structure', () => {
      expect(transformer.validateUpdate(mockConsciousnessData)).toBe(true);
    });

    it('should reject null/undefined data', () => {
      expect(transformer.validateUpdate(null)).toBe(false);
      expect(transformer.validateUpdate(undefined)).toBe(false);
    });

    it('should reject data without timestamp', () => {
      const dataWithoutTimestamp = { ...mockConsciousnessData };
      delete dataWithoutTimestamp.timestamp;
      expect(transformer.validateUpdate(dataWithoutTimestamp)).toBe(false);
    });

    it('should reject invalid processes data type', () => {
      const invalidData = { ...mockConsciousnessData, processes: "invalid" };
      expect(transformer.validateUpdate(invalidData)).toBe(false);
    });
  });

  describe('mergeStates', () => {
    it('should merge states correctly', () => {
      const oldState = {
        timestamp: "2024-12-09T10:29:00Z",
        processes: [{ pid: 1000, name: "Old_Process" }],
        system: { cpu: { usage: 30 } }
      };

      const newState = {
        timestamp: "2024-12-09T10:30:00Z",
        processes: [{ pid: 1001, name: "New_Process" }],
        system: { memory: { used: 1000 } }
      };

      const merged = transformer.mergeStates(oldState, newState);

      expect(merged.timestamp).toBe(newState.timestamp);
      expect(merged.processes).toEqual(newState.processes);
      expect(merged.system.cpu.usage).toBe(30); // From old state
      expect(merged.system.memory.used).toBe(1000); // From new state
    });

    it('should handle null states', () => {
      const state = { timestamp: "2024-12-09T10:30:00Z" };
      expect(transformer.mergeStates(null, state)).toEqual(state);
      expect(transformer.mergeStates(state, null)).toEqual(state);
    });
  });

  describe('calculateSystemHealth', () => {
    it('should calculate system health correctly', () => {
      const health = transformer.calculateSystemHealth(mockConsciousnessData);

      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('cpu');
      expect(health).toHaveProperty('memory');
      expect(health).toHaveProperty('processes');

      expect(health.overall).toBeGreaterThan(0);
      expect(health.overall).toBeLessThanOrEqual(100);
      expect(health.cpu).toBeCloseTo(55, 0); // 100 - 45.2 (rounded)
      expect(health.memory).toBeCloseTo(41, 0); // 100 - (4821/8192)*100 (rounded)
    });

    it('should return zero health for missing data', () => {
      const health = transformer.calculateSystemHealth({});
      expect(health.overall).toBe(0);
      expect(health.cpu).toBe(0);
      expect(health.memory).toBe(0);
      expect(health.processes).toBe(0);
    });

    it('should use caching for repeated calls', () => {
      const spy = vi.spyOn(transformer, '_calculateHealth');

      transformer.calculateSystemHealth(mockConsciousnessData);
      const firstCallCount = spy.mock.calls.length;

      transformer.calculateSystemHealth(mockConsciousnessData);
      expect(spy.mock.calls.length).toBe(firstCallCount); // Should use cache

      spy.mockRestore();
    });
  });

  describe('extractErrorPatterns', () => {
    it('should categorize errors correctly', () => {
      const errors = [
        { type: 'CRITICAL_ERROR', severity: 'critical', message: 'System failure' },
        { type: 'WARNING', severity: 'warning', message: 'High usage' },
        { type: 'INFO', severity: 'info', message: 'Status update' },
        { type: 'WARNING', severity: 'warning', message: 'Another warning' }
      ];

      const patterns = transformer.extractErrorPatterns(errors);

      expect(patterns.critical).toHaveLength(1);
      expect(patterns.warnings).toHaveLength(2);
      expect(patterns.info).toHaveLength(1);
      expect(patterns.patterns.WARNING).toBe(2);
      expect(patterns.patterns.CRITICAL_ERROR).toBe(1);
    });

    it('should handle empty or invalid error arrays', () => {
      expect(transformer.extractErrorPatterns([])).toEqual({
        critical: [], warnings: [], info: [], patterns: {}
      });
      expect(transformer.extractErrorPatterns(null)).toEqual({
        critical: [], warnings: [], info: [], patterns: {}
      });
    });
  });

  describe('computeTrends', () => {
    it('should return stable for insufficient data', () => {
      const trends = transformer.computeTrends(mockConsciousnessData, []);
      expect(trends.overall).toBe('stable');
      expect(trends.cpu).toBe('stable');
      expect(trends.memory).toBe('stable');
      expect(trends.processes).toBe('stable');
    });

    it('should calculate trends from historical data', () => {
      const historical = [
        { system: { cpu: { usage: 30 }, memory: { used: 3000 } }, processes: [] },
        { system: { cpu: { usage: 40 }, memory: { used: 4000 } }, processes: [] },
        { system: { cpu: { usage: 50 }, memory: { used: 5000 } }, processes: [] }
      ];

      const trends = transformer.computeTrends(mockConsciousnessData, historical);
      expect(trends).toHaveProperty('overall');
      expect(trends).toHaveProperty('cpu');
      expect(trends).toHaveProperty('memory');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache correctly', () => {
      transformer.extractProcesses(mockConsciousnessData);
      expect(transformer._cache.size).toBeGreaterThan(0);

      transformer.clearCache();
      expect(transformer._cache.size).toBe(0);
      expect(transformer._lastTimestamp).toBeNull();
    });

    it('should invalidate cache for specific timestamp', () => {
      const timestamp = "2024-12-09T10:30:00Z";
      transformer.extractProcesses(mockConsciousnessData);

      const initialSize = transformer._cache.size;
      transformer.invalidateCacheForTimestamp(timestamp);
      expect(transformer._cache.size).toBeLessThan(initialSize);
    });

    it('should respect cache size limits', () => {
      const smallCacheTransformer = new ConsciousnessTransformer({
        enableCaching: true,
        maxCacheSize: 2
      });

      // Add more entries than cache limit
      for (let i = 0; i < 5; i++) {
        const data = { ...mockConsciousnessData, timestamp: `2024-12-09T10:3${i}:00Z` };
        smallCacheTransformer.extractProcesses(data);
      }

      expect(smallCacheTransformer._cache.size).toBeLessThanOrEqual(2);
      smallCacheTransformer.destroy();
    });

    it('should disable caching when configured', () => {
      const noCacheTransformer = new ConsciousnessTransformer({
        enableCaching: false
      });

      noCacheTransformer.extractProcesses(mockConsciousnessData);
      expect(noCacheTransformer._cache.size).toBe(0);
      noCacheTransformer.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed data gracefully', () => {
      const malformedData = {
        timestamp: "invalid-timestamp",
        processes: "not-an-array",
        system: null
      };

      expect(() => transformer.extractProcesses(malformedData)).not.toThrow();
      expect(() => transformer.normalizeResources(malformedData)).not.toThrow();
      expect(() => transformer.extractMemoryAllocations(malformedData)).not.toThrow();
    });

    it('should log errors appropriately', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      transformer.formatProcessForUI({ invalid: "data" });

      expect(consoleSpy).not.toHaveBeenCalled(); // Should handle gracefully without error
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should complete process extraction within performance target', () => {
      const largeDataSet = {
        ...mockConsciousnessData,
        processes: Array(50).fill(0).map((_, i) => ({
          pid: 1000 + i,
          name: `Process_${i}.exe`,
          status: 'running',
          cpu_usage: Math.random() * 100,
          memory_usage: Math.random() * 2000,
          threads: Math.floor(Math.random() * 8) + 1
        }))
      };

      const startTime = performance.now();
      transformer.extractProcesses(largeDataSet);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5); // < 5ms target
    });

    it('should complete resource normalization within performance target', () => {
      const startTime = performance.now();
      transformer.normalizeResources(mockConsciousnessData);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2); // < 2ms target
    });
  });

  describe('Destroy', () => {
    it('should cleanup resources on destroy', () => {
      const intervalId = transformer._cacheCleanupInterval;
      expect(intervalId).toBeDefined();

      transformer.destroy();

      expect(transformer._cache.size).toBe(0);
      expect(transformer._cacheCleanupInterval).toBeNull();
    });
  });
});
