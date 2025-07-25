import { Dialog, DialogResponse } from '../types';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(private url: string) {
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          
          if (message.type === 'dialog_request') {
            const handler = this.messageHandlers.get('dialog_request');
            if (handler) handler(message.dialog);
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.reconnect();
    }
  }

  reconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setInterval(() => {
        console.log('Attempting to reconnect...');
        this.connect();
      }, 3000);
    }
  }

  sendResponse(requestId: string, response: DialogResponse) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'dialog_response',
        requestId,
        response
      }));
    }
  }

  onDialogRequest(handler: (dialog: Dialog) => void) {
    this.messageHandlers.set('dialog_request', handler);
  }

  close() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Create singleton instance
export const wsClient = new WebSocketClient('ws://localhost:3030');