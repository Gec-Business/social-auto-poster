/**
 * Central configuration for your campaign.
 * Edit these values to match your brand and campaign details.
 */
export const SITE_CONFIG = {
  /** Display name shown in the dashboard sidebar */
  name: 'My Campaign',

  /** Your site URL (Netlify sets the URL env var automatically) */
  url: process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  /** IANA timezone for campaign day calculation (e.g. 'America/New_York', 'Europe/London') */
  timezone: process.env.TIMEZONE || 'UTC',

  /** Label for the primary language tab in the dashboard */
  primaryLanguageLabel: 'Primary',

  /** Label for the secondary language tab */
  secondaryLanguageLabel: 'English',

  /** Attribution line appended to every caption */
  botAttributionLine: '\n\n\u{1F916} This content was generated and posted automatically using AI.',

  /** Link included in captions (your landing page / product page) */
  campaignLink: process.env.CAMPAIGN_LINK || 'https://your-site.com',
};
