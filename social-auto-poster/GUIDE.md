# Social Auto-Poster — Setup Guide

A step-by-step tutorial for setting up automated social media posting across Facebook, Instagram, and LinkedIn.

---

## 1. What You're Building

A system that:
- Auto-posts your campaign content to Facebook, Instagram, and LinkedIn on a daily schedule
- Supports images, carousels, videos, and Instagram Reels
- Provides a web dashboard to monitor progress and manually trigger posts
- Supports bilingual captions (primary + secondary language)
- Catches up on missed posts automatically
- Prevents duplicate posts with fresh status checks and concurrency locks
- Manages LinkedIn OAuth tokens with auto-refresh and CSRF protection

**Tech stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Netlify + Meta Graph API v25.0 + LinkedIn Marketing API

---

## 2. Prerequisites

Before starting, you need:

- [ ] **Node.js 18+** installed
- [ ] **Netlify account** (free tier works)
- [ ] **GitHub account** (for deployment)
- [ ] **Facebook Page** (not a personal profile)
- [ ] **Instagram Business Account** connected to your Facebook Page
- [ ] **LinkedIn Company Page** (optional, for LinkedIn posting)
- [ ] **Meta Developer Account** at developers.facebook.com
- [ ] **LinkedIn Developer Account** at developer.linkedin.com (optional)

---

## 3. Quick Start

```bash
# Clone the repository
git clone <your-repo-url> my-campaign
cd my-campaign

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000/dashboard` — you'll see the login screen.

Set `ADMIN_PASSWORD=your-password` in `.env.local` to log in.

### Verify Your Setup

```bash
npm run typecheck   # TypeScript check (should pass with 0 errors)
npm run lint        # ESLint
npm run build       # Full production build
```

---

## 4. Meta Setup (Facebook + Instagram)

### 4.1 Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps** > **Create App**
3. Choose **Business** type
4. Name it (e.g., "My Campaign Auto-Poster")
5. Add the **Pages** product to your app

### 4.2 Get Your Page Access Token

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click **Generate Access Token**
4. Grant permissions: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
5. Select your Page from the Page dropdown
6. Copy the token — this is your `META_PAGE_TOKEN`

**Important:** This token expires. For a long-lived token:
1. Go to your app settings > **Access Tokens**
2. Click **Debug** on your token
3. Click **Extend Access Token** — this gives you a ~60-day token

### 4.3 Get Your Page ID

1. In Graph API Explorer, make a GET request to `me/accounts`
2. Find your page in the results
3. Copy the `id` field — this is your `META_PAGE_ID`

### 4.4 Get Your Instagram Business Account ID

1. In Graph API Explorer, make a GET request to `{META_PAGE_ID}?fields=instagram_business_account`
2. Copy the `instagram_business_account.id` — this is your `META_IG_ACCOUNT_ID`

### 4.5 Set Environment Variables

```bash
META_PAGE_ID=your-page-id
META_PAGE_TOKEN=your-page-access-token
META_IG_ACCOUNT_ID=your-instagram-business-account-id
```

### 4.6 Important: Instagram Media Requirements

**Images** must be:
- Publicly accessible URLs (not localhost)
- Between 320px and 1440px wide
- JPEG or PNG format
- Aspect ratio between 4:5 and 1.91:1

**Videos/Reels** must be:
- Publicly accessible URLs (not localhost)
- MP4 format (H.264 codec recommended)
- Between 3 and 90 seconds long
- 9:16 aspect ratio recommended for Reels
- Maximum file size: 1GB

If your media files are in `public/assets/`, they won't work with Instagram locally. You need to deploy first, or use a CDN (`NEXT_PUBLIC_ASSET_CDN`).

---

## 5. LinkedIn Setup (Optional)

### 5.1 Create a LinkedIn App

1. Go to [developer.linkedin.com](https://developer.linkedin.com)
2. Click **Create App**
3. Fill in app details, associate it with your Company Page
4. Note your **Client ID** and **Client Secret**

### 5.2 Verify Your Company Page

1. In app settings, go to **Settings** tab
2. Under **Company Page**, verify your page admin access
3. This is required for posting on behalf of the company

### 5.3 Request API Access

1. Go to **Products** tab in your LinkedIn app
2. Request access to **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect**
3. These may require approval (usually instant for Share on LinkedIn)

### 5.4 Configure OAuth Redirect

1. Go to **Auth** tab
2. Add redirect URL: `https://your-site.netlify.app/api/linkedin/callback`
3. Also add `http://localhost:3000/api/linkedin/callback` for local development

### 5.5 Set Environment Variables

```bash
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_ORG_ID=your-company-page-id
```

### 5.6 Authorize LinkedIn

1. Visit `https://your-site.netlify.app/api/linkedin` (or `http://localhost:3000/api/linkedin`)
2. Approve the permissions
3. You'll be redirected back with a success message
4. Tokens are stored in Netlify Blobs and auto-refresh

The authorization flow is CSRF-protected — a unique state token is stored in an HTTP-only cookie and validated on callback (see Section 11).

---

## 6. Create Your Campaign Content

### 6.1 Configure Your Campaign

Edit `lib/config.ts`:

```typescript
export const SITE_CONFIG = {
  name: 'Your Campaign Name',
  timezone: 'America/New_York',  // Your timezone
  primaryLanguageLabel: 'Spanish',
  secondaryLanguageLabel: 'English',
  botAttributionLine: '\n\n🤖 Auto-posted with AI.',
  campaignLink: 'https://your-site.com',
};
```

### 6.2 Set Campaign Dates

Edit `lib/scheduler-data.ts`:

```typescript
export const CAMPAIGN_START = '2026-03-01';  // First day of posting
export const CAMPAIGN_END = '2026-03-28';    // Last day

export const PHASES = {
  1: { name: 'Launch', dateRange: 'Mar 1 - Mar 7', dayRange: [1, 7] },
  2: { name: 'Value', dateRange: 'Mar 8 - Mar 14', dayRange: [8, 14] },
  3: { name: 'Proof', dateRange: 'Mar 15 - Mar 21', dayRange: [15, 21] },
  4: { name: 'Close', dateRange: 'Mar 22 - Mar 28', dayRange: [22, 28] },
};
```

The dashboard reads `dayRange` from each phase to determine the current phase automatically.

### 6.3 Add Your Posts

In the `CAMPAIGN_POSTS` array in `lib/scheduler-data.ts`, add one entry per day:

```typescript
// Image post
{
  day: 1,
  date: '2026-03-01',
  platforms: ['facebook', 'instagram', 'linkedin'],
  contentType: 'image_post',
  topic: 'Launch: Why Our Product Matters',
  goal: 'Awareness',
  copyPrimary: `Your primary language caption...`,
  copySecondary: `English translation...`,
  hashtags: ['#YourBrand', '#Launch'],
  utmLink: utm(1, 'social', 'post_launch'),
  visualDescription: 'Describe the image you want to create',
  phase: 1,
},

// Reel/video post
{
  day: 3,
  date: '2026-03-03',
  platforms: ['facebook', 'instagram', 'linkedin'],
  contentType: 'reel',   // or 'video' for longer content
  topic: 'Behind the Scenes',
  goal: 'Engagement',
  copyPrimary: `Watch what goes into making...`,
  copySecondary: `English version...`,
  hashtags: ['#BTS', '#YourBrand'],
  utmLink: utm(3, 'social', 'reel_bts'),
  visualDescription: 'Short behind-the-scenes clip',
  phase: 1,
},
```

**Supported content types:** `'carousel'`, `'image_post'`, `'text_post'`, `'reel'`, `'video'`, `'story'`, `'poll'`

**Tip:** You can ask Claude Code to generate posts for you. It reads `CLAUDE.md` and understands the data format.

### 6.4 Add Your Images

1. Create images (1080x1080 for Instagram, 1200x630 for Facebook)
2. Place them in `public/assets/`
3. Register in `lib/asset-manifest.ts`:

```typescript
asset('d1-img', 'assets/day1-image.png', 'image_post', 'Day 1 Image', { day: 1 }),
```

### 6.5 Add Your Videos

The system supports video/reel uploads for all three platforms.

1. Create your video (MP4 format recommended)
2. Place it in `public/assets/`
3. Register in `lib/asset-manifest.ts` with category `'reel'` or `'video'`:

```typescript
// Instagram Reel / short-form video
asset('d3-reel', 'assets/day3-reel.mp4', 'reel', 'Day 3 Reel', { day: 3 }),

// Longer video (Facebook/LinkedIn)
asset('d5-vid', 'assets/day5-video.mp4', 'video', 'Day 5 Video', { day: 5 }),
```

4. Set `contentType: 'reel'` or `contentType: 'video'` on the post in `lib/scheduler-data.ts`

**How video publishing works per platform:**

| Platform | How it uploads | Duration limit | Format | Notes |
|----------|---------------|----------------|--------|-------|
| **Facebook** | Resumable chunked upload to `/{pageId}/videos` | Up to 240 min | MP4 | Downloads video, uploads in chunks |
| **Instagram** | `media_type: 'REELS'` with `video_url` | 3-90 sec | MP4 | Polls processing status until ready |
| **LinkedIn** | Initialize + chunk upload to `/rest/videos` | Up to 10 min | MP4 | Downloads video, uploads chunks per instructions |

**Important:** For Instagram, videos must be hosted on a publicly accessible URL (just like images). Local files on `localhost` won't work — deploy first or use a CDN (`NEXT_PUBLIC_ASSET_CDN`).

**Asset resolution order for video posts:**
1. Day-specific video/reel asset (matching `day` number)
2. Any reel/video asset by rotation
3. Falls back to text-only post if no video found (Facebook/LinkedIn) or returns error (Instagram)

---

## 7. Deploy to Netlify

### 7.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 7.2 Connect to Netlify

1. Log in to [netlify.com](https://netlify.com)
2. Click **Add new site** > **Import an existing project**
3. Connect your GitHub repo
4. Build settings are auto-detected from `netlify.toml`
5. Click **Deploy**

### 7.3 Set Environment Variables

In Netlify dashboard > Site Settings > Environment Variables, add ALL variables from `.env.example`:

| Variable | Value |
|----------|-------|
| `ADMIN_PASSWORD` | Your secure password |
| `SESSION_SECRET` | Random 32+ char string |
| `CRON_SECRET` | Random string for cron auth |
| `CAMPAIGN_LINK` | Your landing page URL |
| `TIMEZONE` | Your IANA timezone |
| `META_PAGE_ID` | From step 4.3 |
| `META_PAGE_TOKEN` | From step 4.2 |
| `META_IG_ACCOUNT_ID` | From step 4.4 |
| `LINKEDIN_CLIENT_ID` | From step 5.1 |
| `LINKEDIN_CLIENT_SECRET` | From step 5.1 |
| `LINKEDIN_ORG_ID` | Your company page ID |
| `NEXT_PUBLIC_ASSET_CDN` | (Optional) CDN base URL for images/videos |

### 7.4 Verify Cron

After deployment, check Netlify Functions logs to verify the cron is running:
1. Go to your site in Netlify > Functions
2. Look for `social-scheduler`
3. It should show execution logs at the scheduled time

---

## 8. Admin Dashboard

### Today View (`/dashboard`)
- Shows today's posts with bilingual copy
- Overdue posts (past days with unposted platforms)
- Coming up (next 3 days)
- Campaign metrics (posted count, bot vs manual, overdue)
- Phase progress bars derived from `PHASES` config

### Schedule View (`/dashboard/schedule`)
- Full calendar grouped by phase
- Filter by platform or content type (Reels, Stories)
- Click any day to expand and see full post details
- Toggle posted status manually
- "Post Now" button for on-demand publishing

### Post Cards
- **Language tabs** — switch between primary and secondary copy
- **Copy button** — clipboard copy for caption and hashtags
- **Edit** — temporarily modify caption before copying
- **Post Now** — publish immediately via API (checks for duplicates first)
- **Posted toggle** — mark as manually posted
- **Bot badge** — green "Bot" tag on auto-posted items (manual posts show no badge)

---

## 9. Monitoring and Troubleshooting

### Token Expiry (Meta)

Your Meta Page Access Token expires after ~60 days. When it expires:
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Generate a new token
3. Extend it (for 60-day lifetime)
4. Update `META_PAGE_TOKEN` in Netlify env vars
5. Redeploy

### Token Expiry (LinkedIn)

LinkedIn tokens auto-refresh if a refresh token is available. If both expire:
1. Visit `https://your-site.netlify.app/api/linkedin`
2. Re-authorize
3. New tokens are saved automatically

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `META_PAGE_TOKEN not set` | Missing env var | Add to Netlify env vars |
| `No image or video available for Instagram` | No asset found for that day | Add an image or video to `asset-manifest.ts` |
| `IG container error` | Image URL not publicly accessible | Deploy first, or use CDN |
| `IG reel container error` | Video URL not accessible or wrong format | Ensure MP4 is publicly hosted, 3-90 sec |
| `IG reel processing timed out` | Instagram took too long to process video | Video may be too large; try a shorter/smaller file |
| `Failed to download video` | Video URL returned an error | Check the URL is accessible and returns a valid MP4 |
| `LinkedIn not connected` | No OAuth tokens | Visit `/api/linkedin` to authorize |
| `LI video upload failed` | LinkedIn rejected the video | Ensure MP4 format, under 10 min, under 200MB |
| `CRON_SECRET not set` | Missing env var | Add to Netlify env vars |
| `Unauthorized` (cron) | Wrong CRON_SECRET | Verify env var matches |
| `Already posted` | Duplicate post prevented | Post was already published — expected safety behavior |
| `Invalid OAuth State` | LinkedIn callback state mismatch | Try the authorization flow again from `/api/linkedin` |
| `Already running` | Concurrent cron run blocked | Another auto-post run is in progress — expected safety behavior |

### Checking Cron Logs

1. Netlify Dashboard > Functions > `social-scheduler`
2. View execution logs with timestamps and results
3. Each run shows: day number, posts attempted, successes, skips, errors

---

## 10. Duplicate Post Prevention

The system has multiple safeguards to prevent posts from being published more than once:

### Fresh Status Checks

Before every publish (both auto-post and manual "Post Now"), the system re-reads the current status from the blob store. This prevents duplicates when:
- The cron fires multiple times (Netlify retries on timeout/error)
- A manual "Post Now" overlaps with an in-progress cron run
- Multiple function instances run concurrently

### Concurrency Lock

The cron endpoint (`/api/cron/social-post`) uses an in-memory lock to reject overlapping requests within the same function instance. If a second cron invocation arrives while one is already running, it returns immediately with `{ skipped: "Already running" }`.

### Manual Post Guard

The "Post Now" function checks the blob store before publishing. If the post was already published (by a cron run or another manual click), it returns an error instead of posting again. The dashboard also disables the button while a post is in progress to prevent double-clicks.

### Bot vs Manual Tracking

Posts are tracked with an `autoPosted` flag:
- **Auto-posted** (cron): marked `autoPosted: true`, shown with a green "Bot" badge
- **Manual** ("Post Now" button): marked `autoPosted: false`, no Bot badge
- **Manually toggled** (checkbox only, no API call): tracked separately

---

## 11. LinkedIn OAuth Security

The LinkedIn authorization flow uses CSRF protection:

1. When you visit `/api/linkedin`, the system generates a unique `state` token using `crypto.randomUUID()`
2. The token is stored in an HTTP-only cookie (`linkedin_oauth_state`, 10-minute expiry)
3. When LinkedIn redirects back to `/api/linkedin/callback`, the system validates that the `state` parameter matches the cookie
4. If they don't match (potential CSRF attack), the request is rejected with "Invalid OAuth State"
5. The cookie is deleted after validation regardless of success/failure

The callback also sanitizes error messages from LinkedIn (escaping `<`, `>`, `"`, `'`, `&`) to prevent XSS injection.

---

## 12. Customization

### Change Caption Format

Edit the `buildCaption()` function in `lib/social-publisher.ts`:
- Modify what gets appended (hashtags, links, bot line)
- Change the `[REGISTRATION_LINK]` replacement logic
- Edit `SITE_CONFIG.botAttributionLine` in `lib/config.ts`

### Add More Languages

The system supports any two languages. To change:
1. Edit `SITE_CONFIG.primaryLanguageLabel` and `secondaryLanguageLabel` in `lib/config.ts`
2. `copyPrimary` and `copySecondary` in each post can be any language

### Change Cron Schedule

Edit `netlify/functions/social-scheduler.ts`:
```typescript
export const config: Config = {
  schedule: '0 14 * * *', // 2:00 PM UTC = 10:00 AM EST
};
```

### Customize Phase Day Ranges

Edit the `PHASES` object in `lib/scheduler-data.ts`. The dashboard automatically reads `dayRange` from each phase to determine the current phase — no hardcoded day ranges elsewhere.

### Add Dashboard Pages

1. Create a new page in `app/dashboard/your-page/page.tsx`
2. Add a nav item in `components/dashboard/Sidebar.tsx`
3. The layout with sidebar and status bar is inherited automatically

### Change Brand Colors

Edit the CSS variables in `app/dashboard/dashboard.css`. The main accent color is `#0284c7` (sky-600).
