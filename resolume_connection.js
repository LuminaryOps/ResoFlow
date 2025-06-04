/**
 * Connection Management for Resolume Arena Controller
 */

import { api } from './api.js';
import { CONFIG, CONNECTION_STATES } from './config.js';
import { EventBus } from './event-bus.js';

class ConnectionManager {
  constructor() {
    this.state = CONNECTION_STATES.DISCONNECTED;
    this.currentIP = CONFIG.DEFAULT_IP;
    this.checkInterval = null;
  }

  async connect(ipAddress) {
    if (!ipAddress || !ipAddress.trim()) {
      throw new Error('IP address is required');
    }

    this.currentIP = ipAddress.trim();
    this.setState(CONNECTION_STATES.CONNECTING);
    
    // Update API base URL
    api.setBaseURL(this.currentIP);
    
    try {
      // Test connection with product endpoint
      await api.getProduct();
      
      this.setState(CONNECTION_STATES.CONNECTED);
      this.updateUI();
      this.startHeartbeat();
      
      // Emit connection success event
      EventBus.emit('connection:success', { ip: this.currentIP });
      
      return true;
    } catch (error) {
      this.setState(CONNECTION_STATES.ERROR);
      this.updateUI();
      
      // Emit connection error event
      EventBus.emit('connection:error', { error: error.message, ip: this.currentIP });
      
      throw error;
    }
  }

  disconnect() {
    this.setState(CONNECTION_STATES.DISCONNECTED);
    this.stopHeartbeat();
    this.updateUI();
    
    // Emit disconnect event
    EventBus.emit('connection:disconnected');
  }

  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    
    if (oldState !== newState) {
      EventBus.emit('connection:stateChange', { oldState, newState });
    }
  }

  isConnected() {
    return this.state === CONNECTION_STATES.CONNECTED;
  }

  updateUI() {
    const statusElement = document.getElementById('connectionStatus');
    
    switch (this.state) {
      case CONNECTION_STATES.CONNECTING:
        statusElement.textContent = `Connecting to ${this.currentIP}...`;
        statusElement.classList.remove('connected');
        break;
        
      case CONNECTION_STATES.CONNECTED:
        statusElement.textContent = `${CONFIG.SUCCESS.CONNECTION_ESTABLISHED} at ${this.currentIP}`;
        statusElement.classList.add('connected');
        break;
        
      case CONNECTION_STATES.ERROR:
        statusElement.textContent = CONFIG.ERRORS.CONNECTION_FAILED;
        statusElement.classList.remove('connected');
        break;
        
      case CONNECTION_STATES.DISCONNECTED:
      default:
        statusElement.textContent = 'Not connected';
        statusElement.classList.remove('connected');
        break;
    }
  }

  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing interval
    
    this.checkInterval = setInterval(async () => {
      try {
        await api.getProduct();
        // Connection is still alive
        if (this.state !== CONNECTION_STATES.CONNECTED) {
          this.setState(CONNECTION_STATES.CONNECTED);
          this.updateUI();
        }
      } catch (error) {
        console.warn('Heartbeat failed:', error.message);
        this.setState(CONNECTION_STATES.ERROR);
        this.updateUI();
        this.stopHeartbeat();
        
        EventBus.emit('connection:lost', { error: error.message });
      }
    }, 10000); // Check every 10 seconds
  }

  stopHeartbeat() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  setupUI() {
    const ipInput = document.getElementById('ipAddress');
    const connectBtn = document.getElementById('connectBtn');

    // Set default IP
    ipInput.value = this.currentIP;

    // Connect button handler
    connectBtn.addEventListener('click', async () => {
      try {
        await this.connect(ipInput.value);
      } catch (error) {
        console.error('Connection failed:', error);
        // Error is already handled in connect method
      }
    });

    // Enter key support for IP input
    ipInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        try {
          await this.connect(ipInput.value);
        } catch (error) {
          console.error('Connection failed:', error);
        }
      }
    });

    // Network status handlers
    window.addEventListener('offline', () => {
      this.setState(CONNECTION_STATES.ERROR);
      const statusElement = document.getElementById('connectionStatus');
      statusElement.textContent = CONFIG.ERRORS.NETWORK_OFFLINE;
      statusElement.classList.remove('connected');
    });

    window.addEventListener('online', () => {
      this.setState(CONNECTION_STATES.DISCONNECTED);
      const statusElement = document.getElementById('connectionStatus');
      statusElement.textContent = 'Network online - click Connect to reconnect';
      statusElement.classList.remove('connected');
    });
  }

  async initialize() {
    this.setupUI();
    
    // Try to connect with default IP on startup
    try {
      await this.connect(this.currentIP);
    } catch (error) {
      console.log('Initial connection failed, waiting for user input');
    }
  }

  // Get current connection info
  getConnectionInfo() {
    return {
      state: this.state,
      ip: this.currentIP,
      isConnected: this.isConnected()
    };
  }
}

export const connectionManager = new ConnectionManager();