# Social Auto-Poster

A complete social media auto-posting system for Facebook, Instagram, and LinkedIn. Schedule your campaign content, auto-post via APIs, and manage everything from a web dashboard.

## Features

- **Auto-posting** to Facebook Pages, Instagram Business, and LinkedIn Company Pages
- **Dashboard** with today view, full schedule calendar, and progress tracking
- **Bilingual support** — primary + secondary language tabs for every post
- **Manual + Bot posting** — post on-demand from the dashboard or let the daily cron handle it
- **Catch-up mode** — if the cron missed a day, it auto-posts all missed content
- **LinkedIn OAuth** — secure token management with auto-refresh
- **Netlify-native** — Blobs for persistence, Scheduled Functions for cron

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url> social-auto-poster
cd social-auto-poster
npm install

# 2. Configure
cp .env.example .env.local
# Edit .env.local with your API keys (see GUIDE.md for setup instructions)

# 3. Run locally
npm run dev
# Visit http://localhost:3000/dashboard
```

## Deploy to Netlify

```bash
# Push to GitHub, then connect to Netlify
# Or use the Netlify CLI:
npx netlify deploy --prod
```

Set all environment variables from `.env.example` in Netlify's dashboard under Site Settings > Environment Variables.

## Documentation

- **[GUIDE.md](./GUIDE.md)** — Step-by-step tutorial for Meta setup, LinkedIn setup, content creation, and deployment
- **[CLAUDE.md](./CLAUDE.md)** — Architecture reference for Claude Code (use this to generate content and customize the system)

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Netlify (Blobs, Scheduled Functions)
- iron-session (dashboard auth)
- Meta Graph API v25.0 (Facebook + Instagram)
- LinkedIn Marketing API (posts + images)

## Adding Your Content

1. Edit `lib/scheduler-data.ts` — add your posts with bilingual copy
2. Place images in `public/assets/` and register them in `lib/asset-manifest.ts`
3. Update `lib/config.ts` with your campaign name, timezone, and link
4. Deploy!

Or tell Claude Code: *"Add 10 more posts to my campaign about [your topic]"* — it reads `CLAUDE.md` and knows exactly how.
