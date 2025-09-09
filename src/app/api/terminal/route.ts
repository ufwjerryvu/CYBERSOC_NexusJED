import { spawn } from 'node-pty';
import { WebSocketServer } from 'ws';
import { NextResponse } from 'next/server';

export async function GET(){
    return NextResponse.json({
        message: 'WebSocket server needed. Run separate server on another port.'
    });
}


