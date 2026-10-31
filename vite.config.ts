import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'realtime-ws-and-storage',
        configureServer(server) {
          if (server.httpServer) {
            import('./src/server/realtimeServer.ts').then(({ setupWebSocketServer }) => {
              setupWebSocketServer(server.httpServer as any);
            }).catch(console.error);
          }

          // Middleware pour persistance disque /api/storage dans Vite dev
          server.middlewares.use((req, res, next) => {
            const parsedUrl = req.url ? req.url.split('?')[0] : '';
            if (parsedUrl === '/api/storage') {
              const dataDir = path.resolve(__dirname, 'data');
              const databaseFilePath = path.join(dataDir, 'database.json');
              if (!fs.existsSync(dataDir)) {
                try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
              }

              if (req.method === 'GET') {
                try {
                  if (fs.existsSync(databaseFilePath)) {
                    const content = fs.readFileSync(databaseFilePath, 'utf-8');
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, data: JSON.parse(content) }));
                  }
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: true, data: null }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: false, error: err?.message }));
                }
              }

              if (req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => { body += chunk; });
                req.on('end', () => {
                  try {
                    const parsed = JSON.parse(body);
                    fs.writeFileSync(databaseFilePath, JSON.stringify(parsed, null, 2), 'utf-8');
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
                  } catch (err: any) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, error: err?.message }));
                  }
                });
                return;
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/supabase-proxy': {
          target: 'https://rahkriftfhqwgrnkpyiy.supabase.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/supabase-proxy/, ''),
          secure: false,
        },
      },
    },
  };
});
