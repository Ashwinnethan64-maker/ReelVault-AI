import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (token: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    
    return ticket.getPayload();
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Invalid Google token');
  }
};
