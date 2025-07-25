const WebSocket = require('ws');

console.log('Testing parent application WebSocket connection...');

const ws = new WebSocket('ws://localhost:3030');

ws.on('open', () => {
  console.log('Connected to parent application!');
  
  // Send a test dialog request
  const testRequest = {
    type: 'dialog_request',
    id: 'test-' + Date.now(),
    dialogType: 'confirm',
    parameters: {
      question: 'This is a test from the parent application. Does it work?',
      description: 'Testing the native rendering in the parent app',
      yesLabel: 'It works!',
      noLabel: 'Not working'
    }
  };
  
  console.log('Sending test dialog request...');
  ws.send(JSON.stringify(testRequest));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received response:', message);
  
  if (message.type === 'dialog_response') {
    console.log('User responded:', message.data);
    ws.close();
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});