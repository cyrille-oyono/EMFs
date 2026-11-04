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
            try {
              import('./src/server/realtimeServer.ts')
                .then(({ setupWebSocketServer }) => {
                  if (server.httpServer) {
                    setupWebSocketServer(server.httpServer as any);
                  }
                })
                .catch((e) => {
                  console.warn('[Vite WS] Setup WebSocket ignoré:', e?.message || e);
                });
            } catch (e) {
              console.warn('[Vite WS] Init exception:', e);
            }
          }

          // Middleware pour persistance disque /api/storage, /api/carousel-slides, et /api/presentation-image
          server.middlewares.use((req, res, next) => {
            req.on('error', (err) => {
              console.warn('[Middleware] Request error:', err?.message || err);
            });

            const parsedUrl = req.url ? req.url.split('?')[0] : '';
            const dataDir = path.resolve(__dirname, 'data');
            const databaseFilePath = path.join(dataDir, 'database.json');
            if (!fs.existsSync(dataDir)) {
              try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
            }

            if (parsedUrl === '/api/carousel-slides' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  const { slides } = JSON.parse(body);
                  if (Array.isArray(slides)) {
                    let cur: any = {};
                    if (fs.existsSync(databaseFilePath)) {
                      try { cur = JSON.parse(fs.readFileSync(databaseFilePath, 'utf-8')); } catch {}
                    }
                    cur.carouselSlides = slides;
                    fs.writeFileSync(databaseFilePath, JSON.stringify(cur, null, 2), 'utf-8');
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: true, count: slides.length }));
                  }
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: false, message: 'Invalid slides payload' }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: false, error: err?.message }));
                }
              });
              return;
            }

            if (parsedUrl === '/api/presentation-image' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  const { imageUrl, sections } = JSON.parse(body);
                  let cur: any = {};
                  if (fs.existsSync(databaseFilePath)) {
                    try { cur = JSON.parse(fs.readFileSync(databaseFilePath, 'utf-8')); } catch {}
                  }
                  if (!cur.cmsState) cur.cmsState = { publishedSections: [], draftSections: [] };
                  if (Array.isArray(sections) && sections.length > 0) {
                    cur.cmsState.publishedSections = sections;
                  } else {
                    const pub = cur.cmsState.publishedSections || [];
                    const p = pub.find((s: any) => s.key === 'presentation');
                    if (p) p.imageUrl = imageUrl;
                    cur.cmsState.publishedSections = pub;
                  }
                  cur.presentationImage = imageUrl;
                  fs.writeFileSync(databaseFilePath, JSON.stringify(cur, null, 2), 'utf-8');
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: true, imageUrl }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: false, error: err?.message }));
                }
              });
              return;
            }

            if (parsedUrl === '/api/storage') {
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
          headers: {
            apikey: 'sb_publishable_dHeTb1557Tlo9tJSQCgR4w_PKN_a3P6',
            Authorization: 'Bearer sb_publishable_dHeTb1557Tlo9tJSQCgR4w_PKN_a3P6',
          },
        },
      },
    },
  };
});
