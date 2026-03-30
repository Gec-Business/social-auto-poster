import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SITE_CONFIG } from '@/lib/config';

/**
 * GET /api/linkedin - redirects to LinkedIn OAuth consent screen.
 * After user approves, LinkedIn redirects back to /api/linkedin/callback.
 */
export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID not set' }, { status: 500 });
  }

  const siteUrl = SITE_CONFIG.url;
  const redirectUri = `${siteUrl}/api/linkedin/callback`;
  const scope = 'w_organization_social openid profile';
  const state = crypto.randomUUID();

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);

  const cookieStore = await cookies();
  cookieStore.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return NextResponse.redirect(authUrl.toString());
}
