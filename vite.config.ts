import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function apiPlugin(): Plugin {
  return {
    name: 'narisethu-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        try {
          if (req.url === '/api/schemes' && req.method === 'GET') {
            const { VERIFIED_SCHEMES } = await import('./src/data/schemes');
            res.end(JSON.stringify({ schemes: VERIFIED_SCHEMES }));
            return;
          }

          if (req.url === '/api/chat' && req.method === 'POST') {
            let bodyStr = '';
            req.on('data', chunk => {
              bodyStr += chunk;
            });
            req.on('end', async () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                const { handleChatMessage } = await import('./api/chatHandler');
                const reply = await handleChatMessage(body.messages || [], body.keypadOption);
                res.end(JSON.stringify({ reply }));
              } catch (err: any) {
                console.error('API Error in /api/chat:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
              }
            });
            return;
          }

          next();
        } catch (err: any) {
          console.error('Unhandled API error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Server error' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    root: path.resolve(__dirname),
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '/src': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

