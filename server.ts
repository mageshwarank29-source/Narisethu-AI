import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { VERIFIED_SCHEMES } from './src/data/schemes';
import { handleChatMessage } from './api/chatHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API endpoints
app.get('/api/schemes', (_req, res) => {
  res.json({ schemes: VERIFIED_SCHEMES });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, keypadOption } = req.body;
    const reply = await handleChatMessage(messages || [], keypadOption);
    res.json({ reply });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Serve frontend dist assets if present
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NariSethu server running on port ${PORT}`);
});
