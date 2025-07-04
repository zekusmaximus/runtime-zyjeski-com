// WebSocket Input Validation for Runtime.zyjeski.com
// Implements strict AJV-based validation for all WebSocket events

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { commonDefinitions, eventSchemas } from './websocket-schemas.js';

/**
 * SocketValidator provides strict validation for all WebSocket events
 * Uses AJV with security-focused configuration and pre-compiled validators
 */
export default class SocketValidator {
  constructor() {
    // Configure AJV with strict security settings
    this.ajv = new Ajv({
      strict: true,
      allErrors: false, // Stop on first error for performance
      removeAdditional: false, // Don't modify data, just validate
      useDefaults: true, // Apply defaults from schema
      coerceTypes: false, // Don't type coerce - require exact types
      discriminator: true, // Support discriminator keyword
      allowUnionTypes: false, // Stricter type checking
      validateFormats: true // Validate format keywords
    });
    
    // Add format validators for common patterns
    addFormats(this.ajv);
    
    // Pre-compile all validators at initialization for performance
    this.validators = new Map();
    this.compileValidators();
  }

  /**
   * Compile all event validators at startup for optimal performance
   * Throws error if any schema is invalid
   */
  compileValidators() {
    for (const [eventName, schema] of Object.entries(eventSchemas)) {
      try {
        // Add reference to common definitions for each schema
        const schemaWithDefs = {
          ...schema,
          definitions: commonDefinitions
        };
        
        const validate = this.ajv.compile(schemaWithDefs);
        this.validators.set(eventName, validate);
      } catch (error) {
        console.error(`Failed to compile schema for ${eventName}:`, error);
        throw new Error(`Invalid schema configuration for event: ${eventName}`);
      }
    }
    
    console.log(`SocketValidator initialized with ${this.validators.size} compiled validators`);
  }

  /**
   * Validate incoming socket event data using strict validation
   * @param {string} eventName - Name of the socket event
   * @param {any} data - Data payload to validate
   * @returns {object} { valid: boolean, errors: string[], data: object|null }
   */
  validate(eventName, data) {
    const validator = this.validators.get(eventName);

    if (!validator) {
      return {
        valid: false,
        errors: [`Unknown event type: ${eventName}`],
        data: null
      };
    }

    // Check for prototype pollution attempts before validation
    const pollutionCheck = this.checkPrototypePollution(data);
    if (!pollutionCheck.valid) {
      return pollutionCheck;
    }

    // Create a deep copy to avoid modifying original data
    let dataCopy;
    try {
      dataCopy = JSON.parse(JSON.stringify(data));
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid JSON data format'],
        data: null
      };
    }

    const valid = validator(dataCopy);

    if (!valid) {
      // Transform AJV errors into safe, user-friendly messages
      const errors = this.transformErrors(validator.errors);

      return {
        valid: false,
        errors: [...new Set(errors)], // Remove duplicates
        data: null
      };
    }

    return {
      valid: true,
      errors: [],
      data: dataCopy // Return the validated copy with defaults applied
    };
  }

  /**
   * Transform AJV errors into safe, user-friendly messages
   * Prevents information leakage about internal schema structure
   * @param {Array} ajvErrors - Array of AJV error objects
   * @returns {Array} Array of safe error messages
   */
  transformErrors(ajvErrors) {
    if (!ajvErrors || !Array.isArray(ajvErrors)) {
      return ['Invalid request format'];
    }

    return ajvErrors.map(err => {
      // Don't expose internal paths or schema details
      switch (err.keyword) {
        case 'required':
          return `Missing required field: ${err.params.missingProperty}`;
        
        case 'additionalProperties':
          // Sanitize field name to prevent XSS
          const fieldName = err.params.additionalProperty;
          if (/^[a-zA-Z0-9_.-]+$/.test(fieldName)) {
            return `Unknown field: ${fieldName}`;
          }
          return `Unknown field: field`;
        
        case 'pattern':
          return `Invalid format for field: ${this.getFieldName(err.instancePath)}`;
        
        case 'enum':
          return `Invalid value for field: ${this.getFieldName(err.instancePath)}`;
        
        case 'type':
          return `Wrong type for field: ${this.getFieldName(err.instancePath)}, expected ${err.params.type}`;
        
        case 'minimum':
        case 'maximum':
          return `Value out of range for field: ${this.getFieldName(err.instancePath)}`;
        
        case 'minLength':
        case 'maxLength':
          return `Invalid length for field: ${this.getFieldName(err.instancePath)}`;
        
        default:
          return 'Invalid request format';
      }
    });
  }

  /**
   * Extract safe field name from AJV instance path
   * @param {string} instancePath - AJV instance path (e.g., "/characterId" or "/intervention/intensity")
   * @returns {string} Safe field name
   */
  getFieldName(instancePath) {
    if (!instancePath || instancePath === '') {
      return 'root';
    }

    // Remove leading slash and get the full path
    const fullPath = instancePath.slice(1);

    // For nested paths like "intervention/intensity", get the last part
    const pathParts = fullPath.split('/');
    const fieldName = pathParts[pathParts.length - 1];

    // Only return alphanumeric field names to prevent injection
    if (/^[a-zA-Z0-9_.-]+$/.test(fieldName)) {
      return fieldName;
    }

    return 'field';
  }

  /**
   * Get list of supported event types
   * @returns {Array} Array of supported event names
   */
  getSupportedEvents() {
    return Array.from(this.validators.keys());
  }

  /**
   * Check if an event type is supported
   * @param {string} eventName - Event name to check
   * @returns {boolean} True if event is supported
   */
  isEventSupported(eventName) {
    return this.validators.has(eventName);
  }

  /**
   * Check for prototype pollution attempts in the data
   * @param {any} data - Data to check
   * @returns {object} { valid: boolean, errors: string[] }
   */
  checkPrototypePollution(data) {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    const visited = new WeakSet();

    const checkObject = (obj, path = '') => {
      if (obj === null || typeof obj !== 'object') {
        return { valid: true, errors: [] };
      }

      // Prevent infinite recursion with circular references
      if (visited.has(obj)) {
        return { valid: true, errors: [] };
      }
      visited.add(obj);

      for (const key of Object.keys(obj)) {
        if (dangerousKeys.includes(key)) {
          return {
            valid: false,
            errors: [`Unknown field: ${key}`]
          };
        }

        // Recursively check nested objects (but avoid circular refs)
        if (typeof obj[key] === 'object' && obj[key] !== null && !visited.has(obj[key])) {
          const nestedCheck = checkObject(obj[key], path ? `${path}.${key}` : key);
          if (!nestedCheck.valid) {
            return nestedCheck;
          }
        }
      }

      return { valid: true, errors: [] };
    };

    return checkObject(data);
  }
}
