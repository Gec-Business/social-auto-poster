import { getStore } from '@netlify/blobs';

const STORE_NAME = 'linkedin-auth';
const TOKEN_KEY = 'tokens';

export interface LinkedInTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;       // ms timestamp
  refreshExpiresAt: number | null; // ms timestamp
}

function getBlobStore() {
  return getStore({ name: STORE_NAME, consistency: 'strong' });
}

export async function saveLinkedInTokens(tokens: LinkedInTokens): Promise<void> {
  const store = getBlobStore();
  await store.setJSON(TOKEN_KEY, tokens);
}

export async function getLinkedInTokens(): Promise<LinkedInTokens | null> {
  const store = getBlobStore();
  try {
    const data = await store.get(TOKEN_KEY, { type: 'json' }) as LinkedInTokens | null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Get a valid access token, refreshing if needed.
 */
export async function getValidLinkedInToken(): Promise<string | null> {
  const tokens = await getLinkedInTokens();
  if (!tokens) return null;

  // Token still valid (with 5-min buffer)
  if (tokens.expiresAt > Date.now() + 300_000) {
    return tokens.accessToken;
  }

  // Try to refresh
  if (tokens.refreshToken && tokens.refreshExpiresAt && tokens.refreshExpiresAt > Date.now()) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    try {
      const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const data = await res.json();
      if (data.access_token) {
        const updated: LinkedInTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || tokens.refreshToken,
          expiresAt: Date.now() + (data.expires_in * 1000),
          refreshExpiresAt: data.refresh_token_expires_in
            ? Date.now() + (data.refresh_token_expires_in * 1000)
            : tokens.refreshExpiresAt,
        };
        await saveLinkedInTokens(updated);
        return updated.accessToken;
      }
    } catch (err) {
      console.error('[linkedin-tokens] Refresh failed:', err);
    }
  }

  return null;
}
