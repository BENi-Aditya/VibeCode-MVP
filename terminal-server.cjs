const WebSocket = require('ws');
const pty = require('node-pty');
const fs = require('fs');
const path = require('path');

const PORT = process.env.TERMINAL_PORT || 8083; // Changed to 8083 to avoid conflict with server.js
const PROJECT_DIR = process.cwd();
const VENV_DIR = path.join(PROJECT_DIR, 'venv');
const INIT_SCRIPT = path.join(PROJECT_DIR, 'init_python_env.sh');

// Ensure the virtual environment exists
function ensurePythonEnvironment() {
  if (!fs.existsSync(VENV_DIR)) {
    console.log('Setting up Python virtual environment...');
    const { spawnSync } = require('child_process');
    const result = spawnSync('python3', ['-m', 'venv', VENV_DIR], { stdio: 'inherit' });
    if (result.status !== 0) {
      console.error('Failed to create Python virtual environment');
      process.exit(1);
    }
  }
}

// Create initialization script
function createInitScript() {
  const scriptContent = `#!/bin/bash
# Activate the virtual environment
source ${VENV_DIR}/bin/activate
# Start the shell
$SHELL`;
  
  fs.writeFileSync(INIT_SCRIPT, scriptContent, { mode: 0o755 });
}

// Set up the environment
ensurePythonEnvironment();
createInitScript();

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', function connection(ws) {
  // Use bash for better shell features
  const shell = process.env.SHELL || 'bash';
  
  // Set up environment with virtualenv activation
  const env = {
    ...process.env,
    VIRTUAL_ENV: VENV_DIR,
    PATH: `${path.join(VENV_DIR, 'bin')}:${process.env.PATH}`,
  };
  
  // Spawn the shell with the init script
  const ptyProcess = pty.spawn(shell, ['--init-file', INIT_SCRIPT], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: PROJECT_DIR,
    env: env,
  });

  // Send shell output to client
  ptyProcess.on('data', function(data) {
    ws.send(JSON.stringify({ type: 'output', data }));
  });

  // Receive input from client
  ws.on('message', function incoming(message) {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'input') {
        ptyProcess.write(msg.data);
      } else if (msg.type === 'resize') {
        ptyProcess.resize(msg.cols, msg.rows);
      }
    } catch (e) {
      // Ignore malformed messages
    }
  });

  ws.on('close', function() {
    ptyProcess.kill();
  });
});

console.log(`Terminal WebSocket server running on ws://localhost:${PORT}`); 