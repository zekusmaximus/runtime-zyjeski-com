// WebSocket Event Validation Schemas for Runtime.zyjeski.com
// Using JSON Schema format with AJV for strict validation

/**
 * Common schema definitions to be referenced across event schemas
 * These provide reusable validation patterns for consistent data types
 */
export const commonDefinitions = {
  characterId: {
    type: 'string',
    pattern: '^[a-zA-Z0-9_-]+$',
    minLength: 1,
    maxLength: 50,
    description: 'Unique identifier for a character'
  },
  
  debugCommand: {
    type: 'string',
    enum: [
      'kill', 'restart', 'modify', 'inspect', 'optimize',
      'step_into', 'step_over', 'continue', 'break_all',
      'set_breakpoint', 'remove_breakpoint', 'list_breakpoints'
    ],
    description: 'Valid debug command types'
  },
  
  processId: {
    type: 'string',
    pattern: '^[a-zA-Z0-9_.-]+$',
    minLength: 1,
    maxLength: 100,
    description: 'Process identifier'
  },
  
  interventionType: {
    type: 'string',
    enum: ['memory_boost', 'process_priority', 'emotional_dampening', 'cognitive_enhancement'],
    description: 'Valid player intervention types'
  },
  
  limitValue: {
    type: 'integer',
    minimum: 1,
    maximum: 100,
    description: 'Limit for paginated results'
  },
  
  socketId: {
    type: 'string',
    pattern: '^[a-zA-Z0-9_-]+$',
    minLength: 1,
    maxLength: 50,
    description: 'Socket connection identifier'
  }
};

/**
 * Event schemas using JSON Schema format with $ref to common definitions
 * Each schema defines the exact structure expected for WebSocket events
 */
export const eventSchemas = {
  // Debug command execution
  'debug-command': {
    type: 'object',
    required: ['characterId', 'command'],
    properties: {
      characterId: { $ref: '#/definitions/characterId' },
      command: { $ref: '#/definitions/debugCommand' },
      args: {
        type: 'object',
        properties: {
          processId: { $ref: '#/definitions/processId' },
          breakpointId: { type: 'string', maxLength: 100 },
          line: { type: 'integer', minimum: 1 },
          condition: { type: 'string', maxLength: 500 },
          priority: { type: 'integer', minimum: 1, maximum: 10 },
          memoryAmount: { type: 'integer', minimum: 1, maximum: 1000000 }
        },
        additionalProperties: false,
        description: 'Command-specific arguments'
      }
    },
    additionalProperties: false
  },

  // Start monitoring session
  'start-monitoring': {
    type: 'object',
    required: ['characterId'],
    properties: {
      characterId: { $ref: '#/definitions/characterId' }
    },
    additionalProperties: false
  },

  // Stop monitoring session
  'stop-monitoring': {
    type: 'object',
    properties: {
      characterId: { $ref: '#/definitions/characterId' }
    },
    additionalProperties: false
  },

  // Player intervention in character consciousness
  'player-intervention': {
    type: 'object',
    required: ['characterId', 'intervention'],
    properties: {
      characterId: { $ref: '#/definitions/characterId' },
      intervention: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { $ref: '#/definitions/interventionType' },
          intensity: { type: 'number', minimum: 0.1, maximum: 2.0 },
          duration: { type: 'integer', minimum: 1, maximum: 3600 },
          targetProcess: { $ref: '#/definitions/processId' }
        },
        additionalProperties: false
      }
    },
    additionalProperties: false
  },

  // Request manual consciousness update
  'request-update': {
    type: 'object',
    required: ['characterId'],
    properties: {
      characterId: { $ref: '#/definitions/characterId' },
      reason: { 
        type: 'string', 
        maxLength: 200,
        description: 'Reason for manual update request'
      }
    },
    additionalProperties: false
  },

  // Debug command undo
  'debug-undo': {
    type: 'object',
    required: ['characterId'],
    properties: {
      characterId: { $ref: '#/definitions/characterId' }
    },
    additionalProperties: false
  },

  // Debug command redo
  'debug-redo': {
    type: 'object',
    required: ['characterId'],
    properties: {
      characterId: { $ref: '#/definitions/characterId' }
    },
    additionalProperties: false
  },

  // Get debug command history
  'debug-history': {
    type: 'object',
    required: ['characterId'],
    properties: {
      characterId: { $ref: '#/definitions/characterId' },
      limit: { 
        $ref: '#/definitions/limitValue',
        default: 50
      },
      criteria: {
        type: 'object',
        properties: {
          command: { $ref: '#/definitions/debugCommand' },
          success: { type: 'boolean' },
          fromTimestamp: { type: 'integer', minimum: 0 },
          toTimestamp: { type: 'integer', minimum: 0 }
        },
        additionalProperties: false
      }
    },
    additionalProperties: false
  },

  // Get debug status (undo/redo availability)
  'debug-status': {
    type: 'object',
    required: ['characterId'],
    properties: {
      characterId: { $ref: '#/definitions/characterId' }
    },
    additionalProperties: false
  },

  // Monitor: Get available characters
  'monitor:get-characters': {
    type: 'object',
    properties: {},
    additionalProperties: false
  },

  // Monitor: Start monitoring (alternative endpoint)
  'monitor:start': {
    type: 'object',
    required: ['characterId'],
    properties: {
      characterId: { $ref: '#/definitions/characterId' }
    },
    additionalProperties: false
  },

  // Refresh monitor data
  'refresh-monitor': {
    type: 'object',
    properties: {},
    additionalProperties: false
  },

  // Get system resource usage
  'get-system-resources': {
    type: 'object',
    properties: {},
    additionalProperties: false
  },

  // Get error logs
  'get-error-logs': {
    type: 'object',
    properties: {},
    additionalProperties: false
  },

  // Get memory allocation data
  'get-memory-allocation': {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
};

/**
 * Complete schema with definitions for AJV compilation
 * This combines the common definitions with event schemas
 */
export const completeSchema = {
  $id: 'websocket-events',
  definitions: commonDefinitions,
  ...eventSchemas
};
