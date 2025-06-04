/**
 * UI Utility Functions
 */

import { EventBus } from './event-bus.js';

export class UIUtils {
  static showLoading(show) {
    document.getElementById('loading').classList.toggle('active', show);
  }

  static showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'block';
    }
  }

  static hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'none';
    }
  }

  static clearContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
  }

  static addClassToElement(elementId, className) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add(className);
    }
  }

  static removeClassFromElement(elementId, className) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove(className);
    }
  }

  static formatValue(value, decimals = 2) {
    if (typeof value === 'number') {
      return value.toFixed(decimals);
    }
    return value;
  }

  static formatPercentage(value) {
    return Math.round(value * 100) + '%';
  }

  static createButton(text, classes = '', onClick = null) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `btn ${classes}`.trim();
    
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  static createSlider(min, max, value, step = 0.01, onChange = null) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    
    if (onChange) {
      slider.oninput = function() {
        onChange(parseFloat(this.value));
      };
    }
    
    return slider;
  }

  static createSelect(options, selectedValue = null, onChange = null) {
    const select = document.createElement('select');
    select.className = 'param-select';
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      optionElement.selected = option === selectedValue;
      select.appendChild(optionElement);
    });
    
    if (onChange) {
      select.onchange = function() {
        onChange(this.value);
      };
    }
    
    return select;
  }

  static createCheckbox(checked = false, onChange = null) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    
    if (onChange) {
      checkbox.onchange = function() {
        onChange(this.checked);
      };
    }
    
    return checkbox;
  }

  static createTextInput(value = '', onChange = null) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    
    if (onChange) {
      input.onchange = function() {
        onChange(this.value);
      };
    }
    
    return input;
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static handleError(error, userMessage = null) {
    console.error('Error:', error);
    
    if (userMessage) {
      alert(userMessage);
    }
    
    EventBus.emit('ui:error', { error, userMessage });
  }

  static showSuccessMessage(message) {
    console.log(`%c${message}`, 'color: #00ff88; font-weight: bold;');
    EventBus.emit('ui:success', { message });
  }

  static isElementVisible(element) {
    if (!element) return false;
    return element.offsetParent !== null;
  }

  static scrollToElement(elementId, behavior = 'smooth') {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior });
    }
  }

  static createThumbnailImage(src, alt = '', onError = null) {
    const img = document.createElement('img');
    img.className = 'clip-thumbnail';
    img.src = src;
    img.alt = alt;
    
    if (onError) {
      img.onerror = onError;
    } else {
      img.onerror = function() {
        this.style.display = 'none';
      };
    }
    
    return img;
  }

  static fadeIn(element, duration = 300) {
    element.style.opacity = 0;
    element.style.display = 'block';
    
    let start = null;
    
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  }

  static fadeOut(element, duration = 300, callback = null) {
    let start = null;
    const initialOpacity = parseFloat(getComputedStyle(element).opacity);
    
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.max(initialOpacity - (progress / duration), 0);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        if (callback) callback();
      }
    }
    
    requestAnimationFrame(animate);
  }
}

// Tab management
export class TabManager {
  constructor() {
    this.activeTab = 'clips';
    this.setupTabs();
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  switchTab(tabName) {
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Store active tab
    this.activeTab = tabName;

    // Emit tab change event
    EventBus.emit('tab:changed', { tabName });
  }

  getActiveTab() {
    return this.activeTab;
  }
}

// Loading state management
export class LoadingManager {
  constructor() {
    this.loadingStates = new Set();
  }

  show(id = 'default') {
    this.loadingStates.add(id);
    this.updateUI();
  }

  hide(id = 'default') {
    this.loadingStates.delete(id);
    this.updateUI();
  }

  isLoading(id = 'default') {
    return this.loadingStates.has(id);
  }

  updateUI() {
    const hasAnyLoading = this.loadingStates.size > 0;
    UIUtils.showLoading(hasAnyLoading);
  }

  clear() {
    this.loadingStates.clear();
    this.updateUI();
  }
}
