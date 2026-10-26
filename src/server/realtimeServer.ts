import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';

interface RealtimeMessage {
  type: string;
  payload?: any;
  timestamp?: string;
  senderId?: string;
}

let wssInstance: WebSocketServer | null = null;
const connectedClients = new Set<WebSocket>();

export function setupWebSocketServer(server: HttpServer): WebSocketServer {
  if (wssInstance) {
    return wssInstance;
  }

  const wss = new WebSocketServer({ server, path: '/ws' });
  wssInstance = wss;

  wss.on('connection', (ws: WebSocket, req) => {
    connectedClients.add(ws);
    // Send immediate welcome handshake
    ws.send(
      JSON.stringify({
        type: 'connection:established',
        payload: {
          message: 'Connecté au serveur temps réel EMF Sangmelima',
          clientCount: connectedClients.size,
          timestamp: new Date().toISOString(),
        },
      })
    );

    ws.on('message', (rawData) => {
      try {
        const text = rawData.toString();
        const msg: RealtimeMessage = JSON.parse(text);

        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          return;
        }

        // Broadcast to all other connected clients
        broadcastRealtimeEvent(msg.type, msg.payload, ws);
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('WebSocket client error:', err);
      connectedClients.delete(ws);
    });
  });

  return wss;
}

export function broadcastRealtimeEvent(type: string, payload: any, senderWs?: WebSocket): void {
  if (!wssInstance) return;

  const dataString = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString(),
  });

  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== senderWs) {
      try {
        client.send(dataString);
      } catch (e) {
        console.warn('Failed to send to client:', e);
      }
    }
  });
}

export function getConnectedClientCount(): number {
  return connectedClients.size;
}
