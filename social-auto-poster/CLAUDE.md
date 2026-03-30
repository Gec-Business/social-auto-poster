# Social Auto-Poster — Architecture Reference

## Overview

This is a complete social media auto-posting system. It schedules campaign content across Facebook, Instagram, and LinkedIn, with a web dashboard for management and manual posting.

## Tech Stack

- **Next.js 16** + React 19 + TypeScript, Tailwind CSS 4, App Router
- **Netlify Blobs** (database for post status + LinkedIn tokens)
- **Netlify Scheduled Functions** (daily cron for auto-posting)
- **iron-session** (dashboard authentication)
- **Meta Graph API v25.0** (Facebook Page + Instagram Business)
- **LinkedIn Marketing API** (Company Page posts with image upload)

## File Architecture

```
social-auto-poster/
├── lib/
│   ├── config.ts              # Central config: site name, timezone, languages, bot line, campaign link
│   ├── scheduler-types.ts     # TypeScript types: Platform, ContentType, SchedulerPost, PostStatus
│   ├── scheduler-data.ts      # Campaign posts array + date/phase config + helper functions
│   ├── scheduler-blobs.ts     # Netlify Blobs persistence for post status (social-scheduler store)
│   ├── social-publisher.ts    # Publishing engine: FB, IG, LI + caption builder + asset resolution
│   ├── linkedin-tokens.ts     # LinkedIn OAuth token storage + auto-refresh
│   ├── asset-manifest.ts      # Image asset catalog with CDN support
│   ├── auth.ts                # iron-session authentication
│   └── types.ts               # SessionData interface
│
├── app/
│   ├── layout.tsx             # Root layout (Inter font, metadata)
│   ├── page.tsx               # Redirect to /dashboard
│   ├── globals.css            # Tailwind import + base styles
│   ├── api/
│   │   ├── auth/route.ts      # POST: login, DELETE: logout
│   │   ├── scheduler/route.ts # GET: status map, PATCH: toggle posted
│   │   ├── marketing/post-now/route.ts  # POST: on-demand publish
│   │   ├── cron/social-post/route.ts    # POST: cron auto-publish (requires x-cron-secret)
│   │   └── linkedin/
│   │       ├── route.ts       # GET: redirect to LinkedIn OAuth
│   │       └── callback/route.ts  # GET: exchange code for tokens
│   └── dashboard/
│       ├── layout.tsx         # Sidebar + status bar
│       ├── dashboard.css      # All mcc-* styles
│       ├── page.tsx           # Today view (login, metrics, overdue, today, coming up)
│       └── schedule/page.tsx  # Full calendar with phase groups + filters
│
├── components/dashboard/
│   ├── PostCard.tsx           # Post card with bilingual tabs, copy buttons, post-now, toggles
│   ├── PlatformBadge.tsx      # Colored FB/IG/LI badge
│   ├── CopyButton.tsx         # Clipboard copy with feedback
│   ├── MetricCard.tsx         # Stat display card
│   ├── CampaignStatusBar.tsx  # Top bar showing day/phase/countdown
│   ├── Sidebar.tsx            # Navigation sidebar (Today + Schedule)
│   └── AssetLightbox.tsx      # Full-screen image viewer
│
├── netlify/functions/
│   └── social-scheduler.ts    # Netlify cron (daily) → calls /api/cron/social-post
│
├── .env.example               # All environment variables documented
├── netlify.toml               # Build + functions config
└── GUIDE.md                   # Step-by-step setup tutorial
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_PASSWORD` | Yes | Dashboard login password |
| `SESSION_SECRET` | Yes | iron-session secret (min 32 chars) |
| `CRON_SECRET` | Yes | Shared secret for cron endpoint |
| `CAMPAIGN_LINK` | Yes | URL included in every caption |
| `TIMEZONE` | No | IANA timezone (default: UTC) |
| `META_PAGE_ID` | For FB | Facebook Page ID |
| `META_PAGE_TOKEN` | For FB/IG | Page Access Token |
| `META_IG_ACCOUNT_ID` | For IG | Instagram Business Account ID |
| `LINKEDIN_CLIENT_ID` | For LI | LinkedIn App Client ID |
| `LINKEDIN_CLIENT_SECRET` | For LI | LinkedIn App Client Secret |
| `LINKEDIN_ORG_ID` | For LI | LinkedIn Organization ID |
| `NEXT_PUBLIC_ASSET_CDN` | No | CDN base URL for images |

## Campaign Configuration

Edit `lib/config.ts` to set:
- `name` — displayed in sidebar
- `timezone` — for campaign day calculation
- `primaryLanguageLabel` / `secondaryLanguageLabel` — tab labels in PostCard
- `botAttributionLine` — appended to every caption
- `campaignLink` — link included in captions

Edit `lib/scheduler-data.ts` to set:
- `CAMPAIGN_START` / `CAMPAIGN_END` — ISO date strings
- `PHASES` — 4 phases with names, date ranges, and day ranges

## Data Types

### SchedulerPost (the core content unit)

```typescript
interface SchedulerPost {
  day: number;            // Sequential day (1, 2, 3, ...)
  date: string;           // ISO date: '2026-01-15'
  platforms: Platform[];  // ['facebook', 'instagram', 'linkedin']
  contentType: ContentType; // 'carousel' | 'image_post' | 'text_post' | 'story' | 'reel' | 'video' | 'poll'
  topic: string;          // Short topic title
  goal: string;           // 'Awareness', 'Authority', 'Conversion', etc.
  copyPrimary: string;    // Caption in primary language
  copySecondary: string;  // Caption in secondary language (English)
  hashtags: string[];     // ['#Tag1', '#Tag2']
  utmLink: string;        // Tracking URL
  visualDescription: string; // Description for image creation
  notes?: string;         // Optional notes
  phase: CampaignPhase;   // 1 | 2 | 3 | 4
}
```

### PostStatus (tracking state)

```typescript
interface PostStatus {
  posted: boolean;
  postedAt: string;     // ISO datetime
  autoPosted?: boolean; // true = bot posted
  postId?: string;      // Platform's post ID
}
```

## How Auto-Posting Works

1. **Netlify Scheduled Function** (`netlify/functions/social-scheduler.ts`) fires daily at the configured time
2. It calls `POST /api/cron/social-post` with `x-cron-secret` header
3. The endpoint calls `runAutoPost()` in `lib/social-publisher.ts`
4. `runAutoPost()` calculates today's day number, then iterates Day 1 through today
5. For each day+platform combo, it checks `scheduler-status` blob — skips if already posted
6. It builds the caption from `copyPrimary` + hashtags + campaign link + bot attribution
7. It resolves an image using the asset cascade (carousel slides → day asset → fallback)
8. It calls the platform-specific publish function (FB, IG, or LI)
9. On success, it writes `{ posted: true, autoPosted: true, postId }` to the blob store
10. The dashboard reads the blob store to show green "Bot" badges and posted status

## Platform-Specific Details

### Facebook
- Images: `/{pageId}/photos` (with image) or `/{pageId}/feed` (text only)
- Videos: `/{pageId}/videos` with resumable chunked upload (start → transfer chunks → finish)
- Requires: `META_PAGE_ID` + `META_PAGE_TOKEN`

### Instagram
- Single image: create container → wait 5s → publish
- Carousel (2-10 images): create child containers → carousel container → wait → publish
- Reels/Video: create container with `media_type: 'REELS'` + `video_url` → poll status until processed → publish
- Requires: `META_IG_ACCOUNT_ID` + `META_PAGE_TOKEN`
- Images and videos MUST be publicly accessible URLs (not local files)
- Reels: 3-90 seconds, 9:16 aspect ratio recommended, MP4 format

### LinkedIn
- Posts as organization (company page)
- Image upload: initialize upload → download image → PUT to LinkedIn → create post with image URN
- Video upload: initialize upload → download video → upload chunks → finalize → create post with video URN
- OAuth flow: `/api/linkedin` → LinkedIn consent → `/api/linkedin/callback` → tokens saved to blob (CSRF-protected with state cookie)
- Token auto-refresh when expired (if refresh token available)
- Requires: `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` + `LINKEDIN_ORG_ID`
- Videos: up to 10 minutes, MP4 required

## Caption Building Logic

```
1. Start with copyPrimary
2. Replace [REGISTRATION_LINK] with SITE_CONFIG.campaignLink
3. Append hashtags (joined with spaces, separated by \n\n)
4. If campaign link not present, append "🔗 {link}"
5. Append SITE_CONFIG.botAttributionLine
```

## Asset Resolution

### Video Resolution (for reel/video content types)
1. Day-specific video/reel asset (category 'video' or 'reel' with matching day)
2. Any reel/video asset by rotation
3. Returns null if no video found

### Image Resolution (for image/carousel/story content types)
1. Carousel slides for the day (if contentType is 'carousel')
2. Any day-specific image asset (excludes video/reel assets)
3. Story frames (for story content type)
4. Returns null if no asset found (text-only post for FB/LI, error for IG)

## How to Add Your Content

### Adding Posts

In `lib/scheduler-data.ts`, add entries to the `CAMPAIGN_POSTS` array:

```typescript
{
  day: 4,
  date: '2026-01-18',
  platforms: ['facebook', 'instagram'],
  contentType: 'image_post',
  topic: 'Your post topic here',
  goal: 'Awareness',
  copyPrimary: `Your primary language caption here.

Include your key message, value proposition, and CTA.

Register now: [REGISTRATION_LINK]`,
  copySecondary: `English version of the caption.`,
  hashtags: ['#YourHashtag', '#Campaign'],
  utmLink: utm(4, 'social', 'post_yourtopic'),
  visualDescription: 'Description of the image to create',
  phase: 1,
}
```

### Adding Assets

1. Place images/videos in `public/assets/`
2. Register in `lib/asset-manifest.ts`:

```typescript
// Image
asset('d4-img', 'assets/day4-image.png', 'image_post', 'Day 4 Image', { day: 4 }),

// Video/Reel
asset('d5-reel', 'assets/day5-reel.mp4', 'reel', 'Day 5 Reel', { day: 5 }),
asset('d6-vid', 'assets/day6-video.mp4', 'video', 'Day 6 Video', { day: 6 }),
```

### Updating Campaign Dates

1. Change `CAMPAIGN_START` and `CAMPAIGN_END` in `lib/scheduler-data.ts`
2. Update `PHASES` date ranges and day ranges to match
3. Update `date` fields on all posts

### Updating Phase Names

Edit the `PHASES` object in `lib/scheduler-data.ts`.

## Deploy Instructions

1. Push to GitHub
2. Connect repo to Netlify
3. Set all env vars from `.env.example` in Netlify dashboard
4. Deploy triggers automatically on push
5. Cron runs daily — verify in Netlify Functions logs

## Code Quality

```bash
npm run typecheck   # TypeScript check
npm run lint        # ESLint
npm run build       # Full production build
```
