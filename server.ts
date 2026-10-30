import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import { setupWebSocketServer, broadcastRealtimeEvent, getConnectedClientCount } from './src/server/realtimeServer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'EMF SMART API',
    church: 'Église Missionnaire de la Foi de Sangmelima',
    timestamp: new Date().toISOString(),
  });
});

// Realtime broadcast endpoint
app.post('/api/realtime/broadcast', (req: Request, res: Response) => {
  const { type, payload } = req.body;
  if (!type) {
    return res.status(400).json({ success: false, message: 'Type de message requis' });
  }
  broadcastRealtimeEvent(type, payload);
  res.json({ success: true, clientCount: getConnectedClientCount() });
});

// Storage file persistence on server disk
const dataDir = path.resolve(__dirname, 'data');
const databaseFilePath = path.join(dataDir, 'database.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create data dir:', e);
}

// Get saved database state from disk
app.get('/api/storage', (req: Request, res: Response) => {
  try {
    if (fs.existsSync(databaseFilePath)) {
      const content = fs.readFileSync(databaseFilePath, 'utf-8');
      const data = JSON.parse(content);
      return res.json({ success: true, data });
    }
    return res.json({ success: true, data: null });
  } catch (err: any) {
    console.error('Error reading database file:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error reading database' });
  }
});

// Save database state to disk
app.post('/api/storage', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid data payload' });
    }
    fs.writeFileSync(databaseFilePath, JSON.stringify(data, null, 2), 'utf-8');
    return res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error writing database file:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error saving database' });
  }
});

// Serve static frontend assets from Vite build dist if exists
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// For SPA routing (catch-all at end)
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint non trouvé',
      },
    });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('<!doctype html><html><head><meta charset="utf-8"><title>EMF SMART</title></head><body><div id="root">Chargement de l\'application EMF SMART...</div></body></html>');
});

const server = http.createServer(app);
setupWebSocketServer(server);

// Start listening if run directly
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`EMF SMART running on http://0.0.0.0:${PORT}`);
  });
}

server.on('error', (err: any) => {
  console.error('Server error:', err);
});

export default app;
