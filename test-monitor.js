// Test script to verify monitor functionality
import { io } from 'socket.io-client';

console.log('Testing monitor WebSocket functionality...');

// Connect to the server
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('✓ Connected to server');
    
    // Test starting monitoring
    console.log('Testing start-monitoring event...');
    socket.emit('start-monitoring', { characterId: 'alexander-kane' });
});

socket.on('monitoring-started', (data) => {
    console.log('✓ Monitoring started:', data);
    
    // Test data requests
    console.log('Testing refresh-monitor event...');
    socket.emit('refresh-monitor');
});

socket.on('system-resources', (data) => {
    console.log('✓ System resources received:', JSON.stringify(data, null, 2));
});

socket.on('error-logs', (data) => {
    console.log('✓ Error logs received:', JSON.stringify(data, null, 2));
});

socket.on('memory-allocation', (data) => {
    console.log('✓ Memory allocation received:', JSON.stringify(data, null, 2));
});

socket.on('consciousness-update', (data) => {
    console.log('✓ Consciousness update received:', JSON.stringify(data, null, 2));
});

socket.on('error', (error) => {
    console.error('✗ Socket error:', error);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Keep the script running
setTimeout(() => {
    console.log('Test complete. Stopping monitoring...');
    socket.emit('stop-monitoring', { characterId: 'alexander-kane' });
    setTimeout(() => {
        socket.disconnect();
        process.exit(0);
    }, 1000);
}, 10000);
