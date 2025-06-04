# Resolume Arena Controller

A modular web-based controller for Resolume Arena & Avenue using the REST API. This application provides a responsive interface for controlling clips, layers, columns, and composition parameters from any web browser.

## 🏗️ Project Structure

The application has been refactored into a modular architecture for better maintainability and scalability:

```
resolume-controller/
├── index.html              # Main HTML structure
├── styles.css              # All CSS styles
├── js/
│   ├── main.js             # Main application entry point
│   ├── config.js           # Configuration constants
│   ├── api.js              # API communication layer
│   ├── connection.js       # Connection management
│   ├── event-bus.js        # Event system for inter-module communication
│   ├── ui-utils.js         # UI utility functions and helpers
│   ├── parameter-utils.js  # Parameter handling and rendering
│   ├── effects.js          # Effects and sources management
│   ├── clips.js            # Clips management
│   ├── layers.js           # Layers management
│   ├── columns.js          # Columns management
│   └── composition.js      # Composition management
└── README.md               # This documentation
```

## 🚀 Features

### Core Functionality
- **Real-time Connection Management**: Automatic connection handling with heartbeat monitoring
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modular Architecture**: Easy to extend and maintain
- **Event-Driven**: Decoupled modules communicate through an event bus
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Tabs and Features
1. **Clips Tab**: Browse clips by layer, trigger clips, assign sources, add effects
2. **Layers Tab**: Control layer properties, effects, bypass/solo states
3. **Columns Tab**: Trigger columns with keyboard shortcuts (1-9, 0)
4. **Composition Tab**: Master controls, crossfader, global effects

### Advanced Features
- **Keyboard Shortcuts**: Alt+1-4 for tab switching, 1-9/0 for columns, Ctrl+Z/Shift+Z for undo/redo
- **Auto-refresh**: Periodic updates when connection is active
- **Visual Feedback**: Real-time updates for connected clips and columns
- **Parameter Controls**: Sliders, dropdowns, checkboxes for all parameter types
- **Effect Management**: Add, remove, and configure effects with presets

## 🛠️ Setup and Installation

1. **Enable Resolume Web Server**:
   - Open Resolume Arena or Avenue
   - Go to Preferences → Webserver
   - Enable the web server (default port 8080)
   - Note the IP address shown

2. **Deploy the Controller**:
   - Place all files in a web-accessible directory
   - Or serve locally using a simple HTTP server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with http-server package)
   npx http-server
   ```

3. **Connect to Resolume**:
   - Open the controller in a web browser
   - Enter the IP address and port (e.g., `192.168.1.100:8080`)
   - Click Connect

## 🔧 Configuration

### Basic Configuration
Edit `js/config.js` to customize:

```javascript
export const CONFIG = {
  DEFAULT_IP: '192.168.12.146:8080',    // Default connection
  REFRESH_INTERVAL: 5000,               // Auto-refresh interval
  DEBUG: {
    ENABLED: true,                      // Enable debug logging
    LOG_API_CALLS: true,               // Log API requests
    LOG_EFFECTS: true,                 // Log effect operations
    LOG_SOURCES: true                  // Log source operations
  }
};
```

### Custom Styling
Modify `styles.css` for visual customization:
- Color scheme variables at the top
- Responsive breakpoints
- Animation timings
- Grid layouts

## 📖 API Reference

### Core Managers

#### ConnectionManager
```javascript
import { connectionManager } from './js/connection.js';

// Connect to Resolume
await connectionManager.connect('192.168.1.100:8080');

// Check connection status
const isConnected = connectionManager.isConnected();

// Get connection info
const info = connectionManager.getConnectionInfo();
```

#### CompositionManager
```javascript
import { compositionManager } from './js/composition.js';

// Load composition
await compositionManager.loadComposition();

// Get composition data
const composition = compositionManager.getComposition();

// Update composition parameter
await compositionManager.updateCompositionParameter('master', 0.8);
```

#### ClipsManager
```javascript
import { clipsManager } from './js/clips.js';

// Select layer
clipsManager.selectLayer(1, 'Layer 1');

// Trigger clip
await clipsManager.triggerClip(1);

// Select clip for editing
await clipsManager.selectClip(1);
```

#### EffectsManager
```javascript
import { effectsManager } from './js/effects.js';

// Load available effects
await effectsManager.loadAvailableEffects();

// Add effect to clip
await effectsManager.addEffectToClip(1, 1, 'Blow');

// Add source to clip
await effectsManager.assignSourceToClip(1, 1, 'Gradient');
```

### Event System
```javascript
import { EventBus } from './js/event-bus.js';

// Listen for events
EventBus.on('composition:loaded', (data) => {
  console.log('Composition loaded:', data.composition);
});

// Emit events
EventBus.emit('custom:event', { data: 'value' });

// One-time listener
EventBus.once('connection:success', () => {
  console.log('Connected!');
});
```

### Available Events

#### Connection Events
- `connection:success` - Connected to Resolume
- `connection:error` - Connection failed
- `connection:lost` - Connection lost
- `connection:disconnected` - Manually disconnected

#### Composition Events
- `composition:loaded` - Composition data loaded
- `composition:cleared` - Composition data cleared
- `composition:refresh` - Request composition refresh

#### UI Events
- `tab:changed` - Tab switched
- `app:ready` - Application initialized
- `ui:error` - UI error occurred
- `ui:success` - Success message

#### Manager Events
- `effect:added` - Effect added to target
- `effect:removed` - Effect removed from target
- `source:assigned` - Source assigned to clip
- `layer:selected` - Layer selected
- `clip:selected` - Clip selected

## 🧩 Extending the Controller

### Adding a New Manager
1. Create a new file in the `js/` directory
2. Follow the manager pattern:

```javascript
// js/my-manager.js
import { EventBus } from './event-bus.js';
import { api } from './api.js';

export class MyManager {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    EventBus.on('composition:loaded', (data) => {
      // Handle composition loaded
    });
  }

  async initialize() {
    // Initialization logic
  }
}

export const myManager = new MyManager();
```

3. Import and initialize in `main.js`:

```javascript
import { myManager } from './my-manager.js';

// In initializeManagers()
await myManager.initialize();
```

### Adding New API Endpoints
Extend the `APIClient` class in `api.js`:

```javascript
// In api.js
async getCustomData() {
  return this.get('/custom/endpoint');
}

async updateCustomData(data) {
  return this.put('/custom/endpoint', data);
}
```

### Creating Custom UI Components
Use the UI utilities in `ui-utils.js`:

```javascript
import { UIUtils } from './ui-utils.js';

// Create a slider
const slider = UIUtils.createSlider(0, 100, 50, 1, (value) => {
  console.log('Slider value:', value);
});

// Create a button
const button = UIUtils.createButton('Click Me', 'btn-primary', () => {
  console.log('Button clicked');
});
```

### Adding Parameter Types
Extend `parameter-utils.js` for new parameter types:

```javascript
// In parameter-utils.js
static createCustomParameter(item, name, param, fullPath, updateCallback) {
  // Custom parameter rendering logic
  return item;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify Resolume web server is enabled
   - Check IP address and port
   - Ensure no firewall blocking connection
   - Try `localhost:8080` if running on same machine

2. **Effects/Sources Not Loading**
   - Check browser console (F12) for error messages
   - Verify Resolume version compatibility
   - Ensure composition is not locked

3. **UI Not Updating**
   - Check network connectivity
   - Verify auto-refresh is working
   - Look for JavaScript errors in console

### Debug Mode
Enable debug mode in `config.js`:

```javascript
DEBUG: {
  ENABLED: true,
  LOG_API_CALLS: true,
  LOG_EFFECTS: true,
  LOG_SOURCES: true
}
```

Press F12 in the browser to view debug information.

## 🎯 Performance Tips

1. **Reduce Refresh Interval**: Increase `REFRESH_INTERVAL` for better performance
2. **Minimize Active Tabs**: Close unused browser tabs
3. **Network Optimization**: Use wired connection when possible
4. **Mobile Performance**: Use simplified view on mobile devices

## 📝 License

This project is open source. Feel free to modify and distribute.

## 🤝 Contributing

1. Follow the modular architecture patterns
2. Add proper error handling
3. Include JSDoc comments for public methods
4. Test on multiple devices and browsers
5. Update documentation for new features

## 📞 Support

For issues with Resolume Arena/Avenue, consult the official Resolume documentation.
For controller-specific issues, check the browser console for error messages and review this documentation.