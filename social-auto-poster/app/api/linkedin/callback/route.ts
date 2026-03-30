import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveLinkedInTokens } from '@/lib/linkedin-tokens';
import { SITE_CONFIG } from '@/lib/config';

/**
 * GET /api/linkedin/callback - OAuth callback from LinkedIn.
 * Exchanges auth code for access + refresh tokens, stores them in Netlify Blobs.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error || !code) {
    const safeError = (error || 'No code received').replace(/[<>"'&]/g, c =>
      ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' })[c]!);
    return new NextResponse(
      `<html><body><h2>LinkedIn Authorization Failed</h2><p>${safeError}</p><a href="/dashboard/schedule">Back to Schedule</a></body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    );
  }

  // Validate OAuth state to prevent CSRF
  const state = request.nextUrl.searchParams.get('state');
  const cookieStore = await cookies();
  const savedState = cookieStore.get('linkedin_oauth_state')?.value;
  cookieStore.delete('linkedin_oauth_state');

  if (!state || !savedState || state !== savedState) {
    return new NextResponse(
      '<html><body><h2>Invalid OAuth State</h2><p>Request may have been tampered with. Please try again.</p><a href="/dashboard/schedule">Back to Schedule</a></body></html>',
      { headers: { 'Content-Type': 'text/html' } },
    );
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const siteUrl = SITE_CONFIG.url;
  const redirectUri = `${siteUrl}/api/linkedin/callback`;

  if (!clientId || !clientSecret) {
    return new NextResponse(
      '<html><body><h2>Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET</h2></body></html>',
      { headers: { 'Content-Type': 'text/html' } },
    );
  }

  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return new NextResponse(
      `<html><body><h2>Token Exchange Failed</h2><pre>${JSON.stringify(tokenData, null, 2)}</pre><a href="/dashboard/schedule">Back</a></body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    );
  }

  await saveLinkedInTokens({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || null,
    expiresAt: Date.now() + (tokenData.expires_in * 1000),
    refreshExpiresAt: tokenData.refresh_token_expires_in
      ? Date.now() + (tokenData.refresh_token_expires_in * 1000)
      : null,
  });

  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
      <h2 style="color:#22c55e">LinkedIn Connected!</h2>
      <p>Access token saved. LinkedIn auto-posting is now active.</p>
      <p>Token expires in ${Math.round(tokenData.expires_in / 86400)} days.</p>
      ${tokenData.refresh_token ? '<p>Refresh token saved \u2014 will auto-renew.</p>' : ''}
      <a href="/dashboard/schedule" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#0A66C2;color:#fff;border-radius:8px;text-decoration:none">Back to Schedule</a>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  );
}
