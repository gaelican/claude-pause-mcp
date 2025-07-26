import WebSocket from 'ws';
import { EventEmitter } from 'events';

class WebSocketClient extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.connected = false;
    this.reconnectInterval = 5000;
    this.pendingRequests = new Map();
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket('ws://localhost:3030');
      
      this.ws.on('open', () => {
        this.connected = true;
        this.emit('connected');
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          
          if (message.type === 'dialog_response' && message.id) {
            const pending = this.pendingRequests.get(message.id);
            if (pending) {
              pending.resolve(message.data);
              this.pendingRequests.delete(message.id);
            }
          }
        } catch (error) {
        }
      });

      this.ws.on('close', () => {
        this.connected = false;
        this.emit('disconnected');
        
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests) {
          pending.reject(new Error('WebSocket connection closed'));
        }
        this.pendingRequests.clear();
        
        // Attempt to reconnect
        setTimeout(() => this.connect(), this.reconnectInterval);
      });

      this.ws.on('error', (error) => {
      });
    } catch (error) {
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  async sendDialogRequest(dialogType, parameters) {
    if (!this.connected || !this.ws) {
      // Fall back to Electron dialog
      return null;
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      const message = {
        type: 'dialog_request',
        id: requestId,
        dialogType: dialogType,
        parameters: parameters
      };
      
      try {
        this.ws.send(JSON.stringify(message));
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error('Dialog request timed out'));
          }
        }, 300000);
      } catch (error) {
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default WebSocketClient;