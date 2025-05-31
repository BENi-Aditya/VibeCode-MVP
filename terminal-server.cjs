const WebSocket = require('ws');
const pty = require('node-pty');

const PORT = process.env.TERMINAL_PORT || 8081;

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', function connection(ws) {
  // Spawn a shell (sh is more portable than bash)
  const shell = process.env.SHELL || 'sh';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
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