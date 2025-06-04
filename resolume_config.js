/**
 * Configuration constants for Resolume Arena Controller
 */

export const CONFIG = {
  // Default connection settings
  DEFAULT_IP: '192.168.12.146:8080',
  
  // API endpoints
  API_ENDPOINTS: {
    PRODUCT: '/product',
    COMPOSITION: '/composition',
    EFFECTS: '/effects',
    SOURCES: '/sources',
    LAYERS: '/composition/layers',
    COLUMNS: '/composition/columns',
    CLIPS: '/composition/layers/{layer}/clips/{clip}',
    THUMBNAILS: '/composition/layers/{layer}/clips/{clip}/thumbnail'
  },
  
  // Refresh intervals (in milliseconds)
  REFRESH_INTERVAL: 5000,
  
  // UI settings
  UI: {
    CLIP_GRID_MIN_WIDTH: '80px',
    COLUMN_GRID_MIN_WIDTH: '60px',
    DROPDOWN_MAX_HEIGHT: '200px',
    EFFECTS_LIST_MAX_HEIGHT: '150px'
  },
  
  // Error messages
  ERRORS: {
    CONNECTION_FAILED: 'Connection failed - check IP address',
    COMPOSITION_LOCKED: 'Cannot perform action: Composition may be locked',
    INVALID_EFFECT: 'Invalid effect specification',
    NO_CONTENT: 'Load a source first before adding effects',
    NETWORK_OFFLINE: 'Network offline',
    LOADING_FAILED: 'Failed to load data'
  },
  
  // Success messages
  SUCCESS: {
    EFFECT_ADDED: '✅ Effect added successfully!',
    SOURCE_ASSIGNED: '✅ Source assigned successfully!',
    CONNECTION_ESTABLISHED: 'Connected to Resolume Arena'
  },
  
  // Debug settings
  DEBUG: {
    ENABLED: true,
    LOG_API_CALLS: true,
    LOG_EFFECTS: true,
    LOG_SOURCES: true
  }
};

export const PARAMETER_TYPES = {
  RANGE: 'ParamRange',
  CHOICE: 'ParamChoice',
  STATE: 'ParamState',
  BOOLEAN: 'ParamBoolean',
  STRING: 'ParamString',
  TEXT: 'ParamText',
  COLOR: 'ParamColor',
  EVENT: 'ParamEvent',
  NUMBER: 'ParamNumber'
};

export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};