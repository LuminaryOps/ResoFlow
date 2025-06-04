/**
 * Layers Management for Resolume Arena Controller
 */

import { api } from './api.js';
import { UIUtils } from './ui-utils.js';
import { ParameterUtils } from './parameter-utils.js';
import { effectsManager } from './effects.js';
import { EventBus } from './event-bus.js';

export class LayersManager {
  constructor() {
    this.selectedLayer = null;
    this.layers = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    EventBus.on('composition:loaded', (data) => {
      this.layers = data.composition.layers || [];
      this.renderLayers();
    });

    EventBus.on('tab:changed', (data) => {
      if (data.tabName === 'layers') {
        this.renderLayers();
      }
    });

    EventBus.on('effect:added', (data) => {
      if (data.target === 'layer' && data.layerIndex === this.selectedLayer) {
        this.refreshLayerDetails();
      }
    });
  }

  renderLayers() {
    const container = document.getElementById('layerList');
    if (!container) return;

    container.innerHTML = '';

    this.layers.forEach((layer, idx) => {
      const layerEl = this.createLayerElement(layer, idx + 1);
      container.appendChild(layerEl);
    });
  }

  createLayerElement(layer, index) {
    const div = document.createElement('div');
    div.className = `layer-item ${layer.selected?.value ? 'selected' : ''}`;
    div.id = `layer-${index}`;
    
    const layerName = layer.name?.value || `Layer ${index}`;
    
    div.innerHTML = `
      <div class="layer-header">
        <div class="layer-name">${layerName}</div>
        <div class="layer-controls">
          <button class="btn btn-bypass ${layer.bypassed?.value ? 'active' : ''}">Bypass</button>
          <button class="btn btn-solo ${layer.solo?.value ? 'active' : ''}">Solo</button>
        </div>
      </div>
      <div class="slider-container">
        <div class="slider-label">
          <span>Opacity</span>
          <span>${UIUtils.formatPercentage(layer.video?.opacity?.value || 1)}</span>
        </div>
        <input
          type="range"
          class="slider"
          min="0"
          max="100"
          value="${(layer.video?.opacity?.value || 1) * 100}"
        />
      </div>
      <div class="slider-container">
        <div class="slider-label">
          <span>Volume</span>
          <span>${UIUtils.formatPercentage(layer.master?.value || 1)}</span>
        </div>
        <input
          type="range"
          class="slider"
          min="0"
          max="100"
          value="${(layer.master?.value || 1) * 100}"
        />
      </div>
    `;

    this.setupLayerControls(div, layer, index);
    return div;
  }

  setupLayerControls(element, layer, index) {
    // Bypass button
    const bypassBtn = element.querySelector('.btn-bypass');
    bypassBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.toggleLayerBypass(index);
    });
    
    // Solo button
    const soloBtn = element.querySelector('.btn-solo');
    soloBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.toggleLayerSolo(index);
    });

    // Opacity slider
    const opacitySlider = element.querySelectorAll('.slider')[0];
    const opacityLabel = element.querySelectorAll('.slider-label span')[1];
    
    opacitySlider.oninput = UIUtils.throttle(async function() {
      const value = parseFloat(this.value);
      opacityLabel.textContent = UIUtils.formatPercentage(value / 100);
      await this.updateLayerOpacity(index, value / 100);
    }.bind(this), 100);
    
    // Volume slider
    const volumeSlider = element.querySelectorAll('.slider')[1];
    const volumeLabel = element.querySelectorAll('.slider-label span')[3];
    
    volumeSlider.oninput = UIUtils.throttle(async function() {
      const value = parseFloat(this.value);
      volumeLabel.textContent = UIUtils.formatPercentage(value / 100);
      await this.updateLayerVolume(index, value / 100);
    }.bind(this), 100);

    // Layer selection
    element.addEventListener('click', async (e) => {
      if (e.target.tagName.toLowerCase() === 'button' ||
          e.target.tagName.toLowerCase() === 'input') {
        return;
      }
      await this.selectLayer(index);
    });
  }

  async toggleLayerBypass(layerIndex) {
    try {
      const layer = this.layers[layerIndex - 1];
      const newValue = !layer.bypassed?.value;
      
      await api.updateLayer(layerIndex, {
        bypassed: { value: newValue }
      });
      
      // Update local state
      if (layer.bypassed) {
        layer.bypassed.value = newValue;
      }
      
      // Update UI
      const layerElement = document.getElementById(`layer-${layerIndex}`);
      const bypassBtn = layerElement?.querySelector('.btn-bypass');
      if (bypassBtn) {
        bypassBtn.classList.toggle('active', newValue);
      }
      
      EventBus.emit('layer:bypassToggled', { layerIndex, bypassed: newValue });
    } catch (error) {
      console.error('Failed to toggle bypass:', error);
      UIUtils.handleError(error, 'Failed to toggle bypass');
    }
  }

  async toggleLayerSolo(layerIndex) {
    try {
      const layer = this.layers[layerIndex - 1];
      const newValue = !layer.solo?.value;
      
      await api.updateLayer(layerIndex, {
        solo: { value: newValue }
      });
      
      // Update local state
      if (layer.solo) {
        layer.solo.value = newValue;
      }
      
      // Update UI
      const layerElement = document.getElementById(`layer-${layerIndex}`);
      const soloBtn = layerElement?.querySelector('.btn-solo');
      if (soloBtn) {
        soloBtn.classList.toggle('active', newValue);
      }
      
      EventBus.emit('layer:soloToggled', { layerIndex, solo: newValue });
    } catch (error) {
      console.error('Failed to toggle solo:', error);
      UIUtils.handleError(error, 'Failed to toggle solo');
    }
  }

  async updateLayerOpacity(layerIndex, value) {
    try {
      await api.updateLayer(layerIndex, {
        video: { opacity: { value: value } }
      });
      
      // Update local state
      const layer = this.layers[layerIndex - 1];
      if (layer.video && layer.video.opacity) {
        layer.video.opacity.value = value;
      }
      
      EventBus.emit('layer:opacityChanged', { layerIndex, opacity: value });
    } catch (error) {
      console.error('Failed to update opacity:', error);
      UIUtils.handleError(error, 'Failed to update opacity');
    }
  }

  async updateLayerVolume(layerIndex, value) {
    try {
      await api.updateLayer(layerIndex, {
        master: { value: value }
      });
      
      // Update local state
      const layer = this.layers[layerIndex - 1];
      if (layer.master) {
        layer.master.value = value;
      }
      
      EventBus.emit('layer:volumeChanged', { layerIndex, volume: value });
    } catch (error) {
      console.error('Failed to update volume:', error);
      UIUtils.handleError(error, 'Failed to update volume');
    }
  }

  async selectLayer(layerIndex) {
    this.selectedLayer = layerIndex;
    
    // Update visual selection
    document.querySelectorAll('.layer-item').forEach((item) =>
      item.id === `layer-${layerIndex}` ? item.classList.add('selected') : item.classList.remove('selected')
    );
    
    try {
      await api.selectLayer(layerIndex);
      await this.loadLayerDetails(layerIndex);
      EventBus.emit('layer:selected', { layerIndex });
    } catch (error) {
      console.error('Failed to select layer:', error);
      UIUtils.handleError(error, 'Failed to select layer');
    }
  }

  async loadLayerDetails(layerIndex) {
    const layerDetails = document.getElementById('layerDetails');
    const layerInfo = document.getElementById('layerInfo');
    
    UIUtils.showElement('layerDetails');
    layerInfo.innerHTML = '';

    try {
      const layerData = await api.getLayer(layerIndex);
      
      this.renderLayerParameters(layerData, layerInfo, layerIndex);
      await this.renderLayerEffects(layerData, layerInfo, layerIndex);
      
    } catch (error) {
      console.error('Failed to load layer details:', error);
      UIUtils.handleError(error, 'Failed to load layer details');
    }
  }

  renderLayerParameters(layerData, container, layerIndex) {
    // Create sections for different parameter groups
    const sections = {
      'Layer Parameters': {},
      'Dashboard': layerData.dashboard || {},
      'Transition': layerData.transition || {},
      'Video': layerData.video || {},
      'Audio': layerData.audio || {}
    };

    // Extract main layer parameters
    Object.entries(layerData).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.value !== undefined && 
          !['dashboard', 'transition', 'video', 'audio', 'clips'].includes(key)) {
        sections['Layer Parameters'][key] = value;
      }
    });

    // Render each section
    Object.entries(sections).forEach(([sectionName, params]) => {
      if (params && Object.keys(params).length > 0) {
        const section = ParameterUtils.createParameterSection(sectionName, params, 
          (paramName, value) => this.updateLayerParameter(layerIndex, paramName, value));
        container.appendChild(section);
      }
    });
  }

  async renderLayerEffects(layerData, container, layerIndex) {
    // Add video effects section
    if (layerData.video && layerData.video.effects && layerData.video.effects.length > 0) {
      const effectsSection = this.createLayerEffectsSection(layerData.video.effects, layerIndex);
      container.appendChild(effectsSection);
    }

    // Available effects
    const listsSection = document.createElement('div');
    listsSection.className = 'param-section';
    listsSection.innerHTML = `
      <h4>Available Effects</h4>
      <div id="layerAvailableEffects" class="list-scroll"></div>
    `;
    container.appendChild(listsSection);

    this.renderLayerAvailableEffects(layerIndex);
  }

  createLayerEffectsSection(effects, layerIndex) {
    const effectsSection = document.createElement('div');
    effectsSection.className = 'param-section';
    effectsSection.innerHTML = '<h4>Video Effects</h4>';
    
    effects.forEach((effect, idx) => {
      const effectEl = ParameterUtils.createEffectElement(effect, idx, 'video', 
        () => this.removeLayerEffect(layerIndex, idx));
      effectsSection.appendChild(effectEl);
    });
    
    return effectsSection;
  }

  renderLayerAvailableEffects(layerIndex) {
    const container = document.getElementById('layerAvailableEffects');
    if (!container) return;

    effectsManager.renderEffectsList(container, async (effectId) => {
      const success = await effectsManager.addEffectToLayer(layerIndex, effectId);
      
      if (success) {
        await this.refreshLayerDetails();
        EventBus.emit('composition:refresh');
      }
    });
  }

  async updateLayerParameter(layerIndex, paramPath, value) {
    const updateBody = {};
    const pathParts = paramPath.split('.');
    let current = updateBody;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      current[pathParts[i]] = {};
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = { value: value };

    try {
      await api.updateLayer(layerIndex, updateBody);
      EventBus.emit('layer:parameterChanged', { layerIndex, paramPath, value });
    } catch (error) {
      console.error(`Failed to update layer param ${paramPath}:`, error);
      UIUtils.handleError(error, 'Failed to update layer parameter');
    }
  }

  async removeLayerEffect(layerIndex, effectIndex) {
    const success = await effectsManager.removeEffectFromLayer(layerIndex, effectIndex);
    
    if (success) {
      await this.loadLayerDetails(layerIndex);
    }
  }

  async refreshLayerDetails() {
    if (this.selectedLayer) {
      await this.loadLayerDetails(this.selectedLayer);
    }
  }

  // Public API
  getSelectedLayer() {
    return this.selectedLayer;
  }

  getLayers() {
    return this.layers;
  }

  getLayer(index) {
    return this.layers[index - 1];
  }

  async initialize() {
    // Any initialization logic
  }
}

export const layersManager = new LayersManager();
