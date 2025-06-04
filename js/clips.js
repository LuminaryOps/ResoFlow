/**
 * Clips Management for Resolume Arena Controller
 */

import { api } from './api.js';
import { UIUtils } from './ui-utils.js';
import { ParameterUtils } from './parameter-utils.js';
import { effectsManager } from './effects.js';
import { EventBus } from './event-bus.js';

export class ClipsManager {
  constructor() {
    this.currentLayer = null;
    this.selectedClip = null;
    this.setupEventListeners();
    this.setupLayerDropdown();
  }

  setupEventListeners() {
    EventBus.on('composition:loaded', (data) => {
      this.populateLayerDropdown(data.composition);
    });

    EventBus.on('effect:added', (data) => {
      if (data.target === 'clip' && data.clipIndex === this.selectedClip) {
        this.refreshClipDetails();
      }
    });

    EventBus.on('source:assigned', (data) => {
      if (data.clipIndex === this.selectedClip) {
        this.refreshClips();
        this.refreshClipDetails();
      }
    });
  }

  setupLayerDropdown() {
    const dropdownBtn = document.getElementById('layerDropdownBtn');
    const dropdownMenu = document.getElementById('layerDropdownMenu');

    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleLayerDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        this.closeLayerDropdown();
      }
    });
  }

  populateLayerDropdown(composition) {
    const menu = document.getElementById('layerDropdownMenu');
    menu.innerHTML = '';

    if (!composition || !Array.isArray(composition.layers)) {
      const div = document.createElement('div');
      div.className = 'dropdown-item';
      div.textContent = 'No layers available';
      menu.appendChild(div);
      return;
    }

    composition.layers.forEach((layer, idx) => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      let layerName = layer.name.value || `Layer ${idx + 1}`;
      item.textContent = layerName;
      item.dataset.layer = idx + 1;

      item.addEventListener('click', () => {
        this.selectLayer(idx + 1, layerName);
      });

      menu.appendChild(item);
    });
  }

  toggleLayerDropdown() {
    const menu = document.getElementById('layerDropdownMenu');
    const btn = document.getElementById('layerDropdownBtn');

    if (menu.style.display === 'block') {
      this.closeLayerDropdown();
    } else {
      this.openLayerDropdown();
    }
  }

  openLayerDropdown() {
    document.getElementById('layerDropdownMenu').style.display = 'block';
    document.getElementById('layerDropdownBtn').classList.add('open');
  }

  closeLayerDropdown() {
    document.getElementById('layerDropdownMenu').style.display = 'none';
    document.getElementById('layerDropdownBtn').classList.remove('open');
  }

  selectLayer(layerIndex, layerName) {
    this.closeLayerDropdown();
    document.getElementById('layerDropdownLabel').textContent = layerName;
    this.currentLayer = layerIndex;
    this.selectedClip = null;
    this.hideClipDetails();
    this.loadClips();
  }

  async loadClips() {
    if (!this.currentLayer) return;

    UIUtils.clearContainer('clipGrid');

    try {
      const layerData = await api.getLayer(this.currentLayer);
      
      layerData.clips.forEach((clip, idx) => {
        const clipElement = this.createClipElement(clip, idx + 1);
        document.getElementById('clipGrid').appendChild(clipElement);
      });
    } catch (error) {
      console.error('Failed to load clips:', error);
      UIUtils.handleError(error, 'Failed to load clips');
    }
  }

  createClipElement(clip, index) {
    const wrapper = document.createElement('div');
    wrapper.className = `clip ${clip.connected.value === 'Connected' ? 'connected' : ''}`;
    wrapper.id = `clip-${index}`;

    // Thumbnail
    const thumb = UIUtils.createThumbnailImage(
      `${api.baseURL}/composition/layers/${this.currentLayer}/clips/${index}/thumbnail`,
      `Clip ${index} thumbnail`
    );
    wrapper.appendChild(thumb);

    // Click area for triggering
    const clickArea = document.createElement('div');
    clickArea.className = 'click-area';
    clickArea.addEventListener('click', () => {
      this.triggerClip(index);
    });
    wrapper.appendChild(clickArea);

    // Label for selection
    const labelDiv = document.createElement('div');
    labelDiv.className = 'clip-select-label';
    labelDiv.textContent = clip.name.value || `Clip ${index}`;
    labelDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectClip(index);
    });
    wrapper.appendChild(labelDiv);

    return wrapper;
  }

  async triggerClip(clipIndex) {
    if (!this.currentLayer || !clipIndex) return;

    try {
      await api.connectClip(this.currentLayer, clipIndex);
      
      // Refresh clips after a short delay to see the connection state
      setTimeout(() => this.loadClips(), 100);
    } catch (error) {
      console.error('Failed to trigger clip:', error);
      UIUtils.handleError(error, 'Failed to trigger clip');
    }
  }

  async selectClip(clipIndex) {
    this.selectedClip = clipIndex;

    // Update visual selection
    document.querySelectorAll('.clip').forEach((c) =>
      c.id === `clip-${clipIndex}` ? c.classList.add('selected') : c.classList.remove('selected')
    );

    try {
      await api.selectClip(this.currentLayer, clipIndex);
      await this.loadClipDetails(clipIndex);
      UIUtils.showElement('clipDetails');
    } catch (error) {
      console.error(`Failed to select clip ${clipIndex}:`, error);
      UIUtils.handleError(error, 'Failed to select clip');
    }
  }

  hideClipDetails() {
    UIUtils.hideElement('clipDetails');
    UIUtils.clearContainer('clipInfo');
    document.querySelectorAll('.clip').forEach((c) => c.classList.remove('selected'));
    this.selectedClip = null;
  }

  async loadClipDetails(clipIndex) {
    if (!this.currentLayer || !clipIndex) return;

    const clipInfo = document.getElementById('clipInfo');
    clipInfo.innerHTML = '';

    try {
      const layerData = await api.getLayer(this.currentLayer);
      const clipObj = layerData.clips[clipIndex - 1];

      if (clipObj) {
        this.renderClipParameters(clipObj, clipInfo);
        await this.renderClipEffectsAndSources(clipObj, clipInfo);
      }
    } catch (error) {
      console.error('Failed to retrieve clip details:', error);
      UIUtils.handleError(error, 'Failed to load clip details');
    }
  }

  renderClipParameters(clipObj, container) {
    // Create sections for different parameter groups
    const sections = {
      'Clip Parameters': {},
      'Dashboard': clipObj.dashboard || {},
      'Transport': clipObj.transport || {},
      'Video': clipObj.video || {},
      'Audio': clipObj.audio || {}
    };

    // Extract main clip parameters
    Object.entries(clipObj).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.value !== undefined && 
          !['dashboard', 'transport', 'video', 'audio', 'thumbnail'].includes(key)) {
        sections['Clip Parameters'][key] = value;
      }
    });

    // Render each section
    Object.entries(sections).forEach(([sectionName, params]) => {
      if (params && Object.keys(params).length > 0) {
        const section = ParameterUtils.createParameterSection(sectionName, params, 
          (paramName, value) => this.updateClipParameter(paramName, value));
        container.appendChild(section);
      }
    });

    // Add video effects section
    if (clipObj.video && clipObj.video.effects && clipObj.video.effects.length > 0) {
      const effectsSection = this.createEffectsSection(clipObj.video.effects);
      container.appendChild(effectsSection);
    }
  }

  createEffectsSection(effects) {
    const effectsSection = document.createElement('div');
    effectsSection.className = 'param-section';
    effectsSection.innerHTML = '<h4>Video Effects</h4>';
    
    effects.forEach((effect, idx) => {
      const effectEl = ParameterUtils.createEffectElement(effect, idx, 'video', 
        () => this.removeClipEffect(idx));
      effectsSection.appendChild(effectEl);
    });
    
    return effectsSection;
  }

  async renderClipEffectsAndSources(clipObj, container) {
    const listsSection = document.createElement('div');
    listsSection.className = 'param-section';
    
    // Check if clip has content
    const hasContent = clipObj.video && (clipObj.video.fileinfo || clipObj.video.description);
    
    if (hasContent) {
      listsSection.innerHTML = `
        <h4>Available Effects</h4>
        <div id="availableEffects" class="list-scroll"></div>
        <h4 style="margin-top: 15px;">Available Sources</h4>
        <div id="availableSources" class="list-scroll"></div>
      `;
    } else {
      listsSection.innerHTML = `
        <div class="warning-message">
          <h4>⚠️ No content loaded</h4>
          <p>Load a source first before adding effects</p>
        </div>
        <h4>Available Sources</h4>
        <div id="availableSources" class="list-scroll"></div>
      `;
    }
    
    container.appendChild(listsSection);

    // Render effects list
    if (hasContent) {
      this.renderAvailableEffects();
    }
    
    // Render sources list
    this.renderAvailableSources();
  }

  renderAvailableEffects() {
    const container = document.getElementById('availableEffects');
    if (!container || !this.currentLayer) return;

    effectsManager.renderEffectsList(container, async (effectId) => {
      if (this.selectedClip) {
        const success = await effectsManager.addEffectToClip(
          this.currentLayer, 
          this.selectedClip, 
          effectId
        );
        
        if (success) {
          await this.refreshClips();
          await this.refreshClipDetails();
        }
      }
    });
  }

  renderAvailableSources() {
    const container = document.getElementById('availableSources');
    if (!container || !this.selectedClip || !this.currentLayer) return;

    effectsManager.renderSourcesList(container, async (sourceId) => {
      const success = await effectsManager.assignSourceToClip(
        this.currentLayer,
        this.selectedClip,
        sourceId
      );
      
      if (success) {
        await this.refreshClips();
        await this.refreshClipDetails();
      }
    });
  }

  async updateClipParameter(paramPath, value) {
    if (!this.currentLayer || !this.selectedClip) return;

    const updateBody = {};
    const pathParts = paramPath.split('.');
    let current = updateBody;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      current[pathParts[i]] = {};
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = { value: value };

    try {
      await api.updateClip(this.currentLayer, this.selectedClip, updateBody);
    } catch (error) {
      console.error(`Failed to update clip param ${paramPath}:`, error);
      UIUtils.handleError(error, 'Failed to update clip parameter');
    }
  }

  async removeClipEffect(effectIndex) {
    if (!this.currentLayer || !this.selectedClip) return;

    const success = await effectsManager.removeEffectFromClip(
      this.currentLayer,
      this.selectedClip,
      effectIndex
    );

    if (success) {
      await this.loadClipDetails(this.selectedClip);
    }
  }

  async refreshClips() {
    if (this.currentLayer) {
      await this.loadClips();
    }
  }

  async refreshClipDetails() {
    if (this.selectedClip) {
      await this.loadClipDetails(this.selectedClip);
    }
  }

  // Public API
  getCurrentLayer() {
    return this.currentLayer;
  }

  getSelectedClip() {
    return this.selectedClip;
  }

  async initialize() {
    // Any initialization logic
  }
}

export const clipsManager = new ClipsManager();
