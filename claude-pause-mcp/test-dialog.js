// Test script to debug dialog data passing
const { spawn } = require('child_process');
const path = require('path');

const testData = {
    toolType: 'confirm',
    question: 'Test confirm dialog',
    isDangerous: true
};

const jsonString = JSON.stringify(testData);
const base64Data = Buffer.from(jsonString).toString('base64');

console.log('Test data:', testData);
console.log('JSON string:', jsonString);
console.log('Base64:', base64Data);

// Run dialog.bat
const dialogScript = path.join(__dirname, 'dialog.bat');
const proc = spawn('cmd.exe', ['/c', dialogScript, base64Data], {
    stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

proc.stdout.on('data', (data) => {
    stdout += data.toString();
});

proc.stderr.on('data', (data) => {
    stderr += data.toString();
    console.error('Dialog stderr:', data.toString());
});

proc.on('close', (code) => {
    console.log('Exit code:', code);
    console.log('Stdout:', stdout);
    if (stderr) {
        console.error('Full stderr:', stderr);
    }
});