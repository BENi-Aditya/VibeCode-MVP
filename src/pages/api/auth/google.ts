import type { NextApiRequest, NextApiResponse } from 'next';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'No ID token provided' });
    const ticket = await oauthClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    res.json({ success: true, user: { id: payload?.sub, email: payload?.email, name: payload?.name, picture: payload?.picture } });
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid Google ID token', details: err.message });
  }
}
