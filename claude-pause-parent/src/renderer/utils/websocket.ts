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
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'dialog_request') {
            const handler = this.messageHandlers.get('dialog_request');
            if (handler) handler(message.dialog);
          }
        } catch (error) {
        }
      };

      this.ws.onclose = () => {
        this.reconnect();
      };

      this.ws.onerror = (error) => {
      };
    } catch (error) {
      this.reconnect();
    }
  }

  reconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setInterval(() => {
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