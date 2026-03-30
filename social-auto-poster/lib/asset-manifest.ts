/**
 * Asset manifest — catalog of images and videos used in your campaign posts.
 *
 * Assets can be hosted on a CDN, or placed in the `public/` folder.
 * Set NEXT_PUBLIC_ASSET_CDN to use an external CDN base URL.
 *
 * To add assets:
 *   1. Place files in `public/assets/` (e.g. `public/assets/day1-slide-1.png`)
 *   2. Add an entry to ALL_ASSETS below
 *   3. The auto-poster will pick them up based on `day` and `category`
 *
 * Supported categories:
 *   - carousel: Image slides for carousel posts (use slideNum for ordering)
 *   - image_post: Single image posts
 *   - story: Story frames (use slideNum for ordering)
 *   - reel: Short-form video (Instagram Reels, Facebook Reels, LinkedIn video)
 *   - video: Long-form video (Facebook video, LinkedIn video)
 *
 * Video requirements:
 *   - Must be publicly accessible URLs (not localhost) for Instagram
 *   - MP4 format recommended for all platforms
 *   - Instagram Reels: 3-90 seconds, 9:16 aspect ratio recommended
 *   - Facebook: up to 240 minutes, most formats supported
 *   - LinkedIn: up to 10 minutes, MP4 required
 */

const CDN_BASE = process.env.NEXT_PUBLIC_ASSET_CDN || '';

export type AssetCategory =
  | 'carousel'
  | 'story'
  | 'reel'
  | 'image_post'
  | 'video';

export interface Asset {
  id: string;
  url: string;               // Full URL or path from public/
  category: AssetCategory;
  day?: number;              // Campaign day association
  label: string;             // Human-readable label
  slideNum?: number;         // For carousels/stories (1-based)
}

function asset(
  id: string,
  path: string,
  category: AssetCategory,
  label: string,
  opts?: { day?: number; slideNum?: number },
): Asset {
  const url = CDN_BASE ? `${CDN_BASE}/${path}` : `/${path}`;
  return { id, url, category, label, day: opts?.day, slideNum: opts?.slideNum };
}

// ═══════════════════════════════════════════════════════════════
// EXAMPLE ASSETS — Replace with your actual images and videos
//
// Place files in `public/assets/` and reference them here.
// For example, `public/assets/day1-slide-1.png` becomes
// `assets/day1-slide-1.png` in the path argument.
//
// For videos, use category 'reel' or 'video':
//   asset('d4-reel', 'assets/day4-reel.mp4', 'reel', 'Day 4 Reel', { day: 4 }),
//   asset('d5-vid', 'assets/day5-video.mp4', 'video', 'Day 5 Video', { day: 5 }),
// ═══════════════════════════════════════════════════════════════

export const ALL_ASSETS: Asset[] = [
  // Day 1 carousel slides
  asset('d1-s1', 'assets/day1-slide-1.png', 'carousel', 'Day 1 Slide 1', { day: 1, slideNum: 1 }),
  asset('d1-s2', 'assets/day1-slide-2.png', 'carousel', 'Day 1 Slide 2', { day: 1, slideNum: 2 }),
  asset('d1-s3', 'assets/day1-slide-3.png', 'carousel', 'Day 1 Slide 3', { day: 1, slideNum: 3 }),

  // Day 2 image
  asset('d2-img', 'assets/day2-image.png', 'image_post', 'Day 2 Image', { day: 2 }),

  // Day 3 image
  asset('d3-img', 'assets/day3-image.png', 'image_post', 'Day 3 Image', { day: 3 }),
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getAssetsByCategory(category: AssetCategory): Asset[] {
  return ALL_ASSETS.filter(a => a.category === category);
}

export function getAssetsForDay(day: number): Asset[] {
  return ALL_ASSETS.filter(a => a.day === day);
}

export function getAssetById(id: string): Asset | undefined {
  return ALL_ASSETS.find(a => a.id === id);
}
