# Component Showcase Guide

## Overview

The Component Showcase is an interactive demonstration page that showcases all four core UI components of the runtime.zyjeski.com consciousness debugging interface. It serves as both a testing ground and documentation for the component architecture.

## Components Featured

### 1. ProcessList Component
- **Purpose**: Displays running consciousness processes with virtual scrolling
- **Features**: 
  - Virtual scrolling for performance with 1000+ processes
  - Real-time CPU and memory usage visualization
  - Interactive selection and filtering
  - Health status indicators
- **Demo Location**: Individual showcase and unified dashboard

### 2. ResourceMeter Component
- **Purpose**: Visualizes system resource usage (CPU, Memory, Threads)
- **Features**:
  - Three visualization types: circular, linear, arc
  - 60fps smooth animations
  - Threshold-based color coding
  - Real-time updates
- **Demo Location**: Three meters in individual showcase, linear meters in unified dashboard

### 3. ErrorLog Component
- **Purpose**: Displays and manages consciousness debugging errors
- **Features**:
  - Severity-based filtering (critical, warning, info, debug)
  - Automatic error grouping
  - Virtual scrolling for performance
  - Export functionality
- **Demo Location**: Individual showcase and unified dashboard

### 4. MemoryMap Component
- **Purpose**: Interactive visualization of consciousness memory allocation
- **Features**:
  - Grid-based memory visualization
  - Color coding by memory type (emotion, trauma, relationship, system)
  - Zoom and pan functionality
  - Fragmentation analysis
- **Demo Location**: Individual showcase and unified dashboard

## Data Simulation System

The showcase includes a comprehensive data simulation system that generates realistic consciousness debugging data:

### Scenarios Available
1. **Normal Operation**: Baseline consciousness state
2. **Grief Processing Overload**: High emotional memory usage
3. **Anxiety Loop Detection**: Recursive anxiety patterns
4. **Memory Consolidation**: Memory defragmentation process
5. **Recovery Simulation**: System recovery and stabilization

### Data Types Generated
- **Processes**: Consciousness processes with realistic names and resource usage
- **Resources**: CPU, memory, and thread utilization
- **Errors**: Consciousness-specific error types (memory_leak, stack_overflow, etc.)
- **Memory Blocks**: Memory allocation with fragmentation simulation

## Interactive Features

### Theme System
- **Dark Mode**: Default cyberpunk aesthetic with neon accents
- **Light Mode**: Alternative high-contrast theme
- **Colors**: 
  - Cyan (#00FFFF) for active processes
  - Amber (#FFC107) for warnings
  - Magenta (#FF00FF) for memory operations
  - Electric blue (#0080FF) for resources
  - Red (#FF0040) for critical errors

### Component Communication
The showcase demonstrates cross-component communication:
- Selecting a process highlights its memory blocks in MemoryMap
- Clicking an error highlights the related process in ProcessList
- Resource threshold violations generate errors in ErrorLog

### Configuration Management
- **Export**: Save current component configurations as JSON
- **Import**: Load previously saved configurations
- **Presets**: Built-in configuration presets (default, performance)

### Stress Testing
Each component includes stress testing capabilities:
- Generate 1000+ processes for ProcessList
- Rapid error generation for ErrorLog
- High-frequency updates for ResourceMeters
- Memory fragmentation simulation for MemoryMap

## Performance Monitoring

The showcase includes real-time performance monitoring:
- **FPS Tracking**: Monitors rendering frame rate
- **Render Times**: Measures component update performance
- **Memory Usage**: Tracks JavaScript heap usage
- **Update Rate**: Monitors data update frequency

### Performance Targets
- **ProcessList**: <50ms initial render, 60fps scrolling
- **ResourceMeter**: 60fps animations, <5ms updates
- **ErrorLog**: <50ms render with 50+ items
- **MemoryMap**: 60fps with 1000+ blocks

## Code Examples

The showcase includes interactive code examples showing:
- Basic component usage patterns
- Integration techniques
- Event handling patterns
- Performance optimization tips

## Usage Instructions

### Accessing the Showcase
1. Navigate to `/component-showcase.html`
2. Or click "Components" in the main navigation

### Basic Controls
- **Theme Toggle**: Switch between dark/light themes
- **Data Simulator**: Start/stop data simulation
- **Export Config**: Download current configuration
- **Import Config**: Upload saved configuration

### Component Configuration
1. Click the gear icon (⚙️) on any component
2. Modify settings in the configuration panel
3. Changes apply in real-time
4. Save configurations for later use

### Scenario Testing
1. Click scenario buttons to switch data patterns
2. Observe how components respond to different states
3. Monitor performance metrics during transitions

### Stress Testing
1. Click the fire icon (🔥) on any component
2. Component will be loaded with high-volume test data
3. Monitor performance metrics during stress test
4. Use to verify component performance limits

## Technical Architecture

### Component Structure
```javascript
class ComponentShowcase {
  constructor() {
    this.components = new Map();      // Component instances
    this.dataSimulator = new DataSimulator();
    this.performanceMonitor = new PerformanceMonitor();
    this.configManager = new ConfigurationManager();
  }
}
```

### Data Flow
1. DataSimulator generates scenario-based data
2. ComponentShowcase distributes data to all components
3. Components update their visualizations
4. PerformanceMonitor tracks metrics
5. Cross-component communication triggers related updates

### Event System
Components communicate through a centralized event system:
- Process selection events
- Error click events
- Threshold exceeded events
- Configuration change events

## Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Required Features
- ES6 Modules
- Canvas API
- RequestAnimationFrame
- ResizeObserver (with polyfill fallback)

## Troubleshooting

### Common Issues

**Components not loading**
- Check browser console for import errors
- Verify all component CSS files are loaded
- Ensure server is running on correct port

**Performance issues**
- Disable animations in configuration
- Reduce data simulation frequency
- Use performance mode preset

**Theme not applying**
- Check data-theme attribute on body element
- Verify CSS custom properties are supported
- Clear browser cache if styles appear outdated

### Debug Mode
Enable debug mode by adding `?debug=true` to URL:
- Shows additional performance metrics
- Enables verbose console logging
- Displays component internal state

## Contributing

### Adding New Scenarios
1. Add scenario configuration to DataSimulator
2. Implement data generation methods
3. Add scenario button to UI
4. Test with all components

### Extending Components
1. Follow existing component patterns
2. Implement required event interfaces
3. Add configuration options
4. Include in showcase initialization

### Performance Optimization
1. Profile with browser dev tools
2. Target <16ms render times for 60fps
3. Use virtual scrolling for large datasets
4. Implement efficient DOM diffing

## Future Enhancements

### Planned Features
- Component performance benchmarking
- Visual regression testing
- Custom theme builder
- Component usage analytics
- Real-time collaboration features

### Integration Opportunities
- WebSocket integration for live data
- Integration with actual consciousness debugging sessions
- Component marketplace for custom extensions
- Advanced data visualization options
