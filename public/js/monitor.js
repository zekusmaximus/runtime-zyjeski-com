// public/js/monitor.js
import MonitorController from './modules/monitor/monitor-controller.js';

console.log('[MONITOR.JS] Monitor module loaded');

// Export the MonitorController class as default for dynamic imports
export default MonitorController;

document.addEventListener('DOMContentLoaded', () => {
  console.log('[MONITOR.JS] DOMContentLoaded fired, creating monitor controller');
  const controller = new MonitorController();
  // Remove the init() call - constructor already initializes
  window.monitor = controller;
  console.log('[MONITOR.JS] Monitor controller created and assigned to window.monitor');
});