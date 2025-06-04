/**
 * Simple Event Bus for inter-module communication
 */

class EventBusClass {
  constructor() {
    this.events = {};
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (!this.events[event]) return;
    
    const index = this.events[event].indexOf(callback);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
  }

  // Emit an event
  emit(event, data = null) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for '${event}':`, error);
      }
    });
  }

  // Subscribe to an event only once
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      callback(data);
    });
    return unsubscribe;
  }

  // Clear all listeners for an event
  clear(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  // Get all registered events
  getEvents() {
    return Object.keys(this.events);
  }

  // Get listener count for an event
  getListenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }
}

export const EventBus = new EventBusClass();