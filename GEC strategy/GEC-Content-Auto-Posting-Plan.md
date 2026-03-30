# GEC Content & Auto-Posting System — Implementation Plan

**Version:** 1.0
**Date:** March 18, 2026
**Parent Document:** GEC-Architecture-v2.md
**Status:** Planning

---

## Context

GEC needs a content engine that handles **three distinct content modes**:
1. **Evergreen content** — AI-generated monthly batches, daily/3x-week posting
2. **Product campaigns** — time-bound with sell-by dates (SME Programme May launch, AI Service, Tender Compass)
3. **Newsletters & articles** — written by service leads, cross-posted to social + sent as email

The GUIDE.md from saletool.ninja provides production-ready social posting code (Meta Graph API + LinkedIn) that we fork and adapt. The key architectural shift: ninja uses static arrays + Netlify Blobs → GEC uses PostgreSQL (Neon) + dynamic content + Vercel.

**Architecture v2 is authoritative:** Vercel (not Netlify), Microsoft Graph API (not Resend), Odoo as CRM, Neon PG as intelligence layer.

---

## 1. Database Schema

Expand the minimal `social_posts` from Architecture v2 into a proper content engine. Five tables in `src/db/schema.ts`:

### `content_sources` — Where content comes from

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| source_type | text | evergreen \| campaign \| event_arc \| newsletter |
| name | text | e.g. "March 2026 Batch" |
| description | text | optional |
| status | text | draft \| active \| paused \| completed |
| starts_at | timestamptz | nullable |
| ends_at | timestamptz | nullable |
| config_json | jsonb | type-specific config |
| created_at | timestamptz | default now() |

**Usage by type:**
- Evergreen: "March 2026 Batch" — no end date
- Campaign: "SME Programme Launch" — config has product, launch_date, urgency_phases, posts_per_week
- Event arc: "AI Webinar Apr 2" — config has event_id, arc offsets
- Newsletter: "BPM Lead Article Mar" — links to newsletter

### `content_items` — Individual pieces of content

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| source_id | FK → content_sources | |
| content_category | text | insight \| event_promo \| social_proof \| assessment_teaser \| behind_scenes \| partner \| campaign_post \| newsletter_excerpt |
| format | text | image_post \| carousel \| reel \| story \| text_post \| video \| article |
| topic | text | brief description |
| copy_ka | text | Georgian text (primary) |
| copy_en | text | English translation |
| hashtags | jsonb | string array |
| media_urls | jsonb | string array |
| visual_description | text | AI-generated image description |
| utm_params | jsonb | tracking parameters |
| priority | int | 0=evergreen, 25-100=campaign phases, 200=event arc |
| review_status | text | pending \| approved \| rejected \| needs_edit |
| reviewed_at | timestamptz | |
| review_notes | text | |
| ai_generation_meta | jsonb | model, batch, generation context |
| created_at | timestamptz | default now() |

**Priority rules:**
- Campaign posts get higher priority than evergreen (25–100 based on urgency phase)
- Event arc posts get highest priority (200) — they're date-locked

### `posting_schedule` — The calendar

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| content_item_id | FK → content_items | |
| platform | text | linkedin \| facebook \| instagram |
| scheduled_at | timestamptz | when to post |
| status | text | scheduled \| posted \| failed \| skipped \| manual_queue |
| posted_at | timestamptz | |
| platform_post_id | text | ID from platform API |
| error_message | text | |
| retry_count | int | default 0, max 3 |
| auto_posted | boolean | default true |
| engagement_json | jsonb | likes, shares, comments (fetched later) |
| created_at | timestamptz | default now() |

- **Unique constraint:** (content_item_id, platform)
- LinkedIn starts as `manual_queue` until API approved

### `newsletters` — Service-lead authored content

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| author_name | text | |
| author_email | text | |
| title | text | |
| body_html | text | |
| body_text | text | |
| service_type | text | strategy \| bpm \| export \| ai_digital \| sme \| tender_compass \| general |
| status | text | draft \| ready \| published |
| published_at | timestamptz | |
| email_sent | boolean | default false |
| social_posts_generated | boolean | default false |
| source_id | FK → content_sources | nullable |
| created_at | timestamptz | default now() |

### `linkedin_tokens` — OAuth token storage

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| access_token | text | encrypted |
| refresh_token | text | |
| expires_at | timestamptz | |
| refresh_expires_at | timestamptz | |
| updated_at | timestamptz | default now() |

Replaces ninja's Netlify Blobs storage.

---

## 2. Content Pipeline

### 2a. Evergreen Content (AI-Generated)

```
Monthly: Lia clicks "Generate Batch" in admin
  → /api/content/generate-batch
  → Claude generates 20-30 posts respecting content mix (35% insight, 20% event, etc.)
  → Stored as content_items with review_status='pending'
  → Lia reviews in admin (approve/reject/edit) — ~30 min
  → Approved items fed to scheduler
  → Scheduler places them on calendar respecting active/break frequency
  → Vercel cron posts daily at 9 AM Tbilisi
```

### 2b. Product Campaigns (SME Programme, AI Service, Tender Compass)

```
Lia creates campaign: name, product, launch_date, urgency config
  → System generates posts in 4 urgency phases:
    • Awareness (60-45 days before): educational, what it is
    • Interest (44-20 days): value-driven, benefits, testimonials
    • Urgency (19-7 days): scarcity, countdown, social proof
    • Final push (6-0 days): last chance, FOMO
  → Posts get priority > evergreen, interleaved on calendar
  → Same review flow: Lia approves before posting
```

Each product has distinct messaging:
- **SME Programme**: cohort-based, limited spots, mentor showcase, ecosystem value
- **AI Service**: company-level assessment, ROI focus, case studies
- **Tender Compass**: SaaS features, time savings, win-rate stats, demo CTA

### 2c. Newsletters & Articles (Service-Lead Written)

```
Service lead writes article → sends to Lia
  → Lia pastes into /admin/content/newsletters (simple form)
  → On "Publish":
    1. Claude extracts 2-3 social excerpt posts (key quotes/insights)
    2. Excerpt posts enter normal review → schedule → post pipeline
    3. Email newsletter sent via Microsoft Graph API (P4 integration — stubbed initially)
```

### 2d. Event Promotion Arcs (Auto-Generated)

```
Event created (from P5 or manually in admin)
  → System generates 8 posts at fixed offsets:
    -14d announcement, -10d deep-dive, -7d spotlight,
    -3d urgency, -1d reminder, event day, +1d takeaway, +3d gated recording
  → Posts scheduled at absolute dates relative to event
  → Highest priority — these are date-locked
  → If event cancelled/rescheduled → linked posts auto-updated
```

---

## 3. Scheduling Engine

### GEC Calendar

| Period | Dates | Posting Frequency |
|--------|-------|-------------------|
| Active | Mar 1–Jun 15 | Daily (7/week) |
| Summer break | Jun 16–Sep 30 | 3x/week (Mon, Wed, Fri) |
| Active | Oct 1–Dec 15 | Daily (7/week) |
| Winter break | Dec 16–Feb 28 | 3x/week (Mon, Wed, Fri) |

Instagram has reduced frequency: 4x/week active, 2x/week break.

### Weekly Content Calendar (Active Period)

| Day | Default Type |
|-----|-------------|
| Monday | Insight/Educational |
| Tuesday | Assessment teaser |
| Wednesday | Event promo / partner |
| Thursday | Case study / social proof |
| Friday | Behind-the-scenes |
| Saturday | Best performer reshare or rest |
| Sunday | Rest |

### Slot Allocation Algorithm

```
For each posting day in range:
  1. Check if campaign/event_arc post claims this slot (priority > 0, date-locked)
  2. If yes → that post gets the slot, evergreen shifts
  3. If no → pick evergreen item that best fits weekly content mix target
  4. Create posting_schedule rows per platform with staggered times:
     - LinkedIn: 9:00 AM Tbilisi (05:00 UTC)
     - Facebook: 10:00 AM Tbilisi (06:00 UTC)
     - Instagram: 11:00 AM Tbilisi (07:00 UTC)
```

Content mix is a **soft constraint** — campaigns and events override it, scheduler rebalances around them.

### Vercel Cron Job

```
Daily at 05:00 UTC (9 AM Tbilisi):
  Query: posting_schedule WHERE scheduled_at <= now() AND status = 'scheduled'
  For each:
    → Get content_item (copy, media, hashtags)
    → Build platform-specific caption (GEC branding, UTMs)
    → Post via Meta Graph API / LinkedIn API
    → Update status (posted/failed)
    → Failed + transient error + retry_count < 3 → reschedule +1 hour
```

---

## 4. What to Fork from Ninja

### Fork & Adapt

| Ninja File | GEC File | Changes |
|---|---|---|
| `lib/social-publisher.ts` | `src/lib/social-publisher.ts` | Replace static array reads with DB queries. Replace Blobs with PG updates. Keep all Meta/LinkedIn API code verbatim. Update `buildCaption` for GEC branding. |
| `lib/linkedin-tokens.ts` | `src/lib/linkedin-tokens.ts` | Blobs → Drizzle queries to `linkedin_tokens` table |
| `app/api/linkedin/route.ts` | `src/app/api/linkedin/route.ts` | Update redirect URLs to app.gecbusiness.com |
| `app/api/linkedin/callback/route.ts` | `src/app/api/linkedin/callback/route.ts` | Update redirect URLs, Blobs → DB |
| `lib/auth.ts` | `src/lib/auth.ts` | Direct fork, change cookie name to `gec-admin-session` |
| `middleware.ts` | `src/middleware.ts` | Update protected routes to `/admin/*` |

### Don't Fork (replace with DB-driven equivalents)

| Ninja File | Why |
|---|---|
| `lib/scheduler-data.ts` | Static 44KB array → DB-driven content_items |
| `lib/scheduler-blobs.ts` | Netlify Blobs → PostgreSQL posting_schedule |
| `lib/asset-manifest.ts` | Static registry → media_urls in content_items |
| `netlify/functions/social-scheduler.ts` | Netlify cron → Vercel cron (vercel.json) |

---

## 5. Admin Dashboard

All under `src/app/(admin)/admin/content/` — protected by iron-session.

### Content Calendar (`/admin/content`)
- Monthly calendar grid with colored dots per platform
- Dot states: hollow=scheduled, filled=posted, red=failed, gray=manual_queue
- Click day → expand posts. Top bar: month nav, "Generate Batch" button
- Sidebar filters: source type, content category, platform, status

### Review Queue (`/admin/content/review`)
- Pending content_items list. Georgian/English toggle per item
- Approve / Reject / Edit actions. Batch approve for speed
- **This is Lia's 30-min weekly task** — must be fast, mobile-friendly

### Campaigns (`/admin/content/campaigns`)
- Create: name, product, launch date, description
- System generates campaign posts → appear in review queue
- Campaign dashboard: progress bar, urgency phase timeline, pause toggle
- Active campaigns: SME Programme, AI Service, Tender Compass

### Newsletters (`/admin/content/newsletters`)
- Simple form: author, title, service area, body (paste HTML or plain text)
- "Generate Social Posts" → Claude extracts excerpts → review queue
- "Send as Email" → Microsoft Graph API (stubbed until P4)

### Post Detail
- Full preview per platform. "Post Now" manual trigger
- Posting status per platform. Engagement metrics (later)

---

## 6. Build Order

### Phase 1: Foundation (3 days)
**Goal: DB exists, publisher works, admin shell**

1. Drizzle schema (`src/db/schema.ts`) — all 5 tables
2. Neon connection (`src/lib/db.ts`)
3. `drizzle-kit push` to create tables
4. Fork `social-publisher.ts` — adapt to read from DB
5. Fork `linkedin-tokens.ts` — Blobs → PG
6. Fork `auth.ts` + middleware
7. Admin layout shell (`src/app/(admin)/layout.tsx`)
8. `vercel.json` with cron config

### Phase 2: Content Generation + Review (3 days)
**Goal: AI generates content, Lia reviews**

9. AI content generator (`src/lib/ai-content-generator.ts`) — Claude API with GEC tone
10. `/api/content/generate-batch` route
11. Review queue page with approve/reject/edit
12. Content detail view with GE/EN toggle

### Phase 3: Scheduling + Auto-Posting (3 days)
**Goal: Approved content posts automatically**

13. Scheduling engine (`src/lib/content-scheduler.ts`)
14. `/api/cron/social-post` route
15. LinkedIn OAuth routes (fork)
16. "Post Now" manual posting
17. Test full pipeline: generate → review → schedule → post

### Phase 4: Campaigns + Events (3 days)
**Goal: Product campaigns flow through system**

18. Campaign creation UI + generator
19. Campaign urgency phase logic (awareness → interest → urgency → final push)
20. Event arc generator (8-post template from event data)
21. Priority-based scheduling (campaigns override evergreen slots)

### Phase 5: Newsletters + Polish (3 days)
**Goal: Full system operational**

22. Newsletter form + excerpt generator
23. Full calendar view (monthly grid)
24. Engagement data fetching (Meta insights)
25. Failed post retry logic
26. Mobile responsiveness pass

### Dependencies on Other Pillars
- **P3 (CRM/Odoo):** Content posting works standalone. Odoo sync comes later.
- **P4 (Nurture):** Newsletter email sending stubbed (log to DB) until Graph API wired.
- **P5 (Events):** Event arcs need minimal `events` table — can create in Phase 4 even if P5 not built.
- **P8 (Analytics):** Engagement fetching is nice-to-have, not blocking.

---

## 7. Key Files to Create/Modify

```
src/db/schema.ts                          — NEW: Drizzle schema (5 tables)
src/lib/db.ts                             — NEW: Neon connection
src/lib/social-publisher.ts               — FORK from ninja, adapt for DB
src/lib/linkedin-tokens.ts                — FORK from ninja, Blobs→PG
src/lib/auth.ts                           — FORK from ninja
src/lib/content-scheduler.ts              — NEW: scheduling engine
src/lib/ai-content-generator.ts           — NEW: Claude content generation
src/middleware.ts                          — FORK from ninja
src/app/(admin)/layout.tsx                — NEW: admin shell
src/app/(admin)/admin/content/page.tsx    — NEW: content calendar
src/app/(admin)/admin/content/review/page.tsx — NEW: review queue
src/app/(admin)/admin/content/campaigns/page.tsx — NEW: campaigns
src/app/(admin)/admin/content/newsletters/page.tsx — NEW: newsletters
src/app/api/content/generate-batch/route.ts — NEW
src/app/api/content/review/route.ts       — NEW
src/app/api/content/schedule/route.ts     — NEW
src/app/api/content/post-now/route.ts     — NEW
src/app/api/content/newsletters/route.ts  — NEW
src/app/api/cron/social-post/route.ts     — NEW
src/app/api/linkedin/route.ts             — FORK from ninja
src/app/api/linkedin/callback/route.ts    — FORK from ninja
src/app/api/auth/login/route.ts           — NEW
src/app/api/auth/logout/route.ts          — NEW
src/app/admin/login/page.tsx              — NEW
vercel.json                               — NEW: cron config
.env.example                              — NEW: env var documentation
drizzle.config.ts                         — NEW: Drizzle Kit config
```

---

## 8. Verification

After each phase:
- `pnpm build` — zero TypeScript errors
- `pnpm test` — unit tests for scheduler logic, content generator output shape
- Manual test: generate batch → review → approve → verify in posting_schedule
- After Phase 3: end-to-end test posting to a test Facebook page
- After Phase 4: create test campaign, verify urgency phases generate correctly
- After Phase 5: paste test newsletter, verify excerpt generation + calendar placement

---

## 9. Environment Variables

```env
# Database — Neon PostgreSQL
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/gec?sslmode=require

# Auth — Admin panel
SESSION_SECRET=generate-32-char-random-string
ADMIN_PASSWORD=your-admin-password

# AI — Claude
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Social — Meta Graph API
META_PAGE_ID=xxxxxxxxxxxx
META_PAGE_TOKEN=xxxxxxxxxxxx
META_IG_ACCOUNT_ID=xxxxxxxxxxxx

# Social — LinkedIn
LINKEDIN_ORG_ID=xxxxxxxxxxxx
LINKEDIN_CLIENT_ID=xxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxx

# App URLs
NEXT_PUBLIC_APP_URL=https://app.gecbusiness.com

# Vercel Cron Secret
CRON_SECRET=your-cron-secret
```

---

## 10. Open Decisions

| # | Decision | Options | Status |
|---|----------|---------|--------|
| 1 | First content batch timing | Generate before or after Meta API setup | TBD |
| 2 | Image generation | Lia provides manually vs AI-generated | TBD |
| 3 | LinkedIn API approval | Apply now vs start with manual_queue | **Manual queue first** |
| 4 | Content approval workflow | In-app only vs Slack/email notification | TBD |
| 5 | Multi-language strategy | Georgian primary + English secondary vs dual | **Georgian primary** |
