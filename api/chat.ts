import { handleChatMessage } from './chatHandler.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, keypadOption } = req.body || {};
    const reply = await handleChatMessage(messages || [], keypadOption);
    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
