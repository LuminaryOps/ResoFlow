/**
 * Columns Management for Resolume Arena Controller
 */

import { api } from './api.js';
import { UIUtils } from './ui-utils.js';
import { EventBus } from './event-bus.js';

export class ColumnsManager {
  constructor() {
    this.columns = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    EventBus.on('composition:loaded', (data) => {
      this.columns = data.composition.columns || [];
      this.renderColumns();
    });

    EventBus.on('tab:changed', (data) => {
      if (data.tabName === 'columns') {
        this.renderColumns();
      }
    });

    // Auto-refresh columns periodically when tab is active
    EventBus.on('refresh:columns', () => {
      this.renderColumns();
    });
  }

  renderColumns() {
    const container = document.getElementById('columnGrid');
    if (!container) return;

    container.innerHTML = '';

    this.columns.forEach((columnObj, idx) => {
      const btn = this.createColumnElement(columnObj, idx + 1);
      container.appendChild(btn);
    });
  }

  createColumnElement(columnObj, index) {
    const button = document.createElement('button');
    button.className = 'column-btn';
    button.id = `column-${index}`;
    
    if (columnObj.connected?.value === 'Connected') {
      button.classList.add('connected');
    }
    
    const numberSpan = document.createElement('span');
    numberSpan.className = 'column-number';
    numberSpan.textContent = index;
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'column-name';
    nameSpan.textContent = columnObj.name?.value || '';
    
    button.appendChild(numberSpan);
    if (nameSpan.textContent) {
      button.appendChild(nameSpan);
    }
    
    button.addEventListener('click', () => this.triggerColumn(index));
    
    // Add touch handling for mobile devices
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.triggerColumn(index);
    });
    
    return button;
  }

  async triggerColumn(columnIndex) {
    try {
      await api.connectColumn(columnIndex);
      
      // Update the visual state immediately for better responsiveness
      this.updateColumnVisualState(columnIndex, true);
      
      // Refresh after a short delay to get the actual state
      setTimeout(() => {
        this.refreshColumns();
      }, 100);
      
      EventBus.emit('column:triggered', { columnIndex });
      
    } catch (error) {
      console.error('Failed to trigger column:', error);
      UIUtils.handleError(error, 'Failed to trigger column');
    }
  }

  updateColumnVisualState(columnIndex, connected) {
    const columnElement = document.getElementById(`column-${columnIndex}`);
    if (columnElement) {
      if (connected) {
        columnElement.classList.add('connected');
      } else {
        columnElement.classList.remove('connected');
      }
    }
  }

  async refreshColumns() {
    try {
      const composition = await api.getComposition();
      this.columns = composition.columns || [];
      
      // Update only the connection states without re-rendering entire grid
      this.updateColumnStates();
      
    } catch (error) {
      console.error('Failed to refresh columns:', error);
    }
  }

  updateColumnStates() {
    this.columns.forEach((column, index) => {
      const columnIndex = index + 1;
      const isConnected = column.connected?.value === 'Connected';
      this.updateColumnVisualState(columnIndex, isConnected);
    });
  }

  // Get information about a specific column
  getColumn(index) {
    return this.columns[index - 1];
  }

  // Get all columns
  getColumns() {
    return this.columns;
  }

  // Get connected columns
  getConnectedColumns() {
    return this.columns
      .map((column, index) => ({ column, index: index + 1 }))
      .filter(({ column }) => column.connected?.value === 'Connected');
  }

  // Get column by name
  getColumnByName(name) {
    const index = this.columns.findIndex(column => 
      column.name?.value?.toLowerCase() === name.toLowerCase()
    );
    return index >= 0 ? { column: this.columns[index], index: index + 1 } : null;
  }

  // Trigger multiple columns (for advanced control)
  async triggerColumns(columnIndices) {
    const promises = columnIndices.map(index => this.triggerColumn(index));
    
    try {
      await Promise.all(promises);
      EventBus.emit('columns:multiTriggered', { columnIndices });
    } catch (error) {
      console.error('Failed to trigger multiple columns:', error);
      UIUtils.handleError(error, 'Failed to trigger columns');
    }
  }

  // Clear all connected columns
  async clearAllColumns() {
    const connectedColumns = this.getConnectedColumns();
    
    if (connectedColumns.length > 0) {
      const columnIndices = connectedColumns.map(({ index }) => index);
      await this.triggerColumns(columnIndices);
    }
  }

  // Setup keyboard shortcuts for columns (1-9, 0)
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Only handle if no input is focused and composition tab is not active
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key;
      let columnIndex = null;

      if (key >= '1' && key <= '9') {
        columnIndex = parseInt(key);
      } else if (key === '0') {
        columnIndex = 10;
      }

      if (columnIndex && columnIndex <= this.columns.length) {
        event.preventDefault();
        this.triggerColumn(columnIndex);
      }
    });
  }

  // Animation for column triggers
  animateColumnTrigger(columnIndex) {
    const element = document.getElementById(`column-${columnIndex}`);
    if (element) {
      element.style.transform = 'scale(0.95)';
      element.style.transition = 'transform 0.1s ease';
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 100);
    }
  }

  // Public API
  async initialize() {
    this.setupKeyboardShortcuts();
  }
}

export const columnsManager = new ColumnsManager();