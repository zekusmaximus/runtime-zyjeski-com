// diagnostic.js - Add to public/js/ folder for debugging
// This script provides comprehensive debugging for character loading issues

class DiagnosticTool {
  constructor() {
    this.testResults = [];
    this.init();
  }

  init() {
    this.createDiagnosticUI();
  }

  createDiagnosticUI() {
    const diagnosticPanel = document.createElement('div');
    diagnosticPanel.id = 'diagnosticPanel';
    diagnosticPanel.style.cssText = `position: fixed; top: 10px; right: 10px; width: 400px; max-height: 600px; background: #1e1e1e; border: 1px solid #444; border-radius: 5px; padding: 15px; color: #ffffff; font-family: 'Consolas', monospace; font-size: 12px; z-index: 9999; overflow-y: auto; display: none;`;

    diagnosticPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; color: #4CAF50;">Consciousness Debugger</h3>
        <button id="closeDiagnostic" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">×</button>
      </div>
      <button id="runDiagnostics" style="background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 3px; cursor: pointer; width: 100%; margin-bottom: 10px;">Run Full Diagnostics</button>
      <div id="diagnosticResults" style="background: #2d2d2d; padding: 10px; border-radius: 3px; max-height: 400px; overflow-y: auto;"></div>
    `;

    document.body.appendChild(diagnosticPanel);

    const triggerButton = document.createElement('button');
    triggerButton.id = 'showDiagnostic';
    triggerButton.textContent = 'Debug';
    triggerButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff9800;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      z-index: 9998;
      font-weight: bold;
    `;
    document.body.appendChild(triggerButton);

    triggerButton.addEventListener('click', () => {
      diagnosticPanel.style.display = 'block';
      triggerButton.style.display = 'none';
    });

    document.getElementById('closeDiagnostic').addEventListener('click', () => {
      diagnosticPanel.style.display = 'none';
      triggerButton.style.display = 'block';
    });

    document.getElementById('runDiagnostics').addEventListener('click', () => {
      this.runFullDiagnostics();
    });
  }

  log(message, type = 'info') {
    const resultsDiv = document.getElementById('diagnosticResults');
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      debug: '#2196F3'
    };

    const logEntry = document.createElement('div');
    logEntry.style.cssText = `
      margin-bottom: 5px;
      padding: 5px;
      border-left: 3px solid ${colors[type] || colors.info};
      background: rgba(255,255,255,0.05);
    `;
    logEntry.innerHTML = `<span style="color: #888;">[${timestamp}]</span> <span style="color: ${colors[type] || colors.info};">[${type.toUpperCase()}]</span> ${message}`;

    resultsDiv.appendChild(logEntry);
    resultsDiv.scrollTop = resultsDiv.scrollHeight;

    console.log(`[DIAGNOSTIC] ${message}`);
  }

  async runFullDiagnostics() {
    this.testResults = [];
    document.getElementById('diagnosticResults').innerHTML = '';

    this.log('Starting comprehensive consciousness diagnostics...', 'info');

    await this.testScriptLoading();
    await this.testAPIConnectivity();
    await this.testCharacterDataLoading();
    await this.testConsciousnessAPI();
    await this.testWebSocketConnectivity();
    await this.testCharacterSelection();
    await this.testConsciousnessDataStructure();

    this.displaySummary();
  }

  async testScriptLoading() {
    this.log('Testing script loading...', 'debug');

    const requiredObjects = [
      { name: 'consciousnessManager', obj: window.consciousness },
      { name: 'stateManager', obj: window.stateManager },
      { name: 'socketClient', obj: window.socketClient }
    ];

    requiredObjects.forEach(({ name, obj }) => {
      if (obj) {
        this.log(`✓ ${name} loaded successfully`, 'info');
        this.testResults.push({ test: `${name}_loaded`, passed: true });
      } else {
        this.log(`✗ ${name} not found - check script loading`, 'error');
        this.testResults.push({ test: `${name}_loaded`, passed: false });
      }
    });
  }

  async testAPIConnectivity() {
    this.log('Testing API connectivity...', 'debug');

    try {
      const response = await fetch('/api/characters');
      if (response.ok) {
        const data = await response.json();
        this.log(`✓ API connectivity successful - found ${data.data?.length || 0} characters`, 'info');
        this.testResults.push({ test: 'api_connectivity', passed: true });
        return data;
      }
      this.log(`✗ API returned ${response.status}: ${response.statusText}`, 'error');
      this.testResults.push({ test: 'api_connectivity', passed: false });
    } catch (error) {
      this.log(`✗ API connectivity failed: ${error.message}`, 'error');
      this.testResults.push({ test: 'api_connectivity', passed: false });
    }
  }

  async testCharacterDataLoading() {
    this.log('Testing character data loading...', 'debug');

    try {
      const response = await fetch('/api/character/alexander-kane');
      if (response.ok) {
        const data = await response.json();
        this.log(`✓ Character data loaded: ${data.data?.name}`, 'info');
        this.log(`Character structure: ${Object.keys(data.data || {}).join(', ')}`, 'debug');

        if (data.data?.consciousness) {
          this.log('✓ Consciousness data present in character', 'info');
          this.log(`Consciousness structure: ${Object.keys(data.data.consciousness).join(', ')}`, 'debug');
        } else {
          this.log('✗ No consciousness data in character object', 'warning');
        }

        this.testResults.push({ test: 'character_loading', passed: true, data: data.data });
        return data.data;
      }
      this.log(`✗ Character loading failed: ${response.status}`, 'error');
      this.testResults.push({ test: 'character_loading', passed: false });
    } catch (error) {
      this.log(`✗ Character loading error: ${error.message}`, 'error');
      this.testResults.push({ test: 'character_loading', passed: false });
    }
  }

  async testConsciousnessAPI() {
    this.log('Testing consciousness API endpoint...', 'debug');

    try {
      const response = await fetch('/api/consciousness/alexander-kane/state');
      if (response.ok) {
        const data = await response.json();
        this.log('✓ Consciousness API responding', 'info');

        const consciousness = data.data;
        if (consciousness) {
          this.log(`Consciousness data structure: ${Object.keys(consciousness).join(', ')}`, 'debug');

          if (Array.isArray(consciousness.processes)) {
            this.log(`✓ Processes array found with ${consciousness.processes.length} items`, 'info');

            if (consciousness.processes.length > 0) {
              const firstProcess = consciousness.processes[0];
              this.log(`First process structure: ${Object.keys(firstProcess).join(', ')}`, 'debug');
              this.log(`First process: ${firstProcess.name} (${firstProcess.status})`, 'info');
            }
          } else {
            this.log(`✗ Processes is not an array: ${typeof consciousness.processes}`, 'error');
            this.log(`Processes value: ${JSON.stringify(consciousness.processes)}`, 'debug');
          }
        }

        this.testResults.push({ test: 'consciousness_api', passed: true, data: consciousness });
        return consciousness;
      }
      this.log(`✗ Consciousness API failed: ${response.status}`, 'error');
      this.testResults.push({ test: 'consciousness_api', passed: false });
    } catch (error) {
      this.log(`✗ Consciousness API error: ${error.message}`, 'error');
      this.testResults.push({ test: 'consciousness_api', passed: false });
    }
  }

  async testWebSocketConnectivity() {
    this.log('Testing WebSocket connectivity...', 'debug');

    if (window.socketClient) {
      if (window.socketClient.isSocketConnected && window.socketClient.isSocketConnected()) {
        this.log('✓ WebSocket connected', 'info');
        this.testResults.push({ test: 'websocket_connectivity', passed: true });
      } else {
        this.log('✗ WebSocket not connected', 'warning');
        this.testResults.push({ test: 'websocket_connectivity', passed: false });
      }
    } else {
      this.log('✗ SocketClient not available', 'error');
      this.testResults.push({ test: 'websocket_connectivity', passed: false });
    }
  }

  async testCharacterSelection() {
    this.log('Testing character selection process...', 'debug');

    try {
      const characterSelect = document.getElementById('characterSelect');
      if (!characterSelect) {
        this.log('✗ Character select element not found', 'error');
        this.testResults.push({ test: 'character_selection', passed: false });
        return;
      }

      this.log('✓ Character select element found', 'info');

      const alexanderOption = Array.from(characterSelect.options).find(option => option.value === 'alexander-kane');

      if (alexanderOption) {
        this.log('✓ Alexander Kane option found in selector', 'info');
        this.testResults.push({ test: 'character_selection', passed: true });
      } else {
        this.log('✗ Alexander Kane not found in character selector', 'error');
        this.log(`Available options: ${Array.from(characterSelect.options).map(o => o.value).join(', ')}`, 'debug');
        this.testResults.push({ test: 'character_selection', passed: false });
      }
    } catch (error) {
      this.log(`✗ Character selection test error: ${error.message}`, 'error');
      this.testResults.push({ test: 'character_selection', passed: false });
    }
  }

  async testConsciousnessDataStructure() {
    this.log('Testing consciousness data structure validation...', 'debug');

    const consciousnessTest = this.testResults.find(r => r.test === 'consciousness_api');

    if (!consciousnessTest || !consciousnessTest.passed || !consciousnessTest.data) {
      this.log('✗ No consciousness data available for structure validation', 'error');
      this.testResults.push({ test: 'data_structure', passed: false });
      return;
    }

    const consciousness = consciousnessTest.data;
    let structureValid = true;

    const requiredFields = ['processes', 'resources', 'system_errors'];
    requiredFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(consciousness, field)) {
        this.log(`✓ Required field '${field}' present`, 'info');
      } else {
        this.log(`✗ Required field '${field}' missing`, 'error');
        structureValid = false;
      }
    });

    if (Array.isArray(consciousness.processes)) {
      this.log(`✓ Processes is an array with ${consciousness.processes.length} items`, 'info');

      if (consciousness.processes.length > 0) {
        const process = consciousness.processes[0];
        const processFields = ['pid', 'name', 'status', 'cpu_usage', 'memory_usage'];
        const missingFields = processFields.filter(field => !Object.prototype.hasOwnProperty.call(process, field));

        if (missingFields.length === 0) {
          this.log('✓ Process structure valid', 'info');
        } else {
          this.log(`✗ Process missing fields: ${missingFields.join(', ')}`, 'error');
          structureValid = false;
        }
      }
    } else {
      this.log(`✗ Processes is not an array: ${typeof consciousness.processes}`, 'error');
      structureValid = false;
    }

    this.testResults.push({ test: 'data_structure', passed: structureValid });
  }

  displaySummary() {
    this.log('='.repeat(50), 'info');
    this.log('DIAGNOSTIC SUMMARY', 'info');
    this.log('='.repeat(50), 'info');

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;

    this.log(`Tests passed: ${passed}/${total}`, passed === total ? 'info' : 'warning');

    const failedTests = this.testResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      this.log('Failed tests:', 'error');
      failedTests.forEach(test => {
        this.log(`- ${test.test}`, 'error');
      });

      this.log('RECOMMENDATIONS:', 'warning');

      if (!this.testResults.find(r => r.test === 'api_connectivity')?.passed) {
        this.log('1. Check if server is running on port 3000', 'warning');
        this.log('2. Verify no CORS issues in browser console', 'warning');
      }

      if (!this.testResults.find(r => r.test === 'consciousness_api')?.passed) {
        this.log('3. Check server console for consciousness API errors', 'warning');
        this.log('4. Verify alexander-kane.json file exists and is valid', 'warning');
      }

      if (!this.testResults.find(r => r.test === 'data_structure')?.passed) {
        this.log('5. Check consciousness data structure matches expected format', 'warning');
        this.log('6. Verify server is generating processes array correctly', 'warning');
      }
    } else {
      this.log('All tests passed! The system should be working correctly.', 'info');
      this.log('If you\'re still seeing issues, try refreshing the page.', 'info');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.diagnosticTool = new DiagnosticTool();
  });
} else {
  window.diagnosticTool = new DiagnosticTool();
}
