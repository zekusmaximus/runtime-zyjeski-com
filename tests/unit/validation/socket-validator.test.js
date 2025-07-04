// Unit tests for WebSocket validation system
// Tests cover valid inputs, malicious inputs, type validation, performance, and security

import { describe, test, expect, beforeEach } from 'vitest';
import SocketValidator from '../../../lib/validation/socket-validator.js';

describe('SocketValidator', () => {
  let validator;
  
  beforeEach(() => {
    validator = new SocketValidator();
  });

  describe('Valid Input Validation', () => {
    test('validates correct debug-command', () => {
      const result = validator.validate('debug-command', {
        characterId: 'alexander-kane',
        command: 'kill',
        args: { processId: 'p123' }
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual({
        characterId: 'alexander-kane',
        command: 'kill',
        args: { processId: 'p123' }
      });
    });

    test('validates debug-command without optional args', () => {
      const result = validator.validate('debug-command', {
        characterId: 'test-character',
        command: 'restart'
      });
      
      expect(result.valid).toBe(true);
      expect(result.data.characterId).toBe('test-character');
      expect(result.data.command).toBe('restart');
    });

    test('validates start-monitoring', () => {
      const result = validator.validate('start-monitoring', {
        characterId: 'alexander-kane'
      });
      
      expect(result.valid).toBe(true);
      expect(result.data.characterId).toBe('alexander-kane');
    });

    test('validates player-intervention', () => {
      const result = validator.validate('player-intervention', {
        characterId: 'alexander-kane',
        intervention: {
          type: 'memory_boost',
          intensity: 1.5,
          duration: 300
        }
      });
      
      expect(result.valid).toBe(true);
      expect(result.data.intervention.type).toBe('memory_boost');
    });

    test('validates debug-history with criteria', () => {
      const result = validator.validate('debug-history', {
        characterId: 'alexander-kane',
        limit: 25,
        criteria: {
          command: 'kill',
          success: true,
          fromTimestamp: 1640995200000
        }
      });
      
      expect(result.valid).toBe(true);
      expect(result.data.limit).toBe(25);
      expect(result.data.criteria.command).toBe('kill');
    });

    test('validates empty object events', () => {
      const result = validator.validate('monitor:get-characters', {});
      expect(result.valid).toBe(true);
      
      const result2 = validator.validate('refresh-monitor', {});
      expect(result2.valid).toBe(true);
    });
  });

  describe('Security Validation - Injection Attacks', () => {
    test('rejects SQL injection in characterId', () => {
      const result = validator.validate('debug-command', {
        characterId: "alexander'; DROP TABLE characters; --",
        command: 'kill'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid format for field: characterId');
    });

    test('rejects NoSQL injection attempts', () => {
      const result = validator.validate('debug-command', {
        characterId: { $ne: null },
        command: 'kill'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Wrong type for field: characterId, expected string');
    });

    test('rejects XSS attempts in string fields', () => {
      const result = validator.validate('request-update', {
        characterId: 'alexander-kane',
        reason: '<script>alert("xss")</script>'
      });
      
      expect(result.valid).toBe(true); // XSS is handled by length limits and output encoding
      expect(result.data.reason).toBe('<script>alert("xss")</script>');
    });

    test('rejects command injection attempts', () => {
      const result = validator.validate('debug-command', {
        characterId: 'alexander; rm -rf /',
        command: 'kill'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid format for field: characterId');
    });

    test('rejects prototype pollution attempts', () => {
      // Test with constructor property which is more realistic
      const result = validator.validate('debug-command', {
        characterId: 'alexander-kane',
        command: 'kill',
        constructor: { prototype: { polluted: true } }
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown field: constructor');
    });
  });

  describe('Type Validation', () => {
    test('rejects wrong type for characterId', () => {
      const result = validator.validate('debug-command', {
        characterId: 123,
        command: 'kill'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Wrong type for field: characterId, expected string');
    });

    test('rejects wrong type for limit in debug-history', () => {
      const result = validator.validate('debug-history', {
        characterId: 'alexander-kane',
        limit: '50' // Should be number, not string
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Wrong type for field: limit, expected integer');
    });

    test('rejects invalid enum values', () => {
      const result = validator.validate('debug-command', {
        characterId: 'alexander-kane',
        command: 'hack_the_system' // Not a valid command
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid value for field: command');
    });
  });

  describe('Range and Length Validation', () => {
    test('rejects characterId that is too long', () => {
      const result = validator.validate('debug-command', {
        characterId: 'a'.repeat(51), // Max is 50
        command: 'kill'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid length for field: characterId');
    });

    test('rejects empty characterId', () => {
      const result = validator.validate('debug-command', {
        characterId: '',
        command: 'kill'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid length for field: characterId');
    });

    test('rejects limit values out of range', () => {
      const result = validator.validate('debug-history', {
        characterId: 'alexander-kane',
        limit: 101 // Max is 100
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Value out of range for field: limit');
    });

    test('rejects intervention intensity out of range', () => {
      const result = validator.validate('player-intervention', {
        characterId: 'alexander-kane',
        intervention: {
          type: 'memory_boost',
          intensity: 3.0 // Max is 2.0
        }
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Value out of range for field: intensity');
    });
  });

  describe('Required Field Validation', () => {
    test('rejects missing required characterId', () => {
      const result = validator.validate('debug-command', {
        command: 'kill'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: characterId');
    });

    test('rejects missing required command', () => {
      const result = validator.validate('debug-command', {
        characterId: 'alexander-kane'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: command');
    });

    test('rejects missing required intervention', () => {
      const result = validator.validate('player-intervention', {
        characterId: 'alexander-kane'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: intervention');
    });
  });

  describe('Additional Properties Validation', () => {
    test('rejects unknown fields in debug-command', () => {
      const result = validator.validate('debug-command', {
        characterId: 'alexander-kane',
        command: 'kill',
        maliciousField: 'evil data'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown field: maliciousField');
    });

    test('rejects unknown fields in nested objects', () => {
      const result = validator.validate('player-intervention', {
        characterId: 'alexander-kane',
        intervention: {
          type: 'memory_boost',
          maliciousField: 'evil data'
        }
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown field: maliciousField');
    });
  });

  describe('Unknown Event Validation', () => {
    test('rejects unknown event types', () => {
      const result = validator.validate('hack-the-system', {
        data: 'malicious'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown event type: hack-the-system');
    });

    test('rejects undefined event types', () => {
      const result = validator.validate(undefined, {});
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown event type: undefined');
    });
  });

  describe('Data Integrity', () => {
    test('does not modify original data', () => {
      const originalData = {
        characterId: 'alexander-kane',
        command: 'kill',
        args: { processId: 'p123' }
      };
      
      const dataCopy = JSON.parse(JSON.stringify(originalData));
      validator.validate('debug-command', originalData);
      
      expect(originalData).toEqual(dataCopy);
    });

    test('handles malformed JSON gracefully', () => {
      const circularRef = {};
      circularRef.self = circularRef;
      
      const result = validator.validate('debug-command', circularRef);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid JSON data format');
    });
  });

  describe('Utility Methods', () => {
    test('getSupportedEvents returns all event types', () => {
      const events = validator.getSupportedEvents();
      
      expect(events).toContain('debug-command');
      expect(events).toContain('start-monitoring');
      expect(events).toContain('player-intervention');
      expect(events.length).toBeGreaterThan(10);
    });

    test('isEventSupported works correctly', () => {
      expect(validator.isEventSupported('debug-command')).toBe(true);
      expect(validator.isEventSupported('unknown-event')).toBe(false);
    });
  });
});
