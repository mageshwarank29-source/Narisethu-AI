import { VERIFIED_SCHEMES } from '../src/data/schemes.ts';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({ schemes: VERIFIED_SCHEMES });
}
