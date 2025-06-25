import MonitorController from './modules/monitor/monitor-controller.js';

document.addEventListener('DOMContentLoaded', () => {
  const controller = new MonitorController();
  controller.init();
  window.monitor = controller;
});
