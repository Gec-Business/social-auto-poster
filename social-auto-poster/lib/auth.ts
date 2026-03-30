import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData } from './types';

const getSessionPassword = (): string => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      console.warn('WARNING: SESSION_SECRET not set. Using insecure fallback.');
    }
    return 'complex_password_at_least_32_characters_long_dev_only';
  }
  return secret;
};

export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: 'dashboard-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true;
}
