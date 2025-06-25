export default function registerScenarioHandlers({ scenarioEngine, handlers }) {
  scenarioEngine.on('scenarioStarted', (data) => {
    handlers.broadcastScenarioEvent('scenario-started', data);
  });

  scenarioEngine.on('scenarioCompleted', (data) => {
    handlers.broadcastScenarioEvent('scenario-completed', data);
  });
}
