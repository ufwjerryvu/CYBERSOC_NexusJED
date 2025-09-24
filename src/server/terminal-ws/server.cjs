const WebSocket = require("ws");
const { spawn } = require("node-pty");
const { exec } = require("child_process");
const crypto = require("crypto");

const port = 5050;
const wss = new WebSocket.Server({ port: port});

console.log(`Terminal WS server is running on port ${port}`);

const DOCKER_IMAGE = 'ubuntu:latest';
const connections = new Map();

wss.on("connection", (ws, req) => {
    const containerId = crypto.randomBytes(8).toString("hex");
    
    const clientIP = req.socket.remoteAddress;
    console.log(`Client connected from: ${clientIP}`);

    /* Docker initialization */
    const dockerRun = spawn("docker", [
        "run",
        "-it",              /* Interactive and TTY */
        "--rm",             /* Remove the container when done */
        `--name=terminal-${containerId}`,  
        "--memory=512m",
        "--cpus=0.5",
        "--tmpfs=/tmp",     /* Writeable `/tmp` */
        DOCKER_IMAGE,
        "/bin/bash"
    ], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        encoding: "utf-8"
    })

    connections.set(ws, {ptyProcess: dockerRun, containerId});

    /* Output from the terminal (if it should change) gets sent to the currently 
        connected client. */
    dockerRun.onData((data) => {
        if(ws.readyState === WebSocket.OPEN){
            ws.send(data);
        }
    });

    dockerRun.onExit(() => {
        console.log(`Container ${containerId} exited`);
        ws.close();
    });

    /* User types in and send to terminal to update */
    ws.on("message", (data) => {
        dockerRun.write(data.toString());
    });

    /* Client disconnects so kill the process, and get rid of the client WS in
        the map */
    ws.on("close", () => {
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
        }
    });

    ws.on("error", (err) => {
        console.error("Websocket error: ", err);
    });
});


process.on("SIGINT", () => {
    console.log("Quitting. Cleaning up all containers.");

    exec("docker rm -f $(docker ps -aq --filter \"name=terminal-\")", () => {
        process.exit(0);
    });
});