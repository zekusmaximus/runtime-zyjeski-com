class MonitorState {
  constructor() {
    this.connectionStatus = 'disconnected'; // disconnected, connected, error
    this.isMonitoring = false;
    this.selectedCharacter = null;
    this.consciousnessData = null;
  }

  setConnectionStatus(status) {
    this.connectionStatus = status;
  }

  setMonitoringStatus(isMonitoring) {
    this.isMonitoring = isMonitoring;
  }

  setSelectedCharacter(characterId) {
    this.selectedCharacter = characterId;
  }

  update(data) {
    console.log('🔧 Monitor state update received raw data:', data);
    
    // Validate and normalize consciousness data structure
    let rawData;
    if (window.socketClient && window.socketClient.validateConsciousnessData) {
      rawData = window.socketClient.validateConsciousnessData(data);
      console.log('🔧 After socketClient validation:', rawData);
      console.log('🔧 rawData.memoryMap:', rawData.memoryMap);
      console.log('🔧 rawData.memoryMap?.regions:', rawData.memoryMap?.regions);
    } else {
      // Enhanced fallback validation
      rawData = data || { 
        consciousness: { 
          processes: [], 
          memory: { regions: [] }, 
          resources: {}, 
          system_errors: [], 
          threads: [] 
        } 
      };
    }

    // Handle multiple possible data structures (Ground State compliant)
    let consciousness;
    if (rawData.consciousness) {
      consciousness = rawData.consciousness;
    } else if (rawData.state && rawData.state.consciousness) {
      consciousness = rawData.state.consciousness;
    } else {
      // Direct consciousness data
      consciousness = rawData;
    }

    // Handle process data from multiple possible locations
    let processes = consciousness.processes || rawData.processes || [];
    
    // Transform consciousness data to format expected by monitor UI
    const resources = consciousness.resources || {};
    
    // Store simple fields expected by legacy unit tests -----------------
    this.resources = resources;
    this.processes = processes;
    this.memory = consciousness.memory || rawData.memory || {};
    this.errors = consciousness.system_errors || rawData.errors || [];
    this.lastUpdate = Date.now();
    
    this.consciousnessData = {
      // Transform resource data from consciousness format to monitor UI format
      systemResources: {
        cpu: {
          currentLoad: (resources.cpu?.percentage || resources.cpu?.currentLoad || 0) / 100,
          used: resources.cpu?.used || 0,
          total: 100
        },
        memory: {
          used: resources.memory?.used || 0,
          total: resources.memory?.total || 10000,
          percentage: resources.memory?.percentage || 0
        },
        threads: {
          used: resources.threads?.used || 0,
          total: resources.threads?.total || 16
        }
      },
      // Transform and pass through process data with enhanced field mapping
      processes: processes.map(process => ({
        pid: process.pid,
        name: process.name,
        status: process.status,
        cpuUsage: (process.cpu_usage || process.cpuUsage || 0) / 100, // Convert to decimal for UI
        memoryUsage: process.memory_usage || process.memoryUsage || 0,
        memory_mb: process.memory_mb || 0,
        threads: process.threads || 1,
        stability: process.stability || 1.0,
        type: process.type || 'unknown'
      })),
      // Enhanced memory map handling with proper regions support
      memoryMap: {
        // Get regions from top-level memoryMap first, then consciousness memory
        regions: rawData.memoryMap?.regions || consciousness.memory?.regions || consciousness.memoryMap?.regions || [],
        // Get pools from consciousness memory
        pools: consciousness.memory?.pools || rawData.memoryMap?.pools || {},
        // Get capacity info from consciousness memory
        capacity: consciousness.memory?.capacity || {},
        stats: consciousness.memory?.stats || {},
        totalSize: consciousness.memory?.capacity?.total || consciousness.memory?.totalSize || rawData.memoryMap?.totalSize || 0,
        fragmentationLevel: consciousness.memory?.fragmentationLevel || 0
      },
      // Pass through errors from multiple possible locations
      system_errors: consciousness.system_errors || consciousness.errors || rawData.system_errors || [],
      // Add metadata
      timestamp: rawData.timestamp || Date.now(),
      characterId: rawData.characterId || this.selectedCharacter
    };

    console.log('📊 Monitor state updated:', {
      processCount: this.consciousnessData.processes.length,
      errorCount: this.consciousnessData.system_errors.length,
      memoryRegions: this.consciousnessData.memoryMap.regions.length,
      cpuUsage: this.consciousnessData.systemResources.cpu.currentLoad * 100,
      memoryUsage: this.consciousnessData.systemResources.memory.percentage
    });
  }

  // Add method for updating consciousness data specifically
  updateConsciousnessData(data) {
    this.update(data);
  }
}

export default MonitorState;