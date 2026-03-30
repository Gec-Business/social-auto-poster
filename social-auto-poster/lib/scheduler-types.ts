export type Platform = 'facebook' | 'instagram' | 'linkedin';

export type ContentType =
  | 'carousel'
  | 'reel'
  | 'story'
  | 'image_post'
  | 'text_post'
  | 'video'
  | 'poll';

export type CampaignPhase = 1 | 2 | 3 | 4;

/**
 * A single scheduled post in your campaign.
 *
 * - `copyPrimary`: Caption in your primary language (shown first in dashboard)
 * - `copySecondary`: English caption (or any secondary language)
 */
export interface SchedulerPost {
  day: number;
  date: string;               // ISO date e.g. '2026-01-15'
  platforms: Platform[];
  contentType: ContentType;
  topic: string;
  goal: string;
  copyPrimary: string;        // Primary language caption
  copySecondary: string;      // Secondary language caption
  hashtags: string[];
  utmLink: string;
  visualDescription: string;
  notes?: string;
  phase: CampaignPhase;
}

export interface PostStatus {
  posted: boolean;
  postedAt: string;           // ISO datetime
  autoPosted?: boolean;       // true = bot posted via API
  postId?: string;            // Platform post ID
}

export type SchedulerStatusMap = Record<string, PostStatus>;
