const { WebSocketServer } = require('ws');
const { EventEmitter } = require('events');

class DialogWebSocketServer extends EventEmitter {
    constructor(port = 7659) {
        super();
        this.port = port;
        this.wss = null;
        this.clients = new Map();
        this.requestQueue = [];
        this.currentRequest = null;
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                this.wss = new WebSocketServer({ 
                    port: this.port,
                    host: 'localhost'
                });

                this.wss.on('connection', (ws) => {
                    const clientId = this.generateClientId();
                    this.clients.set(clientId, ws);
                    
                    console.log(`Client connected: ${clientId}`);
                    this.sendMessage(ws, {
                        type: 'connected',
                        clientId: clientId
                    });

                    ws.on('message', (data) => {
                        try {
                            const message = JSON.parse(data.toString());
                            this.handleMessage(clientId, message);
                        } catch (error) {
                            console.error('Invalid message:', error);
                            this.sendMessage(ws, {
                                type: 'error',
                                error: 'Invalid message format'
                            });
                        }
                    });

                    ws.on('close', () => {
                        console.log(`Client disconnected: ${clientId}`);
                        this.clients.delete(clientId);
                    });

                    ws.on('error', (error) => {
                        console.error(`WebSocket error for client ${clientId}:`, error);
                    });
                });

                this.wss.on('listening', () => {
                    console.log(`WebSocket server listening on port ${this.port}`);
                    resolve();
                });

                this.wss.on('error', (error) => {
                    console.error('WebSocket server error:', error);
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.wss) {
                this.clients.forEach((ws) => {
                    ws.close();
                });
                this.clients.clear();
                
                this.wss.close(() => {
                    console.log('WebSocket server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    handleMessage(clientId, message) {
        const ws = this.clients.get(clientId);
        if (!ws) return;

        switch (message.type) {
            case 'showDialog':
                this.handleShowDialog(clientId, message);
                break;
            case 'updateStatus':
                this.emit('updateStatus', message.data);
                break;
            case 'clearDialog':
                this.emit('clearDialog');
                break;
            default:
                this.sendMessage(ws, {
                    type: 'error',
                    error: `Unknown message type: ${message.type}`
                });
        }
    }

    handleShowDialog(clientId, message) {
        const request = {
            id: message.id,
            clientId: clientId,
            data: message.data,
            timestamp: Date.now()
        };

        if (this.currentRequest) {
            // Queue the request if one is already active
            this.requestQueue.push(request);
            this.emit('requestQueued', request);
            
            const ws = this.clients.get(clientId);
            this.sendMessage(ws, {
                type: 'queued',
                id: message.id,
                position: this.requestQueue.length
            });
        } else {
            // Process immediately
            this.currentRequest = request;
            this.emit('showDialog', request);
        }
    }

    sendResponse(requestId, response) {
        if (!this.currentRequest || this.currentRequest.id !== requestId) {
            console.error(`No active request with ID: ${requestId}`);
            return;
        }

        const clientId = this.currentRequest.clientId;
        const ws = this.clients.get(clientId);
        
        if (ws && ws.readyState === ws.OPEN) {
            this.sendMessage(ws, {
                type: 'response',
                id: requestId,
                data: response
            });
        }

        // Clear current request and process next in queue
        this.currentRequest = null;
        this.processNextRequest();
    }

    processNextRequest() {
        if (this.requestQueue.length > 0) {
            const nextRequest = this.requestQueue.shift();
            this.currentRequest = nextRequest;
            this.emit('showDialog', nextRequest);
        } else {
            this.emit('idle');
        }
    }

    sendMessage(ws, message) {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getQueueLength() {
        return this.requestQueue.length;
    }

    getCurrentRequest() {
        return this.currentRequest;
    }
}

module.exports = DialogWebSocketServer;