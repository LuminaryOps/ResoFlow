/**
 * Parameter Utilities for Resolume Arena Controller
 */

import { PARAMETER_TYPES } from './config.js';
import { UIUtils } from './ui-utils.js';

export class ParameterUtils {
  static createParameterSection(title, params, updateCallback) {
    const section = document.createElement('div');
    section.className = 'param-section';
    
    const titleElement = document.createElement('h4');
    titleElement.textContent = title;
    section.appendChild(titleElement);
    
    const paramGrid = document.createElement('div');
    paramGrid.className = 'param-grid';
    
    this.renderParameters(params, paramGrid, updateCallback);
    section.appendChild(paramGrid);
    
    return section;
  }

  static renderParameters(params, container, updateCallback, prefix = '') {
    Object.entries(params).forEach(([key, param]) => {
      if (!param || typeof param !== 'object') return;
      
      const fullPath = prefix ? `${prefix}.${key}` : key;
      
      if (param.value !== undefined) {
        // It's a parameter
        const paramEl = this.createParameterElement(key, param, fullPath, updateCallback);
        if (paramEl) container.appendChild(paramEl);
      } else if (param.valuetype === undefined) {
        // It's a nested object
        this.renderParameters(param, container, updateCallback, fullPath);
      }
    });
  }

  static createParameterElement(name, param, fullPath, updateCallback) {
    if (!param || param.value === undefined) return null;
    
    const item = document.createElement('div');
    item.className = 'param-item';
    
    switch (param.valuetype) {
      case PARAMETER_TYPES.RANGE:
        return this.createRangeParameter(item, name, param, fullPath, updateCallback);
      
      case PARAMETER_TYPES.CHOICE:
      case PARAMETER_TYPES.STATE:
        return this.createChoiceParameter(item, name, param, fullPath, updateCallback);
      
      case PARAMETER_TYPES.BOOLEAN:
        return this.createBooleanParameter(item, name, param, fullPath, updateCallback);
      
      case PARAMETER_TYPES.STRING:
      case PARAMETER_TYPES.TEXT:
        return this.createStringParameter(item, name, param, fullPath, updateCallback);
      
      case PARAMETER_TYPES.COLOR:
        return this.createColorParameter(item, name, param, fullPath, updateCallback);
      
      case PARAMETER_TYPES.EVENT:
        return this.createEventParameter(item, name, param, fullPath, updateCallback);
      
      default:
        // Handle by value type if valuetype is not set
        return this.createParameterByValueType(item, name, param, fullPath, updateCallback);
    }
  }

  static createRangeParameter(item, name, param, fullPath, updateCallback) {
    const min = param.min ?? 0;
    const max = param.max ?? 1;
    const step = param.view?.step ?? 0.01;
    const value = param.value ?? min;
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'param-name';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    
    const valueSpan = document.createElement('span');
    valueSpan.textContent = this.formatParameterValue(value, param);
    
    nameDiv.appendChild(nameSpan);
    nameDiv.appendChild(valueSpan);
    
    const slider = UIUtils.createSlider(min, max, value, step, async (newValue) => {
      valueSpan.textContent = this.formatParameterValue(newValue, param);
      await updateCallback(fullPath, newValue);
    });
    
    item.appendChild(nameDiv);
    item.appendChild(slider);
    
    return item;
  }

  static createChoiceParameter(item, name, param, fullPath, updateCallback) {
    const nameDiv = document.createElement('div');
    nameDiv.className = 'param-name';
    nameDiv.textContent = name;
    
    const select = UIUtils.createSelect(
      param.options || [],
      param.value,
      async (newValue) => {
        await updateCallback(fullPath, newValue);
      }
    );
    
    item.appendChild(nameDiv);
    item.appendChild(select);
    
    return item;
  }

  static createBooleanParameter(item, name, param, fullPath, updateCallback) {
    const nameDiv = document.createElement('div');
    nameDiv.className = 'param-name';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    
    const checkbox = UIUtils.createCheckbox(param.value, async (checked) => {
      await updateCallback(fullPath, checked);
    });
    
    nameDiv.appendChild(nameSpan);
    nameDiv.appendChild(checkbox);
    item.appendChild(nameDiv);
    
    return item;
  }

  static createStringParameter(item, name, param, fullPath, updateCallback) {
    const nameDiv = document.createElement('div');
    nameDiv.className = 'param-name';
    nameDiv.textContent = name;
    
    const input = UIUtils.createTextInput(param.value, async (newValue) => {
      await updateCallback(fullPath, newValue);
    });
    
    item.appendChild(nameDiv);
    item.appendChild(input);
    
    return item;
  }

  static createColorParameter(item, name, param, fullPath, updateCallback) {
    const nameDiv = document.createElement('div');
    nameDiv.className = 'param-name';
    nameDiv.textContent = name;
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = param.value;
    colorInput.onchange = async function() {
      await updateCallback(fullPath, this.value);
    };
    
    item.appendChild(nameDiv);
    item.appendChild(colorInput);
    
    return item;
  }

  static createEventParameter(item, name, param, fullPath, updateCallback) {
    const button = UIUtils.createButton(name, 'btn-event', async () => {
      await updateCallback(fullPath, true);
    });
    
    item.appendChild(button);
    
    return item;
  }

  static createParameterByValueType(item, name, param, fullPath, updateCallback) {
    const value = param.value;
    
    if (typeof value === 'number') {
      return this.createRangeParameter(item, name, {
        ...param,
        min: param.min ?? 0,
        max: param.max ?? 1
      }, fullPath, updateCallback);
    } else if (typeof value === 'boolean') {
      return this.createBooleanParameter(item, name, param, fullPath, updateCallback);
    } else if (typeof value === 'string') {
      if (param.options) {
        return this.createChoiceParameter(item, name, param, fullPath, updateCallback);
      } else {
        return this.createStringParameter(item, name, param, fullPath, updateCallback);
      }
    }
    
    return null;
  }

  static formatParameterValue(value, param) {
    if (param.view) {
      const multiplier = param.view.multiplier || 1;
      const suffix = param.view.suffix || '';
      const units = param.view.display_units;
      
      let displayValue = value * multiplier;
      
      switch (units) {
        case 'percent':
          return Math.round(displayValue) + '%';
        case 'degrees':
          return Math.round(displayValue) + '°';
        case 'decibels':
          return displayValue.toFixed(1) + ' dB';
        case 'milliseconds':
          return Math.round(displayValue) + ' ms';
        case 'seconds':
          return displayValue.toFixed(2) + ' s';
        case 'integer':
          return Math.round(displayValue).toString();
        default:
          return displayValue.toFixed(2) + suffix;
      }
    }
    
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    return value.toString();
  }

  static createEffectElement(effect, index, type, removeCallback) {
    const effectDiv = document.createElement('div');
    effectDiv.className = 'effect-item';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'effect-header';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'effect-name';
    nameDiv.textContent = effect.display_name || effect.name;
    
    const removeBtn = UIUtils.createButton('Remove', 'btn-remove', removeCallback);
    
    headerDiv.appendChild(nameDiv);
    headerDiv.appendChild(removeBtn);
    effectDiv.appendChild(headerDiv);
    
    // Add bypassed control if available
    if (effect.bypassed) {
      const bypassContainer = document.createElement('div');
      bypassContainer.style.marginTop = '10px';
      
      const bypassLabel = document.createElement('span');
      bypassLabel.textContent = 'Bypass: ';
      bypassLabel.style.marginRight = '10px';
      
      const bypassCheckbox = UIUtils.createCheckbox(effect.bypassed.value, async (checked) => {
        // Update bypass state - this would need to be connected to the API
        console.log(`Toggle bypass for effect ${effect.id}: ${checked}`);
      });
      
      bypassContainer.appendChild(bypassLabel);
      bypassContainer.appendChild(bypassCheckbox);
      effectDiv.appendChild(bypassContainer);
    }
    
    // Add effect parameters
    if (effect.params && Object.keys(effect.params).length > 0) {
      const paramsDiv = document.createElement('div');
      paramsDiv.className = 'effect-params';
      
      this.renderParameters(effect.params, paramsDiv, async (paramName, value) => {
        // Update effect parameter
        const updateBody = { params: {} };
        updateBody.params[paramName] = { value: value };
        
        try {
          await api.updateEffectById(effect.id, updateBody);
        } catch (err) {
          console.error('Failed to update effect parameter:', err);
          UIUtils.handleError(err, 'Failed to update effect parameter');
        }
      });
      
      effectDiv.appendChild(paramsDiv);
    }
    
    // Add mixer parameters if available
    if (effect.mixer && Object.keys(effect.mixer).length > 0) {
      const mixerDiv = document.createElement('div');
      mixerDiv.className = 'effect-params';
      
      const mixerTitle = document.createElement('h5');
      mixerTitle.textContent = 'Mixer';
      mixerTitle.style.marginTop = '10px';
      mixerTitle.style.marginBottom = '5px';
      mixerTitle.style.color = '#00ccff';
      mixerDiv.appendChild(mixerTitle);
      
      this.renderParameters(effect.mixer, mixerDiv, async (paramName, value) => {
        // Update mixer parameter
        const updateBody = { mixer: {} };
        updateBody.mixer[paramName] = { value: value };
        
        try {
          await api.updateEffectById(effect.id, updateBody);
        } catch (err) {
          console.error('Failed to update mixer parameter:', err);
          UIUtils.handleError(err, 'Failed to update mixer parameter');
        }
      });
      
      effectDiv.appendChild(mixerDiv);
    }
    
    return effectDiv;
  }

  static createWarningMessage(title, message) {
    const warning = document.createElement('div');
    warning.className = 'warning-message';
    
    const titleElement = document.createElement('h4');
    titleElement.textContent = title;
    
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    
    warning.appendChild(titleElement);
    warning.appendChild(messageElement);
    
    return warning;
  }
}