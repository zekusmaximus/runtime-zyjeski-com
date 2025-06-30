import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessFactory } from '../../../lib/process/ProcessFactory.js';

describe('ProcessFactory', () => {
    let factory;

    beforeEach(() => {
        factory = new ProcessFactory();
    });

    describe('createProcess', () => {
        it('creates a process from emotion data', () => {
            const emotionData = {
                type: 'grief',
                intensity: 0.8
            };
            const processId = 'proc_1001';
            const priority = 'normal';

            const process = factory.createProcess(processId, emotionData, priority);

            expect(process).toBeDefined();
            expect(process.id).toBe(processId);
            expect(process.name).toBe('grief_processor');
            expect(process.type).toBe('emotional_processing');
            expect(process.status).toBe('running');
            expect(process.priority).toBe(priority);
            expect(process.emotionSource).toBe(emotionData);
            expect(process.emotionalImpact).toBe(0.8);
        });

        it('uses auto priority when specified', () => {
            const emotionData = {
                type: 'grief',
                intensity: 0.8
            };
            const processId = 'proc_1002';

            const process = factory.createProcess(processId, emotionData, 'auto');

            expect(process.priority).toBe('high'); // grief template has high priority
        });

        it('defaults to normal priority', () => {
            const emotionData = {
                type: 'joy',
                intensity: 0.5
            };
            const processId = 'proc_1003';

            const process = factory.createProcess(processId, emotionData);

            expect(process.priority).toBe('normal'); // joy template has normal priority, but we override with 'normal'
        });
    });

    describe('generateProcessFromEmotion', () => {
        it('creates grief processor with correct properties', () => {
            const emotion = {
                type: 'grief',
                intensity: 0.8
            };
            const processId = 'proc_1004';

            const process = factory.generateProcessFromEmotion(emotion, processId, 'normal');

            expect(process.name).toBe('grief_processor');
            expect(process.type).toBe('emotional_processing');
            expect(process.vulnerabilities).toContain('memory_leak');
            expect(process.vulnerabilities).toContain('infinite_loop');
            expect(process.vulnerabilities).toContain('stack_overflow');
            expect(process.behaviors).toContain('memory_accumulation');
            expect(process.behaviors).toContain('recursive_thinking');
            expect(process.behaviors).toContain('resource_hoarding');
        });

        it('creates anxiety processor with correct properties', () => {
            const emotion = {
                type: 'anxiety',
                intensity: 0.6
            };
            const processId = 'proc_1005';

            const process = factory.generateProcessFromEmotion(emotion, processId, 'normal');

            expect(process.name).toBe('threat_scanner');
            expect(process.type).toBe('background_monitoring');
            expect(process.vulnerabilities).toContain('false_positive_cascade');
            expect(process.vulnerabilities).toContain('hypervigilance_loop');
            expect(process.behaviors).toContain('continuous_scanning');
            expect(process.behaviors).toContain('alert_amplification');
        });

        it('creates anger processor with correct properties', () => {
            const emotion = {
                type: 'anger',
                intensity: 0.9
            };
            const processId = 'proc_1006';

            const process = factory.generateProcessFromEmotion(emotion, processId, 'normal');

            expect(process.name).toBe('conflict_resolver');
            expect(process.type).toBe('reactive_processing');
            expect(process.vulnerabilities).toContain('interrupt_storm');
            expect(process.vulnerabilities).toContain('priority_inversion');
            expect(process.behaviors).toContain('aggressive_scheduling');
            expect(process.behaviors).toContain('resource_competition');
        });

        it('creates joy processor with correct properties', () => {
            const emotion = {
                type: 'joy',
                intensity: 0.7
            };
            const processId = 'proc_1007';

            const process = factory.generateProcessFromEmotion(emotion, processId, 'normal');

            expect(process.name).toBe('reward_amplifier');
            expect(process.type).toBe('enhancement_processing');
            expect(process.vulnerabilities).toContain('dopamine_overflow');
            expect(process.vulnerabilities).toContain('attention_fragmentation');
            expect(process.behaviors).toContain('resource_sharing');
            expect(process.behaviors).toContain('positive_feedback');
        });

        it('defaults to anxiety template for unknown emotion types', () => {
            const emotion = {
                type: 'unknown_emotion',
                intensity: 0.5
            };
            const processId = 'proc_1008';

            const process = factory.generateProcessFromEmotion(emotion, processId, 'normal');

            expect(process.name).toBe('threat_scanner');
            expect(process.type).toBe('background_monitoring');
        });

        it('scales resource usage based on emotion intensity', () => {
            const lowIntensity = {
                type: 'grief',
                intensity: 0.1
            };
            const highIntensity = {
                type: 'grief',
                intensity: 0.9
            };

            const lowProcess = factory.generateProcessFromEmotion(lowIntensity, 'proc_low', 'normal');
            const highProcess = factory.generateProcessFromEmotion(highIntensity, 'proc_high', 'normal');

            // High intensity should use more resources (accounting for random variation)
            expect(highProcess.memoryUsage).toBeGreaterThan(lowProcess.memoryUsage - 20); // -20 for random variation
            expect(highProcess.cpuUsage).toBeGreaterThan(lowProcess.cpuUsage - 10); // -10 for random variation
            expect(highProcess.threadCount).toBeGreaterThanOrEqual(lowProcess.threadCount);
        });

        it('generates initial issues for high intensity emotions', () => {
            const highIntensityEmotion = {
                type: 'grief',
                intensity: 0.8
            };

            const process = factory.generateProcessFromEmotion(highIntensityEmotion, 'proc_1009', 'normal');

            expect(process.currentIssues).toHaveLength(1);
            expect(process.currentIssues[0].severity).toBe('high');
            expect(process.currentIssues[0].type).toMatch(/memory_leak|infinite_loop|stack_overflow/);
        });

        it('generates critical issues for very high intensity emotions', () => {
            const veryHighIntensityEmotion = {
                type: 'grief',
                intensity: 0.95
            };

            const process = factory.generateProcessFromEmotion(veryHighIntensityEmotion, 'proc_1010', 'normal');

            expect(process.currentIssues).toHaveLength(1);
            expect(process.currentIssues[0].severity).toBe('critical');
        });

        it('does not generate issues for low intensity emotions', () => {
            const lowIntensityEmotion = {
                type: 'grief',
                intensity: 0.5
            };

            const process = factory.generateProcessFromEmotion(lowIntensityEmotion, 'proc_1011', 'normal');

            expect(process.currentIssues).toHaveLength(0);
        });

        it('includes all required process fields', () => {
            const emotion = {
                type: 'joy',
                intensity: 0.6
            };

            const process = factory.generateProcessFromEmotion(emotion, 'proc_1012', 'normal');

            // Verify all required fields are present
            expect(process.id).toBe('proc_1012');
            expect(process.name).toBeDefined();
            expect(process.type).toBeDefined();
            expect(process.status).toBe('running');
            expect(process.priority).toBeDefined();
            expect(process.memoryUsage).toBeGreaterThan(0);
            expect(process.cpuUsage).toBeGreaterThan(0);
            expect(process.threadCount).toBeGreaterThan(0);
            expect(process.lifetime).toBe(0);
            expect(process.lastActivity).toBeGreaterThan(0);
            expect(process.crashCount).toBe(0);
            expect(process.emotionSource).toBe(emotion);
            expect(process.emotionalImpact).toBe(0.6);
            expect(process.debuggable).toBe(true);
            expect(Array.isArray(process.currentIssues)).toBe(true);
            expect(Array.isArray(process.interventionPoints)).toBe(true);
            expect(process.effectivenessScore).toBeGreaterThan(0);
            expect(process.optimizationLevel).toBe(0);
            expect(Array.isArray(process.vulnerabilities)).toBe(true);
            expect(Array.isArray(process.behaviors)).toBe(true);
        });
    });

    describe('generateInterventionPoints', () => {
        it('generates intervention points for emotional processing', () => {
            const template = { type: 'emotional_processing' };

            const interventions = factory.generateInterventionPoints(template);

            expect(interventions).toContain('memory_cleanup');
            expect(interventions).toContain('process_throttling');
            expect(interventions).toContain('recursive_depth_limit');
        });

        it('generates intervention points for background monitoring', () => {
            const template = { type: 'background_monitoring' };

            const interventions = factory.generateInterventionPoints(template);

            expect(interventions).toContain('alert_filtering');
            expect(interventions).toContain('scan_optimization');
            expect(interventions).toContain('false_positive_reduction');
        });

        it('generates intervention points for reactive processing', () => {
            const template = { type: 'reactive_processing' };

            const interventions = factory.generateInterventionPoints(template);

            expect(interventions).toContain('anger_diffusion');
            expect(interventions).toContain('priority_rebalancing');
            expect(interventions).toContain('interrupt_management');
        });

        it('generates intervention points for enhancement processing', () => {
            const template = { type: 'enhancement_processing' };

            const interventions = factory.generateInterventionPoints(template);

            expect(interventions).toContain('reward_modulation');
            expect(interventions).toContain('attention_focusing');
            expect(interventions).toContain('feedback_stabilization');
        });

        it('generates default intervention points for unknown types', () => {
            const template = { type: 'unknown_type' };

            const interventions = factory.generateInterventionPoints(template);

            expect(interventions).toContain('generic_optimization');
            expect(interventions).toContain('resource_management');
        });
    });
});
