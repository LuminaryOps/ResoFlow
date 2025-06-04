/**
 * Effects Management for Resolume Arena Controller
 */

import { api } from './api.js';
import { CONFIG } from './config.js';
import { UIUtils } from './ui-utils.js';
import { EventBus } from './event-bus.js';

export class EffectsManager {
  constructor() {
    this.availableEffects = [];
    this.availableSources = [];
  }

  async loadAvailableEffects() {
    try {
      const data = await api.getEffects();
      
      if (CONFIG.DEBUG.LOG_EFFECTS) {
        console.log('Effects API response structure:', data);
      }
      
      this.availableEffects = Array.isArray(data.video) ? data.video : [];
      
      if (this.availableEffects.length > 0 && CONFIG.DEBUG.LOG_EFFECTS) {
        console.log('Example effect structure:', this.availableEffects[0]);
      }
      
      EventBus.emit('effects:loaded', { effects: this.availableEffects });
      return this.availableEffects;
    } catch (error) {
      console.error('Failed to load available effects:', error);
      UIUtils.handleError(error, 'Failed to load effects');
      return [];
    }
  }

  async loadAvailableSources() {
    try {
      const data = await api.getSources();
      
      if (CONFIG.DEBUG.LOG_SOURCES) {
        console.log('Sources API response structure:', data);
      }
      
      this.availableSources = Array.isArray(data.video) ? data.video : [];
      
      if (this.availableSources.length > 0 && CONFIG.DEBUG.LOG_SOURCES) {
        console.log('Example source structure:', this.availableSources[0]);
      }
      
      EventBus.emit('sources:loaded', { sources: this.availableSources });
      return this.availableSources;
    } catch (error) {
      console.error('Failed to load available sources:', error);
      UIUtils.handleError(error, 'Failed to load sources');
      return [];
    }
  }

  renderEffectsList(container, onEffectClick, showPresets = true) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (this.availableEffects.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'list-item';
      emptyMessage.textContent = 'No effects available';
      container.appendChild(emptyMessage);
      return;
    }

    this.availableEffects.forEach((effect) => {
      const item = this.createEffectListItem(effect, onEffectClick);
      container.appendChild(item);
      
      // Add presets if available and requested
      if (showPresets && effect.presets && effect.presets.length > 0) {
        effect.presets.forEach((preset) => {
          const presetItem = this.createPresetListItem(effect, preset, onEffectClick);
          container.appendChild(presetItem);
        });
      }
    });
  }

  renderSourcesList(container, onSourceClick, showPresets = true) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (this.availableSources.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'list-item';
      emptyMessage.textContent = 'No sources available';
      container.appendChild(emptyMessage);
      return;
    }

    this.availableSources.forEach((source) => {
      const item = this.createSourceListItem(source, onSourceClick);
      container.appendChild(item);
      
      // Add presets if available and requested
      if (showPresets && source.presets && source.presets.length > 0) {
        source.presets.forEach((preset) => {
          const presetItem = this.createSourcePresetListItem(source, preset, onSourceClick);
          container.appendChild(presetItem);
        });
      }
    });
  }

  createEffectListItem(effect, onEffectClick) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.textContent = effect.name || effect.idstring;
    
    item.addEventListener('click', () => {
      const identifier = api.getPreferredIdentifier(effect);
      onEffectClick(identifier, effect);
    });
    
    return item;
  }

  createPresetListItem(effect, preset, onEffectClick) {
    const presetItem = document.createElement('div');
    presetItem.className = 'list-item';
    presetItem.textContent = `  → ${preset.name}`;
    presetItem.style.paddingLeft = '20px';
    presetItem.style.fontSize = '11px';
    presetItem.style.color = '#aaa';
    
    presetItem.addEventListener('click', () => {
      const baseIdentifier = api.getPreferredIdentifier(effect);
      const presetIdentifier = preset.id || preset.name;
      const fullIdentifier = `${baseIdentifier}/${presetIdentifier}`;
      onEffectClick(fullIdentifier, effect, preset);
    });
    
    return presetItem;
  }

  createSourceListItem(source, onSourceClick) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.textContent = source.name || source.idstring;
    
    item.addEventListener('click', () => {
      const identifier = api.getPreferredIdentifier(source);
      onSourceClick(identifier, source);
    });
    
    return item;
  }

  createSourcePresetListItem(source, preset, onSourceClick) {
    const presetItem = document.createElement('div');
    presetItem.className = 'list-item';
    presetItem.textContent = `  → ${preset.name}`;
    presetItem.style.paddingLeft = '20px';
    presetItem.style.fontSize = '11px';
    presetItem.style.color = '#aaa';
    
    presetItem.addEventListener('click', () => {
      const baseIdentifier = api.getPreferredIdentifier(source);
      const presetIdentifier = preset.id || preset.name;
      const fullIdentifier = `${baseIdentifier}/${presetIdentifier}`;
      onSourceClick(fullIdentifier, source, preset);
    });
    
    return presetItem;
  }

  async addEffectToClip(layerIndex, clipIndex, effectId) {
    try {
      // First check if the clip has content
      const layerData = await api.getLayer(layerIndex);
      const clipObj = layerData.clips[clipIndex - 1];
      
      if (!clipObj.video || (!clipObj.video.fileinfo && !clipObj.video.description)) {
        UIUtils.handleError(null, CONFIG.ERRORS.NO_CONTENT);
        return false;
      }
      
      const effectURI = api.buildEffectURI(effectId);
      
      if (CONFIG.DEBUG.LOG_EFFECTS) {
        console.log('Adding effect to clip:', effectURI);
      }
      
      await api.addEffectToClip(layerIndex, clipIndex, effectURI);
      
      UIUtils.showSuccessMessage(CONFIG.SUCCESS.EFFECT_ADDED);
      EventBus.emit('effect:added', { target: 'clip', layerIndex, clipIndex, effectId });
      
      return true;
    } catch (error) {
      this.handleEffectError(error, 'Failed to add effect to clip');
      return false;
    }
  }

  async addEffectToLayer(layerIndex, effectId) {
    try {
      const effectURI = api.buildEffectURI(effectId);
      
      if (CONFIG.DEBUG.LOG_EFFECTS) {
        console.log('Adding effect to layer:', effectURI);
      }
      
      await api.addEffectToLayer(layerIndex, effectURI);
      
      UIUtils.showSuccessMessage(CONFIG.SUCCESS.EFFECT_ADDED);
      EventBus.emit('effect:added', { target: 'layer', layerIndex, effectId });
      
      return true;
    } catch (error) {
      this.handleEffectError(error, 'Failed to add effect to layer');
      return false;
    }
  }

  async addEffectToComposition(effectId) {
    try {
      const effectURI = api.buildEffectURI(effectId);
      
      if (CONFIG.DEBUG.LOG_EFFECTS) {
        console.log('Adding effect to composition:', effectURI);
      }
      
      await api.addEffectToComposition(effectURI);
      
      UIUtils.showSuccessMessage(CONFIG.SUCCESS.EFFECT_ADDED);
      EventBus.emit('effect:added', { target: 'composition', effectId });
      
      return true;
    } catch (error) {
      this.handleEffectError(error, 'Failed to add effect to composition');
      return false;
    }
  }

  async assignSourceToClip(layerIndex, clipIndex, sourceId) {
    try {
      const sourceURI = api.buildSourceURI(sourceId);
      
      if (CONFIG.DEBUG.LOG_SOURCES) {
        console.log('Assigning source to clip:', sourceURI);
      }
      
      await api.openClipSource(layerIndex, clipIndex, sourceURI);
      
      UIUtils.showSuccessMessage(CONFIG.SUCCESS.SOURCE_ASSIGNED);
      EventBus.emit('source:assigned', { layerIndex, clipIndex, sourceId });
      
      return true;
    } catch (error) {
      this.handleSourceError(error, 'Failed to assign source to clip');
      return false;
    }
  }

  async removeEffectFromClip(layerIndex, clipIndex, effectIndex) {
    try {
      await api.removeEffectFromClip(layerIndex, clipIndex, effectIndex);
      EventBus.emit('effect:removed', { target: 'clip', layerIndex, clipIndex, effectIndex });
      return true;
    } catch (error) {
      console.error('Failed to remove effect from clip:', error);
      UIUtils.handleError(error, 'Failed to remove effect');
      return false;
    }
  }

  async removeEffectFromLayer(layerIndex, effectIndex) {
    try {
      await api.removeEffectFromLayer(layerIndex, effectIndex);
      EventBus.emit('effect:removed', { target: 'layer', layerIndex, effectIndex });
      return true;
    } catch (error) {
      console.error('Failed to remove effect from layer:', error);
      UIUtils.handleError(error, 'Failed to remove effect');
      return false;
    }
  }

  async removeEffectFromComposition(effectIndex) {
    try {
      await api.removeEffectFromComposition(effectIndex);
      EventBus.emit('effect:removed', { target: 'composition', effectIndex });
      return true;
    } catch (error) {
      console.error('Failed to remove effect from composition:', error);
      UIUtils.handleError(error, 'Failed to remove effect');
      return false;
    }
  }

  handleEffectError(error, defaultMessage) {
    let userMessage = defaultMessage;
    
    if (error.message.includes('412')) {
      userMessage = CONFIG.ERRORS.COMPOSITION_LOCKED + '\n\nPlease check:\n1. The composition is not locked in Resolume\n2. The target has content loaded\n3. Wait a moment if Resolume is processing';
    } else if (error.message.includes('400')) {
      userMessage = CONFIG.ERRORS.INVALID_EFFECT + ' - this effect may not be compatible with the target';
    }
    
    console.error(defaultMessage + ':', error);
    UIUtils.handleError(error, userMessage);
  }

  handleSourceError(error, defaultMessage) {
    let userMessage = defaultMessage;
    
    if (error.message.includes('412')) {
      userMessage = 'Cannot assign source: Make sure the composition is not locked and try again';
    }
    
    console.error(defaultMessage + ':', error);
    UIUtils.handleError(error, userMessage);
  }

  getAvailableEffects() {
    return this.availableEffects;
  }

  getAvailableSources() {
    return this.availableSources;
  }

  async initialize() {
    await Promise.all([
      this.loadAvailableEffects(),
      this.loadAvailableSources()
    ]);
  }
}

export const effectsManager = new EffectsManager();