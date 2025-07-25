#!/usr/bin/env node

// Test script for visual output feature
const { spawn } = require('child_process');
const path = require('path');

const testData = {
    decision_context: "I'm planning a new component layout. Here's my proposed structure:",
    visual_output: `┌─────────────────────────────────┐
│         Header Component         │
├─────────────┬───────────────────┤
│             │                   │
│  Sidebar    │   Main Content    │
│             │                   │
│  - Nav      │   ┌─────────┐     │
│  - Filter   │   │ Card 1  │     │
│  - Tools    │   └─────────┘     │
│             │                   │
│             │   ┌─────────┐     │
│             │   │ Card 2  │     │
│             │   └─────────┘     │
│             │                   │
├─────────────┴───────────────────┤
│         Footer Component         │
└─────────────────────────────────┘

File Structure:
src/
├── components/
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   ├── MainContent.jsx
│   └── Footer.jsx
└── App.jsx`,
    options: [
        "Looks good, proceed with this layout",
        "Move sidebar to the right",
        "Use a different layout pattern",
        "Add more components"
    ],
    default_action: "Looks good, proceed with this layout"
};

const dialogScript = path.join(__dirname, 'dialog.sh');
const proc = spawn(dialogScript, [JSON.stringify(testData)], {
    stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
let error = '';

proc.stdout.on('data', (data) => {
    output += data.toString();
});

proc.stderr.on('data', (data) => {
    error += data.toString();
    process.stderr.write(data);
});

proc.on('close', (code) => {
    console.log('\nUser response:', output.trim());
    console.log('Exit code:', code);
});