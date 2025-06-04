/**
 * API Communication Layer for Resolume Arena Controller
 */

import { CONFIG } from './config.js';

class APIClient {
  constructor() {
    this.baseURL = `http://${CONFIG.DEFAULT_IP}/api/v1`;
  }

  setBaseURL(ipAddress) {
    this.baseURL = `http://${ipAddress}/api/v1`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    if (CONFIG.DEBUG.LOG_API_CALLS) {
      console.log(`API Call: ${options.method || 'GET'} ${url}`);
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Return response object for non-JSON responses (like thumbnails)
      if (options.responseType === 'blob' || options.responseType === 'arrayBuffer') {
        return response;
      }

      // Try to parse JSON, but handle empty responses
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error(`API Error: ${error.message}`);
      throw error;
    }
  }

  // GET requests
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST requests
  async post(endpoint, data = null, contentType = 'application/json') {
    const options = {
      method: 'POST',
      headers: {}
    };

    if (data !== null) {
      if (contentType === 'text/plain') {
        options.headers['Content-Type'] = 'text/plain';
        options.body = data;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
    }

    return this.request(endpoint, options);
  }

  // PUT requests
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE requests
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Product info
  async getProduct() {
    return this.get(CONFIG.API_ENDPOINTS.PRODUCT);
  }

  // Composition
  async getComposition() {
    return this.get(CONFIG.API_ENDPOINTS.COMPOSITION);
  }

  async updateComposition(data) {
    return this.put(CONFIG.API_ENDPOINTS.COMPOSITION, data);
  }

  // Effects
  async getEffects() {
    return this.get(CONFIG.API_ENDPOINTS.EFFECTS);
  }

  // Sources
  async getSources() {
    return this.get(CONFIG.API_ENDPOINTS.SOURCES);
  }

  // Layers
  async getLayer(layerIndex) {
    return this.get(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}`);
  }

  async updateLayer(layerIndex, data) {
    return this.put(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}`, data);
  }

  async selectLayer(layerIndex) {
    return this.post(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/select`);
  }

  // Clips
  async getClip(layerIndex, clipIndex) {
    return this.get(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/clips/${clipIndex}`);
  }

  async updateClip(layerIndex, clipIndex, data) {
    return this.put(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/clips/${clipIndex}`, data);
  }

  async selectClip(layerIndex, clipIndex) {
    return this.post(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/clips/${clipIndex}/select`, {});
  }

  async connectClip(layerIndex, clipIndex, connect = null) {
    const data = connect !== null ? connect : undefined;
    return this.post(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/clips/${clipIndex}/connect`, data);
  }

  async openClipSource(layerIndex, clipIndex, sourceURI) {
    return this.post(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/clips/${clipIndex}/open`, sourceURI, 'text/plain');
  }

  async getClipThumbnail(layerIndex, clipIndex) {
    return this.request(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/clips/${clipIndex}/thumbnail`, {
      responseType: 'blob'
    });
  }

  // Columns
  async connectColumn(columnIndex, connect = null) {
    const data = connect !== null ? connect : undefined;
    return this.post(`${CONFIG.API_ENDPOINTS.COLUMNS}/${columnIndex}/connect`, data);
  }

  // Effects
  async addEffectToClip(layerIndex, clipIndex, effectURI) {
    return this.post(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/clips/${clipIndex}/effects/video/add`, effectURI, 'text/plain');
  }

  async addEffectToLayer(layerIndex, effectURI) {
    return this.post(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/effects/video/add`, effectURI, 'text/plain');
  }

  async addEffectToComposition(effectURI) {
    return this.post(`/composition/effects/video/add`, effectURI, 'text/plain');
  }

  async removeEffectFromClip(layerIndex, clipIndex, effectIndex) {
    return this.delete(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/clips/${clipIndex}/effects/video/${effectIndex + 1}`);
  }

  async removeEffectFromLayer(layerIndex, effectIndex) {
    return this.delete(`${CONFIG.API_ENDPOINTS.LAYERS}/${layerIndex}/effects/video/${effectIndex + 1}`);
  }

  async removeEffectFromComposition(effectIndex) {
    return this.delete(`/composition/effects/video/${effectIndex + 1}`);
  }

  async updateEffectById(effectId, data) {
    return this.put(`/composition/effects/by-id/${effectId}`, data);
  }

  // Parameter helpers
  buildEffectURI(effectId, preset = null) {
    let uri = `effect:///video/${effectId}`;
    if (preset) {
      uri += `/${preset}`;
    }
    return uri;
  }

  buildSourceURI(sourceId, preset = null) {
    let uri = `source:///video/${sourceId}`;
    if (preset) {
      uri += `/${preset}`;
    }
    return uri;
  }

  // Helper for determining which identifier to use (name vs idstring)
  getPreferredIdentifier(item) {
    // If idstring looks like a UUID (contains dashes), use the name
    if (item.idstring && item.idstring.includes('-')) {
      return item.name;
    }
    // Otherwise prefer idstring over name
    return item.idstring || item.name;
  }
}

export const api = new APIClient();