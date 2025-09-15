#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

console.log('===================================');
console.log('  Mindmap App Deployment Script');
console.log('===================================');

console.log('');
console.log('Step 1: Installing dependencies...');

// Install dependencies
const install = spawn('npm', ['install'], { 
  stdio: 'inherit',
  shell: os.platform() === 'win32'
});

install.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to install dependencies');
    process.exit(1);
  }

  console.log('');
  console.log('Step 2: Building and starting the server...');

  // Start development server
  const dev = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    shell: os.platform() === 'win32'
  });

  dev.on('close', (code) => {
    console.log('');
    console.log('===================================');
    console.log('  Deployment finished.');
    console.log('  You can now access the app at the URL provided above.');
    console.log('===================================');
  });
});

