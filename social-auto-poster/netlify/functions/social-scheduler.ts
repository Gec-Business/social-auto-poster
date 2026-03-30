import type { Config } from '@netlify/functions';

/**
 * Netlify Scheduled Function - runs daily at 10:00 AM UTC.
 * Adjust the cron schedule below to match your timezone.
 *
 * Examples:
 *   '0 6 * * *'  = 06:00 UTC (10:00 AM UTC+4)
 *   '0 14 * * *' = 14:00 UTC (10:00 AM EST)
 *   '0 10 * * *' = 10:00 UTC
 */
export default async function handler() {
  const siteUrl = process.env.URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[social-scheduler] CRON_SECRET not set');
    return;
  }

  try {
    const response = await fetch(`${siteUrl}/api/cron/social-post`, {
      method: 'POST',
      headers: {
        'x-cron-secret': cronSecret,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('[social-scheduler] Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('[social-scheduler] Failed:', error);
  }
}

export const config: Config = {
  schedule: '0 10 * * *', // 10:00 AM UTC daily — adjust for your timezone
};
