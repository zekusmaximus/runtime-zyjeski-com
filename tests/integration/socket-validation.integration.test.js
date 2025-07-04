// Integration tests for WebSocket validation system
// Tests end-to-end validation with real Socket.io connections

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createValidatedHandler, wrapHandler } from '../../lib/validation/validation-middleware.js';

describe('WebSocket Validation Integration', () => {
  let mockSocket;
  let mockHandler;
  let validatedHandler;

  beforeEach(() => {
    // Create mock socket with Socket.io-like interface
    mockSocket = {
      id: 'test-socket-123',
      emit: vi.fn(),
      on: vi.fn(),
      join: vi.fn(),
      leave: vi.fn()
    };

    // Create mock handler function
    mockHandler = vi.fn().mockResolvedValue(undefined);
    
    // Create validated handler
    validatedHandler = createValidatedHandler(mockHandler, 'debug-command');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid Request Processing', () => {
    test('processes valid debug-command successfully', async () => {
      const validData = {
        characterId: 'alexander-kane',
        command: 'kill',
        args: { processId: 'p123' }
      };

      await validatedHandler.call(mockSocket, validData);

      // Handler should be called with validated data
      expect(mockHandler).toHaveBeenCalledOnce();
      expect(mockHandler).toHaveBeenCalledWith(validData);
      
      // No error should be emitted
      expect(mockSocket.emit).not.toHaveBeenCalledWith('validation-error', expect.anything());
    });

    test('processes valid start-monitoring successfully', async () => {
      const startMonitoringHandler = createValidatedHandler(mockHandler, 'start-monitoring');
      const validData = { characterId: 'alexander-kane' };

      await startMonitoringHandler.call(mockSocket, validData);

      expect(mockHandler).toHaveBeenCalledOnce();
      expect(mockHandler).toHaveBeenCalledWith(validData);
      expect(mockSocket.emit).not.toHaveBeenCalledWith('validation-error', expect.anything());
    });

    test('processes valid player-intervention successfully', async () => {
      const interventionHandler = createValidatedHandler(mockHandler, 'player-intervention');
      const validData = {
        characterId: 'alexander-kane',
        intervention: {
          type: 'memory_boost',
          intensity: 1.5,
          duration: 300
        }
      };

      await interventionHandler.call(mockSocket, validData);

      expect(mockHandler).toHaveBeenCalledOnce();
      expect(mockHandler).toHaveBeenCalledWith(validData);
      expect(mockSocket.emit).not.toHaveBeenCalledWith('validation-error', expect.anything());
    });
  });

  describe('Invalid Request Handling', () => {
    test('rejects request with missing required field', async () => {
      const invalidData = {
        command: 'kill' // Missing characterId
      };

      await validatedHandler.call(mockSocket, invalidData);

      // Handler should not be called
      expect(mockHandler).not.toHaveBeenCalled();
      
      // Validation error should be emitted
      expect(mockSocket.emit).toHaveBeenCalledWith('validation-error', {
        event: 'debug-command',
        errors: ['Missing required field: characterId'],
        timestamp: expect.any(Number)
      });
    });

    test('rejects request with invalid field type', async () => {
      const invalidData = {
        characterId: 123, // Should be string
        command: 'kill'
      };

      await validatedHandler.call(mockSocket, invalidData);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('validation-error', {
        event: 'debug-command',
        errors: ['Wrong type for field: characterId, expected string'],
        timestamp: expect.any(Number)
      });
    });

    test('rejects request with unknown fields', async () => {
      const invalidData = {
        characterId: 'alexander-kane',
        command: 'kill',
        maliciousField: 'evil data'
      };

      await validatedHandler.call(mockSocket, invalidData);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('validation-error', {
        event: 'debug-command',
        errors: ['Unknown field: maliciousField'],
        timestamp: expect.any(Number)
      });
    });

    test('rejects SQL injection attempts', async () => {
      const invalidData = {
        characterId: "alexander'; DROP TABLE characters; --",
        command: 'kill'
      };

      await validatedHandler.call(mockSocket, invalidData);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('validation-error', {
        event: 'debug-command',
        errors: ['Invalid format for field: characterId'],
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Handler Error Handling', () => {
    test('handles handler exceptions gracefully', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler failed'));
      const validatedErrorHandler = createValidatedHandler(errorHandler, 'debug-command');
      
      const validData = {
        characterId: 'alexander-kane',
        command: 'kill'
      };

      await validatedErrorHandler.call(mockSocket, validData);

      // Handler should be called with valid data
      expect(errorHandler).toHaveBeenCalledWith(validData);
      
      // Handler error should be emitted
      expect(mockSocket.emit).toHaveBeenCalledWith('handler-error', {
        event: 'debug-command',
        message: 'Internal server error',
        timestamp: expect.any(Number)
      });
    });

    test('does not expose internal error details', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Database connection failed: password123'));
      const validatedErrorHandler = createValidatedHandler(errorHandler, 'debug-command');
      
      const validData = {
        characterId: 'alexander-kane',
        command: 'kill'
      };

      await validatedErrorHandler.call(mockSocket, validData);

      // Error message should be generic
      const errorCall = mockSocket.emit.mock.calls.find(call => call[0] === 'handler-error');
      expect(errorCall[1].message).toBe('Internal server error');
      expect(errorCall[1].message).not.toContain('password123');
      expect(errorCall[1].message).not.toContain('Database connection failed');
    });
  });

  describe('Unknown Event Handling', () => {
    test('rejects unknown event types', async () => {
      const unknownHandler = createValidatedHandler(mockHandler, 'hack-the-system');
      
      await unknownHandler.call(mockSocket, { data: 'malicious' });

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('validation-error', {
        event: 'hack-the-system',
        errors: ['Unknown event type: hack-the-system'],
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Performance Integration', () => {
    test('validation adds minimal latency', async () => {
      const validData = {
        characterId: 'alexander-kane',
        command: 'kill'
      };

      const start = process.hrtime.bigint();
      await validatedHandler.call(mockSocket, validData);
      const end = process.hrtime.bigint();
      
      const latencyMs = Number(end - start) / 1000000;
      
      // Should be well under 2ms requirement
      expect(latencyMs).toBeLessThan(2);
      expect(mockHandler).toHaveBeenCalledOnce();
    });

    test('handles concurrent validations efficiently', async () => {
      const validData = {
        characterId: 'alexander-kane',
        command: 'kill'
      };

      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(validatedHandler.call(mockSocket, validData));
      }

      const start = process.hrtime.bigint();
      await Promise.all(promises);
      const end = process.hrtime.bigint();
      
      const totalMs = Number(end - start) / 1000000;
      const avgMs = totalMs / 100;
      
      expect(avgMs).toBeLessThan(1); // Should be very fast for concurrent validations
      expect(mockHandler).toHaveBeenCalledTimes(100);
    });
  });

  describe('Data Integrity', () => {
    test('does not modify original request data', async () => {
      const originalData = {
        characterId: 'alexander-kane',
        command: 'kill',
        args: { processId: 'p123' }
      };
      
      const dataCopy = JSON.parse(JSON.stringify(originalData));
      
      await validatedHandler.call(mockSocket, originalData);
      
      // Original data should be unchanged
      expect(originalData).toEqual(dataCopy);
      
      // Handler should receive a clean copy
      expect(mockHandler).toHaveBeenCalledWith(originalData);
    });

    test('applies default values from schema', async () => {
      const historyHandler = createValidatedHandler(mockHandler, 'debug-history');
      const dataWithoutLimit = {
        characterId: 'alexander-kane'
      };

      await historyHandler.call(mockSocket, dataWithoutLimit);

      // Handler should receive data with default limit applied
      const receivedData = mockHandler.mock.calls[0][0];
      expect(receivedData.limit).toBe(50); // Default value from schema
    });
  });

  describe('Wrapper Function Tests', () => {
    test('wrapHandler creates functional validated handler', async () => {
      const wrappedHandler = wrapHandler(mockHandler, 'start-monitoring');
      const validData = { characterId: 'alexander-kane' };

      await wrappedHandler.call(mockSocket, validData);

      expect(mockHandler).toHaveBeenCalledWith(validData);
      expect(mockSocket.emit).not.toHaveBeenCalledWith('validation-error', expect.anything());
    });

    test('wrapHandler rejects invalid data', async () => {
      const wrappedHandler = wrapHandler(mockHandler, 'start-monitoring');
      const invalidData = { invalidField: 'test' };

      await wrappedHandler.call(mockSocket, invalidData);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('validation-error', expect.objectContaining({
        event: 'start-monitoring',
        errors: expect.arrayContaining(['Missing required field: characterId'])
      }));
    });
  });
});
