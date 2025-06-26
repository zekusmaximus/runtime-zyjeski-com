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
    // Validate and normalize consciousness data structure
    let rawData;
    if (window.socketClient && window.socketClient.validateConsciousnessData) {
      rawData = window.socketClient.validateConsciousnessData(data);
    } else {
      // Fallback validation if socket client not available
      rawData = data || { 
        consciousness: { 
          processes: [], 
          memory: {}, 
          resources: {}, 
          system_errors: [], 
          threads: [] 
        } 
      };
    }

    // Transform consciousness data to format expected by monitor UI
    const consciousness = rawData.consciousness || {};
    const resources = consciousness.resources || {};
    
    this.consciousnessData = {
      // Transform resource data from consciousness format to monitor UI format
      systemResources: {
        cpu: {
          currentLoad: (resources.cpu?.percentage || 0) / 100,
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
      // Transform and pass through process data  
      processes: (consciousness.processes || []).map(process => ({
        pid: process.pid,
        name: process.name,
        status: process.status,
        cpuUsage: (process.cpu_usage || 0) / 100, // Convert to decimal for UI
        memoryUsage: process.memory_usage || 0,
        memory_mb: process.memory_mb || 0,
        threads: process.threads || 1,
        stability: process.stability || 1.0,
        type: process.type || 'unknown'
      })),
      // Pass through memory data
      memoryMap: consciousness.memory || {},
      // Pass through errors
      system_errors: consciousness.system_errors || [],
      // Add metadata
      timestamp: rawData.timestamp || Date.now(),
      characterId: rawData.characterId
    };

    console.log('📊 Monitor state updated:', {
      processCount: this.consciousnessData.processes.length,
      errorCount: this.consciousnessData.system_errors.length,
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