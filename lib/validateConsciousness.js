// Backend-side schema validation for consciousness updates
import { validate } from 'jsonschema';
import fs from 'fs';
import path from 'path';

// Load the schema synchronously at startup (CommonJS-compatible)
const schemaPath = path.resolve(process.cwd(), 'data', 'schema', 'consciousness-schema.json');
const consciousnessSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

export function validateConsciousnessData(data) {
  const result = validate(data, consciousnessSchema);
  if (!result.valid) {
    // Log all validation errors
    console.error('Consciousness schema validation failed:', result.errors.map(e => e.stack));
    return false;
  }
  return true;
}
