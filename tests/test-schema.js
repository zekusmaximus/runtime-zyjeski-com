import { ConsciousnessEngine } from './lib/consciousness-engine.js';

async function testSchemaLoading() {
  console.log('Testing schema loading...');
  
  try {
    const engine = new ConsciousnessEngine();
    console.log('Engine created successfully');
    
    await engine.initialize();
    console.log('Engine initialized successfully');
    
    // Test loading alexander-kane character
    await engine.loadCharacter('alexander-kane');
    console.log('Character loaded successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testSchemaLoading();
