// server-docker.cjs - WebSocket terminal server with Docker containers
const WebSocket = require('ws');
const { spawn } = require('node-pty');
const { exec } = require('child_process');
const crypto = require('crypto');

const wss = new WebSocket.Server({ port: 3001 });

console.log('Docker Terminal WebSocket server running on port 3001');

// Docker image to use (you can customize this)
const DOCKER_IMAGE = 'ubuntu:latest'; // or 'node:alpine', 'python:3.9-slim', etc.
const connections = new Map();

wss.on('connection', (ws) => {
  const containerId = crypto.randomBytes(8).toString('hex');
  console.log(`Client connected, creating container ${containerId}`);
  
  // Create and start a Docker container
  const dockerRun = spawn('docker', [
    'run',
    '-it',                           // Interactive + TTY
    '--rm',                          // Remove container when done
    `--name=terminal-${containerId}`, // Container name
    '--network=none',                // No network access (optional, remove for network)
    '--memory=512m',                 // Memory limit
    '--cpus=0.5',                    // CPU limit
    '--read-only',                   // Read-only filesystem (optional)
    '--tmpfs=/tmp',                  // Writable /tmp
    DOCKER_IMAGE,
    '/bin/bash'                      // Shell to run
  ], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    encoding: 'utf8'
  });

  connections.set(ws, { ptyProcess: dockerRun, containerId });

  dockerRun.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  dockerRun.onExit(() => {
    console.log(`Container ${containerId} exited`);
    ws.close();
  });

  ws.on('message', (data) => {
    dockerRun.write(data.toString());
  });

  ws.on('close', () => {
    console.log(`Client disconnected, stopping container ${containerId}`);
    const connection = connections.get(ws);
    
    if (connection) {
      // Kill the Docker container
      connection.ptyProcess.kill();
      
      // Force remove if still running
      exec(`docker rm -f terminal-${connection.containerId}`, (err) => {
        if (err) console.log('Container already removed');
      });
      
      connections.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Cleanup on server shutdown
process.on('SIGINT', () => {
  console.log('\nCleaning up containers...');
  
  // Force remove all terminal containers
  exec('docker rm -f $(docker ps -aq --filter "name=terminal-")', () => {
    process.exit(0);
  });
});