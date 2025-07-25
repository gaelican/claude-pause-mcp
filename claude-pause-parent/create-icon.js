const fs = require('fs');
const { createCanvas } = require('@napi-rs/canvas');
const path = require('path');

// Create a simple 256x256 icon
const size = 256;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#1e1e2e';
ctx.fillRect(0, 0, size, size);

// Circle
ctx.fillStyle = '#89b4fa';
ctx.beginPath();
ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2);
ctx.fill();

// Letter C
ctx.fillStyle = '#1e1e2e';
ctx.font = 'bold 120px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('C', size/2, size/2);

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'public', 'icon.png'), buffer);
console.log('Icon created successfully!');