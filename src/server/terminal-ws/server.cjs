// @ts-nocheck
const WebSocket = require("ws");
const { spawn } = require("node-pty");
const { exec } = require("child_process");
const crypto = require("crypto");
const os = require("os");
const fs = require('fs');
const path = require('path');

const port = 5050;
const wss = new WebSocket.Server({ port: port});

console.log(`Terminal WS server is running on port ${port}`);

const DOCKER_IMAGE = 'terminal-ubuntu';
const connections = new Map();
const ipConnections = new Map();

const IDLE_TIMEOUT = 15 * 60 * 1000;     /* In milliseconds */
const MAX_CONNECTIONS_PER_IP = 3;

/* Scalability configurations */
const MAX_CONCURRENT_CONTAINERS = 30;  /* Adjust based on server capacity */
/** @type {QueueItem[]} */
const containerQueue = [];
let activeContainers = 0;

/* IP logging setup */
const LOG_DIR = './logs';
const uniqueIPs = new Set();

/* Create logs directory if it doesn't exist */
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/* Load existing IPs from file on startup */
const IP_LOG_FILE = path.join(LOG_DIR, 'unique_ips.json');
try {
    if (fs.existsSync(IP_LOG_FILE)) {
        const data = JSON.parse(fs.readFileSync(IP_LOG_FILE, 'utf8'));
        data.ips.forEach(ip => uniqueIPs.add(ip));
        console.log(`Loaded ${uniqueIPs.size} unique IPs from history`);
    }
} catch(err) {
    console.error('Error loading IP history:', err);
}

/* Function to save IPs to file */
function saveIPLog() {
    const logData = {
        totalUnique: uniqueIPs.size,
        ips: Array.from(uniqueIPs),
        lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(IP_LOG_FILE, JSON.stringify(logData, null, 2));
}

/* Only pull if using a remote image */
if(DOCKER_IMAGE.includes('/') || DOCKER_IMAGE === 'ubuntu:latest') {
    console.log(`Pre-pulling Docker image: ${DOCKER_IMAGE}`);
    exec(`docker pull ${DOCKER_IMAGE}`, (err, stdout, stderr) => {
        if(err) {
            console.error("Note: Could not pull image, using local:", err.message);
        } else {
            console.log("Docker image ready");
        }
    });
} else {
    console.log(`Using local image: ${DOCKER_IMAGE}`);
}

/* Process queued connections */
function processQueue() {
    if(containerQueue.length === 0 || activeContainers >= MAX_CONCURRENT_CONTAINERS) {
        return;
    }

    const { ws, req, containerId, clientIP } = containerQueue.shift();
    
    /* Check if WebSocket is still open */
    if(ws.readyState !== WebSocket.OPEN) {
        processQueue();  /* Skip and process next */
        return;
    }

    startContainer(ws, req, containerId, clientIP);
}

/* Start container for a connection */
function startContainer(ws, req, containerId, clientIP) {
    activeContainers++;
    
    /* Docker initialization */
    const dockerRun = spawn("docker", [
        "run",
        "-it",              /* Interactive and TTY */
        "--rm",             /* Remove the container when done */
        `--name=terminal-${containerId}`,  
        "--memory=256m",    /* Reduced for better density */
        "--cpus=0.25",      /* Reduced for better density */
        "--tmpfs=/tmp",     /* Writeable `/tmp` */
        DOCKER_IMAGE,
        "/bin/bash"
    ], {
        name: "xterm-color",
        cols: 200,
        rows: 100,
        encoding: "utf-8"
    });

    connections.set(ws, {
        ptyProcess: dockerRun, 
        containerId, 
        clientIP
    });

    /* Output from the terminal (if it should change) gets sent to the currently 
        connected client. */
    dockerRun.onData((data) => {
        if(ws.readyState === WebSocket.OPEN){
            ws.send(data);
        }
    });

    dockerRun.onExit(() => {
        console.log(`Container ${containerId} exited`);
        activeContainers--;
        ws.close();
        
        /* Process next in queue */
        processQueue();
    });

    // @ts-ignore
    let idleTimer;
    const resetIdleTimer = () => {
        // @ts-ignore
        clearTimeout(idleTimer);

        idleTimer = setTimeout(() => {
            console.log(`Idle timeout for container ${containerId}`);
            ws.send(`\r\nIdle for too long. Container ${containerId} has disconnected.\r\n`);
            ws.close();
        }, IDLE_TIMEOUT);
    };

    resetIdleTimer();

    /* User types in and send to terminal to update */
    ws.on("message", (data) => {
        const message = data.toString();
        
        /* Reset idle timer on any activity */
        resetIdleTimer();
        
        /* Check if it's a resize message */
        if (message.startsWith('resize:')) {
            const [cols, rows] = message.replace('resize:', '').split(',').map(Number);
            if (cols && rows) {
                dockerRun.resize(cols, rows);
                console.log(`Resized terminal to ${cols}x${rows}`);
            }
        } else {
            /* Regular input data */
            dockerRun.write(message);
        }
    });

    /* Client disconnects so kill the process, and get rid of the client WS in
        the map */
    ws.on("close", () => {
        // @ts-ignore
        clearTimeout(idleTimer);

        console.log(`Client disconnected, stopping container ${containerId}`);
        const connection = connections.get(ws);
        
        /* If connection found in the map, kill the IPty objection created by 
            the `spawn()` function. */
        if(connection){
            connection.ptyProcess.kill();

            exec(`docker rm -f terminal-${connection.containerId}`, (err) => {
                if(err) console.log("Container already removed");
            });

            connections.delete(ws);
            activeContainers--;
            
            /* Remove from IP tracking */
            const ipConns = ipConnections.get(connection.clientIP);
            if(ipConns) {
                ipConns.delete(ws);
                if(ipConns.size === 0) {
                    ipConnections.delete(connection.clientIP);
                }
            }
            
            /* Process next in queue */
            processQueue();
        }
    });

    ws.on("error", (err) => {
        console.error("Websocket error: ", err);
    });

    /* Send welcome message */
    ws.send("\r\n" +
        "╔═══════════════════════════════════════════════════════════════════╗\r\n" +
        "║                     TERMINAL CONTAINER v1.0                       ║\r\n" +
        "║                       Made by Jerry & Erik                        ║\r\n" +
        "╠═══════════════════════════════════════════════════════════════════╣\r\n" +
        "║                                                                   ║\r\n" +
        "║  System Info:                                                     ║\r\n" +
        "║  • Ubuntu Linux (Latest)                                          ║\r\n" +
        "║  • Memory: 256MB | CPU: 0.25 cores                                ║\r\n" +
        "║  • Session timeout: 15 minutes                                    ║\r\n" +
        "║                                                                   ║\r\n" +
        "║  Pre-installed:                                                   ║\r\n" +
        "║  • nano text editor                                               ║\r\n" +
        "║  • apt package manager (updated)                                  ║\r\n" +
        "║                                                                   ║\r\n" +
        "║  Quick Commands:                                                  ║\r\n" +
        "║  • apt install <package>  - Install software                      ║\r\n" +
        "║  • nano <filename>        - Edit files                            ║\r\n" +
        "║  • ls, cd, pwd            - Navigate filesystem                   ║\r\n" +
        "║  • exit                   - Leave container                       ║\r\n" +
        "║                                                                   ║\r\n" +
        "╚═══════════════════════════════════════════════════════════════════╝\r\n" +
        "\r\n" +
        "Container ready! Type 'help' for more commands.\r\n\r\n");
}

wss.on("connection", (ws, req) => {
    const containerId = crypto.randomBytes(8).toString("hex");
    
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`Client connected from: ${clientIP}`);
    
    /* Log unique IP */
    if (!uniqueIPs.has(clientIP)) {
        uniqueIPs.add(clientIP);
        console.log(`New unique visitor! Total unique IPs: ${uniqueIPs.size}`);
        saveIPLog();
        
        /* Also append to daily log */
        const today = new Date().toISOString().split('T')[0];
        const dailyLog = path.join(LOG_DIR, `connections_${today}.log`);
        const logEntry = `${new Date().toISOString()} | New IP: ${clientIP} | Total Unique: ${uniqueIPs.size}\n`;
        fs.appendFileSync(dailyLog, logEntry);
    }

    /* IP rate limiting check */
    const currentIPConnections = ipConnections.get(clientIP) || new Set();
    
    if(currentIPConnections.size >= MAX_CONNECTIONS_PER_IP) {
        ws.send(`Error: Maximum ${MAX_CONNECTIONS_PER_IP} connections per IP address reached`);
        ws.close();
        return;
    }
    
    /* Add this connection to IP tracking */
    currentIPConnections.add(ws);
    ipConnections.set(clientIP, currentIPConnections);

    /* Check if we can start container immediately or need to queue */
    if(activeContainers >= MAX_CONCURRENT_CONTAINERS) {
        containerQueue.push({ ws, req, containerId, clientIP });
        const queuePosition = containerQueue.length;
        ws.send(`Server at capacity. You're in queue position: ${queuePosition}\r\n`);
        console.log(`Connection queued. Position: ${queuePosition}, Active containers: ${activeContainers}`);
        
        /* Handle disconnect while in queue */
        ws.on("close", () => {
            const queueIndex = containerQueue.findIndex(item => item.ws === ws);
            if(queueIndex !== -1) {
                containerQueue.splice(queueIndex, 1);
                console.log(`Removed queued connection ${containerId}`);
            }
            
            /* Remove from IP tracking */
            const ipConns = ipConnections.get(clientIP);
            if(ipConns) {
                ipConns.delete(ws);
                if(ipConns.size === 0) {
                    ipConnections.delete(clientIP);
                }
            }
        });
        
        return;
    }

    /* Start container immediately */
    startContainer(ws, req, containerId, clientIP);
});

/* Health check and stats endpoint */
const http = require('http');
http.createServer((req, res) => {
    if(req.url === '/health') {
        const stats = {
            status: 'OK',
            activeContainers: activeContainers,
            maxContainers: MAX_CONCURRENT_CONTAINERS,
            queueLength: containerQueue.length,
            totalConnections: connections.size,
            uniqueVisitors: uniqueIPs.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        };
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(stats, null, 2));
    } else if(req.url === '/metrics') {
        /* Prometheus-style metrics */
        const metrics = [
            `# HELP terminal_active_containers Number of active Docker containers`,
            `# TYPE terminal_active_containers gauge`,
            `terminal_active_containers ${activeContainers}`,
            `# HELP terminal_queue_length Number of connections waiting in queue`,
            `# TYPE terminal_queue_length gauge`, 
            `terminal_queue_length ${containerQueue.length}`,
            `# HELP terminal_total_connections Total WebSocket connections`,
            `# TYPE terminal_total_connections gauge`,
            `terminal_total_connections ${connections.size}`,
            `# HELP terminal_unique_visitors Total unique IP addresses seen`,
            `# TYPE terminal_unique_visitors counter`,
            `terminal_unique_visitors ${uniqueIPs.size}`
        ].join('\n');
        
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(metrics);
    } else {
        res.writeHead(404);
        res.end();
    }
}).listen(8080);

console.log('Health check endpoint running on port 8080');

/* Graceful shutdown */
process.on("SIGINT", () => {
    console.log("\nShutting down gracefully...");
    
    /* Save final IP log */
    saveIPLog();
    
    /* Stop accepting new connections */
    wss.close(() => {
        console.log("WebSocket server closed");
    });
    
    /* Close all active connections */
    connections.forEach((connection, ws) => {
        ws.send("\r\nServer shutting down...\r\n");
        ws.close();
    });
    
    /* Clean up all containers */
    console.log("Cleaning up all containers...");
    exec("docker rm -f $(docker ps -aq --filter \"name=terminal-\")", (err) => {
        if(err) console.log("Error cleaning containers:", err);
        process.exit(0);
    });
});

/* Handle uncaught exceptions */
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    /* Don't exit - try to keep serving existing connections */
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

/* System stats logging */
setInterval(() => {
    console.log(`Stats: Containers: ${activeContainers}/${MAX_CONCURRENT_CONTAINERS}, Queue: ${containerQueue.length}, Connections: ${connections.size}, Unique IPs: ${uniqueIPs.size}`);
}, 60000);  /* Log every minute */