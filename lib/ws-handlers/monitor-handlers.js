import { info, error } from '../logger.js';
import fs from 'fs/promises';
import path from 'path';

export default function registerMonitorHandlers({ socket, handlers, consciousnessEngine, ensureEngineInitialized }) {
  socket.on('monitor:get-characters', async () => {
    try {
      const charactersDir = path.resolve(process.cwd(), 'data', 'characters');
      const characterFiles = await fs.readdir(charactersDir);
      const characters = [];
      for (const file of characterFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(charactersDir, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const characterData = JSON.parse(fileContent);
          characters.push({ id: characterData.id, name: characterData.name });
        }
      }
      socket.emit('character-list', characters);
    } catch (err) {
      error('Error getting characters', { error: err });
      socket.emit('error', { message: 'Failed to get character list' });
    }
  });

  socket.on('monitor:start', async (data) => {
    try {
      const { characterId } = data;
      if (!characterId) {
        socket.emit('error', { message: 'Character ID required' });
        return;
      }
      info('Starting character monitoring', { characterId, socketId: socket.id });
      await ensureEngineInitialized();
      await consciousnessEngine.loadCharacter(characterId);
      const result = await consciousnessEngine.startMonitoring(characterId, socket.id);
      const socketInfo = handlers.connectedSockets.get(socket.id);
      socketInfo.characterId = characterId;
      socketInfo.isMonitoring = true;
      const roomName = `character-${characterId}`;
      socket.join(roomName);
      socketInfo.joinedRooms.add(roomName);
      info('Character monitoring started successfully', result);
    } catch (err) {
      error('Error starting character monitoring', { error: err, characterId: data.characterId });
      socket.emit('error', { message: `Failed to start monitoring: ${err.message}` });
    }
  });

  socket.on('stop-monitoring', async (data) => {
    info('Stop monitoring request', { socketId: socket.id, data });
    try {
      const socketInfo = handlers.connectedSockets.get(socket.id);
      if (socketInfo && socketInfo.isMonitoring) {
        await consciousnessEngine.stopMonitoring(socket.id);
        socket.leave(`character-${socketInfo.characterId}`);
        socketInfo.isMonitoring = false;
        socket.emit('monitoring-stopped', {
          characterId: socketInfo.characterId,
          message: 'Monitoring stopped successfully'
        });
        info('Monitoring stopped successfully', { socketId: socket.id, characterId: socketInfo.characterId });
      } else {
        socket.emit('monitoring-stopped', { message: 'Not currently monitoring' });
      }
    } catch (err) {
      error('Error stopping monitoring', { error: err.message });
      socket.emit('error', { message: 'Failed to stop monitoring' });
    }
  });

  socket.on('refresh-monitor', async () => {
    try {
      const infoObj = handlers.connectedSockets.get(socket.id);
      if (!infoObj || !infoObj.characterId) {
        socket.emit('error', { message: 'No character being monitored' });
        return;
      }
      const state = await consciousnessEngine.getState(infoObj.characterId);
      socket.emit('consciousness-update', {
        characterId: infoObj.characterId,
        state,
        timestamp: Date.now(),
        type: 'manual-refresh'
      });
    } catch (err) {
      error('Error handling refresh-monitor', { error: err });
      socket.emit('error', { message: 'Failed to refresh monitor' });
    }
  });

  socket.on('get-system-resources', async () => {
    console.log('📊 WEBSOCKET: Received get-system-resources request');
    try {
      const socketInfo = handlers.connectedSockets.get(socket.id);
      if (!socketInfo || !socketInfo.characterId) {
        console.warn('❌ WEBSOCKET: No character being monitored for system resources');
        socket.emit('error', { message: 'No character being monitored' });
        return;
      }
      console.log(`📊 WEBSOCKET: Getting system resources for character: ${socketInfo.characterId}`);
      const instance = consciousnessEngine.instances.get(socketInfo.characterId);
      if (!instance || !instance.processManager) {
        console.warn(`❌ WEBSOCKET: Character instance not found: ${socketInfo.characterId}`);
        socket.emit('error', { message: 'Character instance not found' });
        return;
      }
      const resources = instance.processManager.getSystemResourceUsage();
      console.log('✅ WEBSOCKET: Sending system resources:', resources);
      socket.emit('system-resources', { resources, timestamp: new Date().toISOString() });
    } catch (err) {
      error('Error fetching system resources', { error: err });
      socket.emit('error', { message: `Failed to fetch system resources: ${err.message}` });
    }
  });

  socket.on('get-error-logs', async () => {
    console.log('🚨 WEBSOCKET: Received get-error-logs request');
    try {
      const socketInfo = handlers.connectedSockets.get(socket.id);
      if (!socketInfo || !socketInfo.characterId) {
        console.warn('❌ WEBSOCKET: No character being monitored for error logs');
        socket.emit('error', { message: 'No character being monitored' });
        return;
      }
      console.log(`🚨 WEBSOCKET: Getting error logs for character: ${socketInfo.characterId}`);
      const errors = await consciousnessEngine.getErrors(socketInfo.characterId);
      console.log('✅ WEBSOCKET: Sending error logs:', errors);
      socket.emit('error-logs', { errors, timestamp: new Date().toISOString() });
    } catch (err) {
      error('Error fetching error logs', { error: err });
      socket.emit('error', { message: `Failed to fetch error logs: ${err.message}` });
    }
  });

  socket.on('get-memory-allocation', async () => {
    console.log('🧠 WEBSOCKET: Received get-memory-allocation request');
    try {
      const socketInfo = handlers.connectedSockets.get(socket.id);
      if (!socketInfo || !socketInfo.characterId) {
        console.warn('❌ WEBSOCKET: No character being monitored for memory allocation');
        socket.emit('error', { message: 'No character being monitored' });
        return;
      }
      console.log(`🧠 WEBSOCKET: Getting memory allocation for character: ${socketInfo.characterId}`);
      const instance = consciousnessEngine.instances.get(socketInfo.characterId);
      if (!instance || !instance.memoryManager) {
        console.warn(`❌ WEBSOCKET: Character instance not found: ${socketInfo.characterId}`);
        socket.emit('error', { message: 'Character instance not found' });
        return;
      }
      const memoryData = instance.memoryManager.getMemoryDataForFrontend();
      console.log('✅ WEBSOCKET: Sending memory allocation:', memoryData);
      socket.emit('memory-allocation', { memoryData, timestamp: new Date().toISOString() });
    } catch (err) {
      error('Error fetching memory allocation data', { error: err });
      socket.emit('error', { message: `Failed to fetch memory allocation data: ${err.message}` });
    }
  });

  socket.on('disconnect', () => {
    info('Client disconnected', { socketId: socket.id });
    const socketInfo = handlers.connectedSockets.get(socket.id);
    if (socketInfo && socketInfo.isMonitoring) {
      consciousnessEngine.stopMonitoring(socket.id).catch(err => {
        error('Error stopping monitoring on disconnect', { error: err.message });
      });
    }
    handlers.connectedSockets.delete(socket.id);
  });
}
