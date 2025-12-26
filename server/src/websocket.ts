import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Tablet connected, total:', clients.size);

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Tablet disconnected, total:', clients.size);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      clients.delete(ws);
    });

    // Send welcome
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
  });
}

export function broadcastScan(data: object) {
  const msg = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}
