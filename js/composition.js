/**
 * Composition Management for Resolume Arena Controller
 */

import { api } from './api.js';
import { UIUtils, LoadingManager } from './ui-utils.js';
import { ParameterUtils } from './parameter-utils.js';
import { effectsManager } from './effects.js';
import { EventBus } from './event-bus.js';
import { connectionManager } from './connection.js';

export class CompositionManager {
  constructor() {
    this.composition = null;
    this.loadingManager = new LoadingManager();
    this.refreshInterval = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    EventBus.on('connection:success', () => {
      this.loadComposition();
    });

    EventBus.on('connection:disconnected', () => {
      this.clearComposition();
    });

    EventBus.on('connection:lost', () => {
      this.clearComposition();
    });

    EventBus.on('tab:changed', (data) => {
      if (data.tabName === 'composition') {
        this.renderCompositionControls();
      }
    });

    EventBus.on('composition:refresh', () => {
      this.loadComposition();
    });

    EventBus.on('effect:added', (data) => {
      if (data.target === 'composition') {
        this.refreshCompositionControls();
      }
    });
  }

  async loadComposition() {
    if (!connectionManager.isConnected()) {
      console.log('Not connected, skipping composition load');
      return;
    }
    
    this.loadingManager.show('composition');
    
    try {
      this.composition = await api.getComposition();
      
      if (this.composition) {
        // Emit loaded event for other modules
        EventBus.emit('composition:loaded', { composition: this.composition });
        
        // Initialize effects manager if not already done
        if (effectsManager.getAvailableEffects().length === 0) {
          await effectsManager.initialize();
        }
        
        console.log('Composition loaded successfully');
      }
      
    } catch (error) {
      console.error('Failed to load composition:', error);
      UIUtils.handleError(error, 'Failed to load composition');
      
      // Emit error event
      EventBus.emit('composition:loadError', { error });
      
    } finally {
      this.loadingManager.hide('composition');
    }
  }

  clearComposition() {
    this.composition = null;
    this.stopAutoRefresh();
    
    // Clear all UI
    UIUtils.clearContainer('clipGrid');
    UIUtils.hideElement('clipDetails');
    UIUtils.clearContainer('layerList');
    UIUtils.hideElement('layerDetails');
    UIUtils.clearContainer('columnGrid');
    UIUtils.clearContainer('compositionInfo');
    
    // Reset layer dropdown
    document.getElementById('layerDropdownLabel').textContent = 'Select Layer…';
    UIUtils.clearContainer('layerDropdownMenu');
    
    EventBus.emit('composition:cleared');
  }

  renderCompositionControls() {
    if (!this.composition) return;

    const container = document.getElementById('compositionInfo');
    if (!container) return;

    container.innerHTML = '';

    this.renderCompositionParameters(container);
    this.renderCompositionEffects(container);
    this.renderAvailableEffects(container);
  }

  renderCompositionParameters(container) {
    // Create sections for different parameter groups
    const sections = {
      'Master Controls': {
        master: this.composition.master,
        speed: this.composition.speed
      },
      'Crossfader': this.composition.crossfader ? {
        phase: this.composition.crossfader.phase,
        behaviour: this.composition.crossfader.behaviour,
        curve: this.composition.crossfader.curve
      } : {},
      'Composition Parameters': {},
      'Dashboard': this.composition.dashboard || {},
      'Video': this.composition.video || {},
      'Audio': this.composition.audio || {},
      'Tempo Controller': this.composition.tempo_controller || {}
    };

    // Extract main composition parameters
    Object.entries(this.composition).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.value !== undefined && 
          !['master', 'speed', 'crossfader', 'dashboard', 'video', 'audio', 'tempo_controller', 
            'decks', 'layers', 'columns', 'layergroups'].includes(key)) {
        sections['Composition Parameters'][key] = value;
      }
    });

    // Render each section
    Object.entries(sections).forEach(([sectionName, params]) => {
      if (params && Object.keys(params).length > 0) {
        const section = ParameterUtils.createParameterSection(sectionName, params, 
          (paramName, value) => this.updateCompositionParameter(paramName, value));
        container.appendChild(section);
      }
    });
  }

  renderCompositionEffects(container) {
    if (this.composition.video && this.composition.video.effects && 
        this.composition.video.effects.length > 0) {
      
      const effectsSection = document.createElement('div');
      effectsSection.className = 'param-section';
      effectsSection.innerHTML = '<h4>Video Effects</h4>';
      
      this.composition.video.effects.forEach((effect, idx) => {
        const effectEl = ParameterUtils.createEffectElement(effect, idx, 'video', 
          () => this.removeCompositionEffect(idx));
        effectsSection.appendChild(effectEl);
      });
      
      container.appendChild(effectsSection);
    }
  }

  renderAvailableEffects(container) {
    const listsSection = document.createElement('div');
    listsSection.className = 'param-section';
    listsSection.innerHTML = `
      <h4>Available Effects</h4>
      <div id="compositionAvailableEffects" class="list-scroll"></div>
    `;
    container.appendChild(listsSection);

    const effectsContainer = document.getElementById('compositionAvailableEffects');
    if (effectsContainer) {
      effectsManager.renderEffectsList(effectsContainer, async (effectId) => {
        const success = await effectsManager.addEffectToComposition(effectId);
        
        if (success) {
          await this.refreshCompositionControls();
        }
      });
    }
  }

  async updateCompositionParameter(paramPath, value) {
    const updateBody = {};
    const pathParts = paramPath.split('.');
    let current = updateBody;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      current[pathParts[i]] = {};
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = { value: value };

    try {
      await api.updateComposition(updateBody);
      EventBus.emit('composition:parameterChanged', { paramPath, value });
    } catch (error) {
      console.error(`Failed to update composition param ${paramPath}:`, error);
      UIUtils.handleError(error, 'Failed to update composition parameter');
    }
  }

  async removeCompositionEffect(effectIndex) {
    const success = await effectsManager.removeEffectFromComposition(effectIndex);
    
    if (success) {
      await this.refreshCompositionControls();
    }
  }

  async refreshCompositionControls() {
    if (this.composition) {
      await this.loadComposition();
      this.renderCompositionControls();
    }
  }

  // Auto-refresh functionality
  startAutoRefresh(interval = 5000) {
    this.stopAutoRefresh();
    
    this.refreshInterval = setInterval(async () => {
      if (connectionManager.isConnected()) {
        // Only refresh if no sliders are being actively used
        const activeSliders = document.querySelectorAll('.slider:active');
        if (activeSliders.length === 0) {
          await this.loadComposition();
          EventBus.emit('refresh:columns');
        }
      }
    }, interval);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Composition actions
  async disconnectAllClips() {
    try {
      await api.post('/composition/disconnect-all');
      EventBus.emit('composition:allClipsDisconnected');
      UIUtils.showSuccessMessage('All clips disconnected');
    } catch (error) {
      console.error('Failed to disconnect all clips:', error);
      UIUtils.handleError(error, 'Failed to disconnect all clips');
    }
  }

  async undoAction() {
    try {
      await api.post('/composition/action', 'undo', 'text/plain');
      EventBus.emit('composition:actionUndone');
      UIUtils.showSuccessMessage('Action undone');
    } catch (error) {
      console.error('Failed to undo action:', error);
      UIUtils.handleError(error, 'Failed to undo action');
    }
  }

  async redoAction() {
    try {
      await api.post('/composition/action', 'redo', 'text/plain');
      EventBus.emit('composition:actionRedone');
      UIUtils.showSuccessMessage('Action redone');
    } catch (error) {
      console.error('Failed to redo action:', error);
      UIUtils.handleError(error, 'Failed to redo action');
    }
  }

  // Keyboard shortcuts for composition actions
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Only handle if no input is focused
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undoAction();
      }
      
      // Ctrl/Cmd + Shift + Z for redo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        this.redoAction();
      }
      
      // Escape to disconnect all clips
      if (event.key === 'Escape') {
        event.preventDefault();
        this.disconnectAllClips();
      }
    });
  }

  // Public API
  getComposition() {
    return this.composition;
  }

  isLoaded() {
    return this.composition !== null;
  }

  getCompositionInfo() {
    if (!this.composition) return null;
    
    return {
      name: this.composition.name?.value || 'Untitled',
      layers: this.composition.layers?.length || 0,
      columns: this.composition.columns?.length || 0,
      layerGroups: this.composition.layergroups?.length || 0,
      decks: this.composition.decks?.length || 0
    };
  }

  async initialize() {
    this.setupKeyboardShortcuts();
    this.startAutoRefresh();
  }

  // Cleanup
  destroy() {
    this.stopAutoRefresh();
    EventBus.clear('composition:loaded');
    EventBus.clear('composition:cleared');
    EventBus.clear('composition:refresh');
  }
}

export const compositionManager = new CompositionManager();
