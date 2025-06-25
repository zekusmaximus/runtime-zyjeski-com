// Quick test to check if memory regions are being loaded
import { ConsciousnessEngine } from './lib/consciousness-engine.js';

async function testMemoryLoading() {
    console.log('Creating consciousness engine...');
    const engine = new ConsciousnessEngine({
        maxInstances: 1,
        debugMode: true
    });
    
    console.log('Initializing engine...');
    await engine.initialize();
    
    console.log('Loading Alexander Kane...');
    const instance = await engine.loadCharacter('alexander-kane');
    
    console.log('Getting memory status...');
    const memoryStatus = instance.memoryState.getMemoryStatus();
    
    console.log('=== MEMORY STATUS ===');
    console.log(JSON.stringify(memoryStatus, null, 2));
    
    console.log('=== TOTAL MEMORIES ===');
    console.log('Total memories:', memoryStatus.totalMemories);
    
    console.log('=== POOLS ===');
    Object.entries(memoryStatus.pools).forEach(([type, data]) => {
        console.log(`${type}:`, typeof data === 'number' ? data : data.count);
    });
    
    if (memoryStatus.loadedRegions) {
        console.log('=== LOADED REGIONS ===');
        memoryStatus.loadedRegions.forEach(region => {
            console.log(`- ${region.label} (${region.type}): ${region.size} units`);
        });
    }
    
    await engine.shutdown();
}

testMemoryLoading().catch(console.error);
