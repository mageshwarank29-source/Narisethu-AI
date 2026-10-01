import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import { fileURLToPath } from 'node:url';

function apiPlugin(): Plugin {
  return {
    name: 'narisethu-api',
    apply: 'serve', // Strictly only used during local development server
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        try {
          if (req.url === '/api/schemes' && req.method === 'GET') {
            const { VERIFIED_SCHEMES } = await import('./src/data/schemes.ts');
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
                const { handleChatMessage } = await import('./api/chatHandler.ts');
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

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isDev ? [apiPlugin()] : [])
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
        '/src': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      watch: null,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
