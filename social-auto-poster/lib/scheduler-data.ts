import { SchedulerPost, CampaignPhase, Platform } from './scheduler-types';
import { SITE_CONFIG } from './config';

// ═══════════════════════════════════════════════════════════════
// CAMPAIGN DATES — Edit these to match your campaign window
// ═══════════════════════════════════════════════════════════════
export const CAMPAIGN_START = '2026-01-15';   // First day of posting
export const CAMPAIGN_END = '2026-01-17';     // Last day of posting (3 example days)

// ═══════════════════════════════════════════════════════════════
// PHASES — Define your campaign phases (1-4)
// Each phase has a name, date range, and day range.
// ═══════════════════════════════════════════════════════════════
export const PHASES: Record<CampaignPhase, { name: string; dateRange: string; dayRange: [number, number] }> = {
  1: { name: 'Launch', dateRange: 'Jan 15 - Jan 17', dayRange: [1, 3] },
  2: { name: 'Momentum', dateRange: 'Jan 18 - Jan 24', dayRange: [4, 10] },
  3: { name: 'Social Proof', dateRange: 'Jan 25 - Jan 31', dayRange: [11, 17] },
  4: { name: 'Final Push', dateRange: 'Feb 1 - Feb 7', dayRange: [18, 24] },
};

// ═══════════════════════════════════════════════════════════════
// PLATFORM INFO — Display names and colors for each platform
// ═══════════════════════════════════════════════════════════════
export const PLATFORM_INFO: Record<Platform, { name: string; color: string; iconLabel: string }> = {
  facebook: { name: 'Facebook', color: '#1877F2', iconLabel: 'FB' },
  instagram: { name: 'Instagram', color: '#E4405F', iconLabel: 'IG' },
  linkedin: { name: 'LinkedIn', color: '#0A66C2', iconLabel: 'LI' },
};

// Helper to build UTM links for your posts
function utm(day: number, platform: string, type: string): string {
  const base = SITE_CONFIG.campaignLink;
  return `${base}?utm_source=${platform}&utm_medium=social&utm_campaign=day${day}_${type}`;
}

// ═══════════════════════════════════════════════════════════════
// CAMPAIGN POSTS — Your content schedule
//
// This array defines every post in your campaign. Each entry maps
// to one or more social media platforms and includes bilingual copy.
//
// To add a new post, copy one of the examples below and edit:
//   - day: sequential day number (1, 2, 3, ...)
//   - date: ISO date matching that day
//   - platforms: which platforms to post on
//   - contentType: carousel, image_post, text_post, story, reel, video, poll
//   - copyPrimary / copySecondary: your caption text
//   - hashtags: array of hashtag strings
//   - phase: which campaign phase (1-4) this belongs to
// ═══════════════════════════════════════════════════════════════
export const CAMPAIGN_POSTS: SchedulerPost[] = [
  // ── Day 1: Carousel post across all platforms ──
  {
    day: 1,
    date: '2026-01-15',
    platforms: ['facebook', 'instagram', 'linkedin'],
    contentType: 'carousel',
    topic: '5 Reasons Your Product Deserves a Global Audience',
    goal: 'Awareness',
    copyPrimary: `Why limit your product to one market?

5 signs you're ready to go global:

1. Your product solves a universal problem
2. You've outgrown your local market
3. International competitors are already in your space
4. You have a unique value proposition
5. Digital tools make it easier than ever

Ready to take the leap? [REGISTRATION_LINK]`,
    copySecondary: `Why limit your product to one market? 5 signs you're ready to go global — from solving universal problems to leveraging digital tools. Ready to take the leap?`,
    hashtags: ['#GoGlobal', '#Export', '#SmallBusiness'],
    utmLink: utm(1, 'social', 'carousel_5reasons'),
    visualDescription: 'Dark background, each slide with a bold stat. Final slide = CTA.',
    phase: 1,
  },

  // ── Day 2: Image post on Facebook and LinkedIn ──
  {
    day: 2,
    date: '2026-01-16',
    platforms: ['facebook', 'linkedin'],
    contentType: 'image_post',
    topic: 'Meet the Instructor — Why I Built This Program',
    goal: 'Authority / Connection',
    copyPrimary: `After years of helping businesses expand internationally, I kept seeing the same pattern: great products, no system.

That's why I created this program — a practical, step-by-step framework that covers the full export cycle.

4 weeks. Hands-on. Results-driven.

Registration is open — link in bio.`,
    copySecondary: `After years in international business consulting, I kept seeing the same gap: great products but no system for export. That's why I built this program — practical, hands-on, results-driven. Registration is open.`,
    hashtags: ['#ExportReady', '#BusinessGrowth'],
    utmLink: utm(2, 'social', 'post_personalstory'),
    visualDescription: 'Professional photo with dark overlay and accent color line',
    phase: 1,
  },

  // ── Day 3: Text post on all platforms ──
  {
    day: 3,
    date: '2026-01-17',
    platforms: ['facebook', 'instagram', 'linkedin'],
    contentType: 'text_post',
    topic: 'The Cost of Waiting — Why Now Is the Time',
    goal: 'Urgency / Conversion',
    copyPrimary: `Every month you don't start expanding:

- You lose potential revenue from international markets
- Competitors fill your space
- You miss diversification opportunities

The investment pays for itself with your first international deal.

Don't wait. Register now: [REGISTRATION_LINK]`,
    copySecondary: `Every month you delay going international costs you revenue, market position, and diversification opportunities. The investment pays for itself with your first deal. Register now.`,
    hashtags: ['#TakeAction', '#Export', '#BusinessGrowth'],
    utmLink: utm(3, 'social', 'post_costofwaiting'),
    visualDescription: 'Split graphic: "Now vs. 6 Months Later" comparison on dark background',
    phase: 1,
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — Used by the dashboard and auto-poster
// ═══════════════════════════════════════════════════════════════

/** Calculate the current campaign day number (1-based). Returns 0 if before campaign. */
export function getTodaysDayNumber(): number {
  const tz = SITE_CONFIG.timezone;
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  const start = new Date(CAMPAIGN_START + 'T00:00:00');
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays < 1) return 0;
  const totalDays = CAMPAIGN_POSTS.length > 0
    ? Math.max(...CAMPAIGN_POSTS.map(p => p.day))
    : 1;
  if (diffDays > totalDays) return totalDays + 1;
  return diffDays;
}

/** Get the max day number in the campaign */
export function getCampaignLength(): number {
  return CAMPAIGN_POSTS.length > 0
    ? Math.max(...CAMPAIGN_POSTS.map(p => p.day))
    : 0;
}

/** Get all posts scheduled for a specific day. */
export function getPostsForDay(day: number): SchedulerPost[] {
  return CAMPAIGN_POSTS.filter(p => p.day === day);
}

/** Get all posts in a given campaign phase. */
export function getPostsByPhase(phase: CampaignPhase): SchedulerPost[] {
  return CAMPAIGN_POSTS.filter(p => p.phase === phase);
}
