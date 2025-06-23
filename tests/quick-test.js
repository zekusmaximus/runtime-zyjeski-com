// Minimal test for schema loading
const test = async () => {
  const { ConsciousnessEngine } = await import('./lib/consciousness-engine.js');
  const engine = new ConsciousnessEngine();
  
  console.log('Starting initialization...');
  await engine.initialize();
  console.log('Initialization complete!');
  
  console.log('Available schemas:', [...engine.schemas.keys()]);
  process.exit(0);
};

test().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
