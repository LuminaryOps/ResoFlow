/**
 * Main Application Entry Point for Resolume Arena Controller
 */

import { CONFIG } from './config.js';
import { connectionManager } from './connection.js';
import { compositionManager } from './composition.js';
import { clipsManager } from './clips.js';
import { layersManager } from './layers.js';
import { columnsManager } from './columns.js';
import { effectsManager } from './effects.js';
import { EventBus } from './event-bus.js';
import { TabManager } from './ui-utils.js';

class ResolumeController {
  constructor() {
    this.tabManager = new TabManager();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('Application already initialized');
      return;
    }

    try {
      console.log('%c🎬 Resolume Arena Controller Starting...', 
        'color: #00ff88; font-size: 16px; font-weight: bold;');
      
      // Log configuration info if debug is enabled
      if (CONFIG.DEBUG.ENABLED) {
        console.log('%cDebug mode enabled', 'color: #ffaa00; font-size: 12px;');
        this.logTroubleshootingInfo();
      }

      // Initialize all managers
      await this.initializeManagers();

      // Setup global event handlers
      this.setupGlobalEventHandlers();

      // Setup error handling
      this.setupErrorHandling();

      // Initialize connection manager (will attempt to connect)
      await connectionManager.initialize();

      this.isInitialized = true;
      
      console.log('%c✅ Resolume Arena Controller Ready!', 
        'color: #00ff88; font-size: 14px; font-weight: bold;');

      // Emit ready event
      EventBus.emit('app:ready');

    } catch (error) {
      console.error('Failed to initialize application:', error);
      alert('Failed to initialize application. Check console for details.');
    }
  }

  async initializeManagers() {
    // Initialize managers in dependency order
    await effectsManager.initialize();
    await compositionManager.initialize();
    await clipsManager.initialize();
    await layersManager.initialize();
    await columnsManager.initialize();
  }

  setupGlobalEventHandlers() {
    // Window focus/blur handlers
    window.addEventListener('focus', () => {
      EventBus.emit('app:focus');
      // Refresh data when window gains focus
      if (connectionManager.isConnected()) {
        EventBus.emit('composition:refresh');
      }
    });

    window.addEventListener('blur', () => {
      EventBus.emit('app:blur');
    });

    // Visibility change handler
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && connectionManager.isConnected()) {
        // Refresh data when tab becomes visible
        setTimeout(() => {
          EventBus.emit('composition:refresh');
        }, 500);
      }
    });

    // Page unload handler
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Global keyboard shortcuts
    this.setupGlobalKeyboardShortcuts();

    // Connection status handlers
    EventBus.on('connection:success', () => {
      console.log('✅ Connected to Resolume Arena');
    });

    EventBus.on('connection:error', (data) => {
      console.error('❌ Connection failed:', data.error);
    });

    EventBus.on('connection:lost', () => {
      console.warn('⚠️ Connection lost');
    });

    // Composition handlers
    EventBus.on('composition:loaded', () => {
      console.log('📊 Composition loaded');
    });
  }

  setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Only handle global shortcuts if no input is focused
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      // Tab switching shortcuts
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            this.tabManager.switchTab('clips');
            break;
          case '2':
            event.preventDefault();
            this.tabManager.switchTab('layers');
            break;
          case '3':
            event.preventDefault();
            this.tabManager.switchTab('columns');
            break;
          case '4':
            event.preventDefault();
            this.tabManager.switchTab('composition');
            break;
        }
      }

      // F5 to refresh
      if (event.key === 'F5') {
        event.preventDefault();
        if (connectionManager.isConnected()) {
          EventBus.emit('composition:refresh');
        }
      }

      // F12 to toggle debug info
      if (event.key === 'F12') {
        event.preventDefault();
        this.toggleDebugInfo();
      }
    });
  }

  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      EventBus.emit('app:error', { error: event.error });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      EventBus.emit('app:error', { error: event.reason });
    });

    // API error handler
    EventBus.on('api:error', (data) => {
      console.error('API Error:', data.error);
    });
  }

  logTroubleshootingInfo() {
    console.group('%cTroubleshooting Information', 'color: #00ccff; font-weight: bold;');
    console.log('%cIf you experience issues:', 'color: #ffaa00; font-size: 12px;');
    console.log('%c1. Check the console output for error messages', 'color: #aaa; font-size: 12px;');
    console.log('%c2. Verify Resolume Arena is running and web server is enabled', 'color: #aaa; font-size: 12px;');
    console.log('%c3. Check IP address and port in preferences', 'color: #aaa; font-size: 12px;');
    console.log('%c4. Make sure composition is not locked', 'color: #aaa; font-size: 12px;');
    console.log('%c5. Ensure clips have content loaded before adding effects', 'color: #aaa; font-size: 12px;');
    console.groupEnd();
  }

  toggleDebugInfo() {
    const info = this.getDebugInfo();
    console.group('%cDebug Information', 'color: #00ccff; font-weight: bold;');
    console.log('Connection:', info.connection);
    console.log('Composition:', info.composition);
    console.log('Managers:', info.managers);
    console.log('Performance:', info.performance);
    console.groupEnd();
  }

  getDebugInfo() {
    return {
      connection: connectionManager.getConnectionInfo(),
      composition: compositionManager.getCompositionInfo(),
      managers: {
        effects: {
          loaded: effectsManager.getAvailableEffects().length > 0,
          effectsCount: effectsManager.getAvailableEffects().length,
          sourcesCount: effectsManager.getAvailableSources().length
        },
        clips: {
          currentLayer: clipsManager.getCurrentLayer(),
          selectedClip: clipsManager.getSelectedClip()
        },
        layers: {
          selectedLayer: layersManager.getSelectedLayer(),
          layerCount: layersManager.getLayers().length
        },
        columns: {
          columnCount: columnsManager.getColumns().length,
          connectedCount: columnsManager.getConnectedColumns().length
        }
      },
      performance: {
        memoryUsage: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
        } : 'Not available',
        timing: performance.timing ? {
          loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart + ' ms'
        } : 'Not available'
      }
    };
  }

  // Public API methods
  async reconnect() {
    const ipInput = document.getElementById('ipAddress');
    if (ipInput) {
      await connectionManager.connect(ipInput.value);
    }
  }

  async refresh() {
    if (connectionManager.isConnected()) {
      EventBus.emit('composition:refresh');
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      connected: connectionManager.isConnected(),
      composition: compositionManager.isLoaded(),
      activeTab: this.tabManager.getActiveTab()
    };
  }

  // Cleanup method
  cleanup() {
    console.log('🧹 Cleaning up Resolume Controller...');
    
    connectionManager.disconnect();
    compositionManager.destroy();
    
    // Clear all event listeners
    EventBus.clear();
    
    this.isInitialized = false;
  }
}

// Create and initialize the application
const app = new ResolumeController();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.initialize();
  });
} else {
  app.initialize();
}

// Expose app instance globally for debugging
window.resolumeController = app;

// Export for module usage
export default app;
