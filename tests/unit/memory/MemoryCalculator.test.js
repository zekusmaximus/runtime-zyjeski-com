import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCalculator } from '../../../lib/memory/MemoryCalculator.js';

describe('MemoryCalculator', () => {
    describe('calculateMemorySize', () => {
        it('calculates base size for minimal memory data', () => {
            const memoryData = {};
            const size = MemoryCalculator.calculateMemorySize(memoryData);
            expect(size).toBe(100); // Base size
        });

        it('calculates size with description', () => {
            const memoryData = {
                description: 'A vivid memory of childhood'
            };
            const size = MemoryCalculator.calculateMemorySize(memoryData);
            expect(size).toBe(100 + (memoryData.description.length * 2));
        });

        it('calculates size with sensory details', () => {
            const memoryData = {
                sensoryDetails: {
                    visual: 'bright colors',
                    auditory: 'loud music',
                    tactile: 'rough texture'
                }
            };
            const size = MemoryCalculator.calculateMemorySize(memoryData);
            expect(size).toBe(100 + (3 * 50)); // 3 sensory details * 50 each
        });

        it('calculates size with emotions', () => {
            const memoryData = {
                emotions: ['joy', 'excitement', 'nostalgia']
            };
            const size = MemoryCalculator.calculateMemorySize(memoryData);
            expect(size).toBe(100 + (3 * 10)); // 3 emotions * 10 each
        });

        it('applies emotional intensity multiplier', () => {
            const memoryData = {
                description: 'test',
                emotionalIntensity: 0.5
            };
            const baseSize = 100 + (4 * 2); // 100 + description
            const expectedSize = Math.round(baseSize * (1 + 0.5));
            const size = MemoryCalculator.calculateMemorySize(memoryData);
            expect(size).toBe(expectedSize);
        });

        it('calculates complex memory with all components', () => {
            const memoryData = {
                description: 'A complex memory with many details',
                sensoryDetails: {
                    visual: 'bright',
                    auditory: 'loud'
                },
                emotions: ['joy', 'fear'],
                emotionalIntensity: 0.8
            };
            
            let expectedSize = 100; // Base
            expectedSize += memoryData.description.length * 2; // Description
            expectedSize += 2 * 50; // 2 sensory details
            expectedSize += 2 * 10; // 2 emotions
            expectedSize = Math.round(expectedSize * (1 + 0.8)); // Intensity multiplier
            
            const size = MemoryCalculator.calculateMemorySize(memoryData);
            expect(size).toBe(expectedSize);
        });
    });

    describe('getIntensityRange', () => {
        it('returns low for intensity < 0.3', () => {
            expect(MemoryCalculator.getIntensityRange(0.1)).toBe('low');
            expect(MemoryCalculator.getIntensityRange(0.29)).toBe('low');
        });

        it('returns medium for intensity 0.3-0.7', () => {
            expect(MemoryCalculator.getIntensityRange(0.3)).toBe('medium');
            expect(MemoryCalculator.getIntensityRange(0.5)).toBe('medium');
            expect(MemoryCalculator.getIntensityRange(0.69)).toBe('medium');
        });

        it('returns high for intensity >= 0.7', () => {
            expect(MemoryCalculator.getIntensityRange(0.7)).toBe('high');
            expect(MemoryCalculator.getIntensityRange(0.9)).toBe('high');
            expect(MemoryCalculator.getIntensityRange(1.0)).toBe('high');
        });
    });

    describe('calculateCorruptionRisk', () => {
        let baseMemory;

        beforeEach(() => {
            baseMemory = {
                createdAt: Date.now() - 1000000, // 1 second ago
                accessCount: 5,
                emotionalStability: 0.8,
                fragmented: false
            };
        });

        it('calculates risk for new memory', () => {
            const memory = { ...baseMemory, createdAt: Date.now() };
            const risk = MemoryCalculator.calculateCorruptionRisk(memory);
            expect(risk).toBeGreaterThanOrEqual(0);
            expect(risk).toBeLessThanOrEqual(1);
        });

        it('increases risk with age', () => {
            const oldMemory = { 
                ...baseMemory, 
                createdAt: Date.now() - 31536000000 // 1 year ago
            };
            const newMemory = { 
                ...baseMemory, 
                createdAt: Date.now() 
            };
            
            const oldRisk = MemoryCalculator.calculateCorruptionRisk(oldMemory);
            const newRisk = MemoryCalculator.calculateCorruptionRisk(newMemory);
            
            expect(oldRisk).toBeGreaterThan(newRisk);
        });

        it('increases risk with high access count', () => {
            const highAccessMemory = { ...baseMemory, accessCount: 500 };
            const lowAccessMemory = { ...baseMemory, accessCount: 5 };
            
            const highRisk = MemoryCalculator.calculateCorruptionRisk(highAccessMemory);
            const lowRisk = MemoryCalculator.calculateCorruptionRisk(lowAccessMemory);
            
            expect(highRisk).toBeGreaterThan(lowRisk);
        });

        it('increases risk with low emotional stability', () => {
            const unstableMemory = { ...baseMemory, emotionalStability: 0.2 };
            const stableMemory = { ...baseMemory, emotionalStability: 0.9 };
            
            const unstableRisk = MemoryCalculator.calculateCorruptionRisk(unstableMemory);
            const stableRisk = MemoryCalculator.calculateCorruptionRisk(stableMemory);
            
            expect(unstableRisk).toBeGreaterThan(stableRisk);
        });

        it('increases risk for fragmented memory', () => {
            const fragmentedMemory = { ...baseMemory, fragmented: true };
            const intactMemory = { ...baseMemory, fragmented: false };
            
            const fragmentedRisk = MemoryCalculator.calculateCorruptionRisk(fragmentedMemory);
            const intactRisk = MemoryCalculator.calculateCorruptionRisk(intactMemory);
            
            expect(fragmentedRisk).toBeGreaterThan(intactRisk);
        });

        it('caps risk at 1.0', () => {
            const extremeMemory = {
                createdAt: Date.now() - 63072000000, // 2 years ago
                accessCount: 10000,
                emotionalStability: 0,
                fragmented: true
            };
            
            const risk = MemoryCalculator.calculateCorruptionRisk(extremeMemory);
            expect(risk).toBeLessThanOrEqual(1.0);
        });
    });

    describe('calculateMemoryValue', () => {
        let baseMemory;

        beforeEach(() => {
            baseMemory = {
                emotionalCharge: 0.5,
                accessCount: 10,
                integrityScore: 0.8,
                associatedEmotions: ['joy', 'nostalgia']
            };
        });

        it('calculates value for typical memory', () => {
            const value = MemoryCalculator.calculateMemoryValue(baseMemory);
            expect(value).toBeGreaterThan(0);
            expect(value).toBeLessThanOrEqual(1);
        });

        it('increases value with higher emotional charge', () => {
            const highChargeMemory = { ...baseMemory, emotionalCharge: 0.9 };
            const lowChargeMemory = { ...baseMemory, emotionalCharge: 0.1 };
            
            const highValue = MemoryCalculator.calculateMemoryValue(highChargeMemory);
            const lowValue = MemoryCalculator.calculateMemoryValue(lowChargeMemory);
            
            expect(highValue).toBeGreaterThan(lowValue);
        });

        it('increases value with higher access count', () => {
            const highAccessMemory = { ...baseMemory, accessCount: 50 };
            const lowAccessMemory = { ...baseMemory, accessCount: 1 };
            
            const highValue = MemoryCalculator.calculateMemoryValue(highAccessMemory);
            const lowValue = MemoryCalculator.calculateMemoryValue(lowAccessMemory);
            
            expect(highValue).toBeGreaterThan(lowValue);
        });

        it('caps access count contribution', () => {
            const veryHighAccessMemory = { ...baseMemory, accessCount: 1000 };
            const moderateAccessMemory = { ...baseMemory, accessCount: 100 };
            
            const veryHighValue = MemoryCalculator.calculateMemoryValue(veryHighAccessMemory);
            const moderateValue = MemoryCalculator.calculateMemoryValue(moderateAccessMemory);
            
            // Both should have the same access contribution (capped at 0.3)
            expect(Math.abs(veryHighValue - moderateValue)).toBeLessThan(0.01);
        });

        it('increases value with more associated emotions', () => {
            const manyEmotionsMemory = { 
                ...baseMemory, 
                associatedEmotions: ['joy', 'sadness', 'anger', 'fear', 'surprise'] 
            };
            const fewEmotionsMemory = { 
                ...baseMemory, 
                associatedEmotions: ['joy'] 
            };
            
            const manyValue = MemoryCalculator.calculateMemoryValue(manyEmotionsMemory);
            const fewValue = MemoryCalculator.calculateMemoryValue(fewEmotionsMemory);
            
            expect(manyValue).toBeGreaterThan(fewValue);
        });

        it('caps total value at 1.0', () => {
            const extremeMemory = {
                emotionalCharge: 1.0,
                accessCount: 1000,
                integrityScore: 1.0,
                associatedEmotions: new Array(20).fill('emotion')
            };
            
            const value = MemoryCalculator.calculateMemoryValue(extremeMemory);
            expect(value).toBeLessThanOrEqual(1.0);
        });
    });

    describe('calculateUtilizationPercentage', () => {
        it('calculates percentage correctly', () => {
            expect(MemoryCalculator.calculateUtilizationPercentage(50, 100)).toBe(50);
            expect(MemoryCalculator.calculateUtilizationPercentage(75, 100)).toBe(75);
            expect(MemoryCalculator.calculateUtilizationPercentage(100, 100)).toBe(100);
        });

        it('handles zero total', () => {
            expect(MemoryCalculator.calculateUtilizationPercentage(50, 0)).toBe(0);
        });

        it('rounds to nearest integer', () => {
            expect(MemoryCalculator.calculateUtilizationPercentage(33, 100)).toBe(33);
            expect(MemoryCalculator.calculateUtilizationPercentage(67, 100)).toBe(67);
        });
    });

    describe('canAllocate', () => {
        it('returns true when sufficient memory available', () => {
            expect(MemoryCalculator.canAllocate(100, 50)).toBe(true);
            expect(MemoryCalculator.canAllocate(100, 100)).toBe(true);
        });

        it('returns false when insufficient memory available', () => {
            expect(MemoryCalculator.canAllocate(50, 100)).toBe(false);
            expect(MemoryCalculator.canAllocate(0, 1)).toBe(false);
        });
    });

    describe('calculateAvailablePercentage', () => {
        it('calculates available percentage correctly', () => {
            expect(MemoryCalculator.calculateAvailablePercentage(50, 100)).toBe(50);
            expect(MemoryCalculator.calculateAvailablePercentage(25, 100)).toBe(25);
        });

        it('handles zero total', () => {
            expect(MemoryCalculator.calculateAvailablePercentage(50, 0)).toBe(0);
        });
    });

    describe('getFragmentationSeverity', () => {
        it('returns correct severity levels', () => {
            expect(MemoryCalculator.getFragmentationSeverity(0.1)).toBe('low');
            expect(MemoryCalculator.getFragmentationSeverity(0.3)).toBe('low');
            expect(MemoryCalculator.getFragmentationSeverity(0.4)).toBe('medium');
            expect(MemoryCalculator.getFragmentationSeverity(0.6)).toBe('medium');
            expect(MemoryCalculator.getFragmentationSeverity(0.7)).toBe('high');
            expect(MemoryCalculator.getFragmentationSeverity(0.9)).toBe('high');
        });
    });

    describe('shouldTriggerPressureCleanup', () => {
        it('returns true when available < reserved', () => {
            expect(MemoryCalculator.shouldTriggerPressureCleanup(50, 100)).toBe(true);
            expect(MemoryCalculator.shouldTriggerPressureCleanup(0, 1)).toBe(true);
        });

        it('returns false when available >= reserved', () => {
            expect(MemoryCalculator.shouldTriggerPressureCleanup(100, 50)).toBe(false);
            expect(MemoryCalculator.shouldTriggerPressureCleanup(100, 100)).toBe(false);
        });
    });

    describe('getMemoryPressureLevel', () => {
        it('returns correct pressure levels', () => {
            expect(MemoryCalculator.getMemoryPressureLevel(5, 100)).toBe('critical'); // 5%
            expect(MemoryCalculator.getMemoryPressureLevel(15, 100)).toBe('warning'); // 15%
            expect(MemoryCalculator.getMemoryPressureLevel(50, 100)).toBe('none'); // 50%
        });
    });

    describe('calculatePoolUtilization', () => {
        it('calculates pool utilization correctly', () => {
            expect(MemoryCalculator.calculatePoolUtilization(50, 100)).toBe(50);
            expect(MemoryCalculator.calculatePoolUtilization(75, 100)).toBe(75);
        });

        it('handles zero max size', () => {
            expect(MemoryCalculator.calculatePoolUtilization(50, 0)).toBe(0);
        });
    });

    describe('isLeakCandidate', () => {
        it('identifies leak candidates correctly', () => {
            const currentTime = Date.now();
            const leakCandidate = {
                createdAt: currentTime - 2000000, // 33+ minutes ago
                lastAccessed: currentTime - 700000, // 11+ minutes ago
                accessCount: 2,
                emotionalCharge: 0.2,
                type: 'shortTerm'
            };
            
            expect(MemoryCalculator.isLeakCandidate(leakCandidate, currentTime)).toBe(true);
        });

        it('does not flag recent memories', () => {
            const currentTime = Date.now();
            const recentMemory = {
                createdAt: currentTime - 1000000, // 16 minutes ago
                lastAccessed: currentTime - 100000, // 1.6 minutes ago
                accessCount: 1,
                emotionalCharge: 0.1,
                type: 'shortTerm'
            };
            
            expect(MemoryCalculator.isLeakCandidate(recentMemory, currentTime)).toBe(false);
        });

        it('does not flag non-shortTerm memories', () => {
            const currentTime = Date.now();
            const longTermMemory = {
                createdAt: currentTime - 2000000,
                lastAccessed: currentTime - 700000,
                accessCount: 2,
                emotionalCharge: 0.2,
                type: 'longTerm'
            };
            
            expect(MemoryCalculator.isLeakCandidate(longTermMemory, currentTime)).toBe(false);
        });
    });

    describe('calculateLeakScore', () => {
        it('calculates leak score correctly', () => {
            const currentTime = Date.now();
            const memory = {
                createdAt: currentTime - 1800000, // 30 minutes ago
                lastAccessed: currentTime - 900000, // 15 minutes ago
                accessCount: 2,
                emotionalCharge: 0.3
            };
            
            const score = MemoryCalculator.calculateLeakScore(memory, currentTime);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(1);
        });

        it('gives higher scores to older memories', () => {
            const currentTime = Date.now();
            const oldMemory = {
                createdAt: currentTime - 3600000, // 1 hour ago
                lastAccessed: currentTime - 1800000,
                accessCount: 1,
                emotionalCharge: 0.1
            };
            const newMemory = {
                createdAt: currentTime - 600000, // 10 minutes ago
                lastAccessed: currentTime - 300000,
                accessCount: 1,
                emotionalCharge: 0.1
            };
            
            const oldScore = MemoryCalculator.calculateLeakScore(oldMemory, currentTime);
            const newScore = MemoryCalculator.calculateLeakScore(newMemory, currentTime);
            
            expect(oldScore).toBeGreaterThan(newScore);
        });
    });

    describe('calculateCompressedSize', () => {
        it('calculates compressed size with default ratio', () => {
            expect(MemoryCalculator.calculateCompressedSize(100)).toBe(70);
            expect(MemoryCalculator.calculateCompressedSize(200)).toBe(140);
        });

        it('calculates compressed size with custom ratio', () => {
            expect(MemoryCalculator.calculateCompressedSize(100, 0.5)).toBe(50);
            expect(MemoryCalculator.calculateCompressedSize(200, 0.8)).toBe(160);
        });

        it('rounds to nearest integer', () => {
            expect(MemoryCalculator.calculateCompressedSize(33, 0.7)).toBe(23);
            expect(MemoryCalculator.calculateCompressedSize(67, 0.7)).toBe(47);
        });
    });
});
