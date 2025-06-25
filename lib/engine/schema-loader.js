import fs from 'fs/promises';
import { join } from 'path';
import { resolveDataPath } from './engine-utils.js';

export class SchemaLoader {
  constructor(schemaMap) {
    this.schemaMap = schemaMap;
  }

  async load() {
    if (this.schemaMap.size > 0) {
      console.log('Schemas already loaded, skipping');
      return;
    }

    const schemaDir = resolveDataPath('schema');
    const schemaFiles = [
      'consciousness-schema.json',
      'story-schema.json',
      'narrative-fragment-schema.json'
    ];

    console.log(`Loading schemas from: ${schemaDir}`);

    for (const file of schemaFiles) {
      const schemaPath = join(schemaDir, file);
      try {
        const data = await fs.readFile(schemaPath, 'utf8');
        const schema = JSON.parse(data);
        const key = file.replace('.json', '');
        this.schemaMap.set(key, schema);
        console.log(`Loaded schema: ${key}`);
      } catch (err) {
        console.error(`Failed to load schema ${file}:`, err);
        throw new Error(`Failed to load schema ${file}: ${err.message}`);
      }
    }

    console.log(`Successfully loaded ${this.schemaMap.size} schemas`);
  }
}
