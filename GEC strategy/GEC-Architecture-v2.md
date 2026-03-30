# GEC Digital Sales Ecosystem — Architecture v2

**Version:** 2.0
**Date:** March 13, 2026
**Parent Document:** GEC-Sales-Ecosystem-Master-Plan.md

---

## Infrastructure Map

```
┌──────────────────────────────────────────────────────────────────┐
│                      HOSTINGER (DNS)                             │
│                                                                  │
│  gecbusiness.com          → one.com (now) / Odoo (future?)      │
│  app.gecbusiness.com      → Vercel (Next.js)                    │
│  odoo.gecbusiness.com     → VPS (Odoo instance)                 │
│  MX records               → Microsoft 365                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  GitHub  │   │  Vercel  │   │   VPS    │   │   M365   │
│          │   │          │   │          │   │          │
│ gec-     │──→│ Next.js  │   │ Odoo     │   │ Exchange │
│ ecosystem│   │ app      │   │ Workers  │   │ Graph API│
│ repo     │   │ (auto    │   │ Cron     │   │ Email    │
│          │   │  deploy) │   │          │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

## GEC's Existing Infrastructure

| Service | What GEC Has | Role |
|---------|-------------|------|
| Microsoft 365 | Employee accounts (@gecbusiness.com) | Email, Office apps, Exchange Online |
| one.com | Main website hosting | gecbusiness.com (current) |
| Hostinger | DNS management | All domain routing |
| Odoo | ERP/CRM platform | CRM, invoicing, potentially website |
| ClickUp | Project management | Task tracking, team collaboration |
| GitHub | GEC org account | Code repositories |
| Vercel | GEC account | Next.js deployment |
| VPS | Virtual private server | Odoo hosting, background workers |

---

## Architecture Layers

| Layer | Service | What Lives There |
|-------|---------|-----------------|
| **Main website** | one.com (now) / Odoo (future) | gecbusiness.com — branding, services, about, CTAs |
| **App** | Vercel | app.gecbusiness.com — assessments, event registration, admin panel, API |
| **CRM** | Odoo (VPS) | Contacts, companies, pipeline, invoicing, activities |
| **Intelligence DB** | Neon PostgreSQL + pgvector | Surveys, automation state, embeddings, tracking |
| **Email** | Microsoft 365 (Graph API) | All automated emails from real @gecbusiness.com addresses |
| **AI** | Claude API | Content generation, scoring, personalization |
| **Workers** | VPS | Heavy batch jobs, Odoo sync, AI recommendations |
| **DNS** | Hostinger | All routing, subdomains, email records |
| **Code** | GitHub | GEC org repositories, CI/CD |
| **Project mgmt** | ClickUp | Sprint tracking, tasks |

---

## The CRM Decision: Odoo + Custom Intelligence Layer

### Why Not Build a Full Custom CRM

Odoo already provides mature CRM, invoicing, pipeline management, reporting. Rebuilding that is wasted effort.

### Why Not Use Odoo Alone

Odoo can't do: AI-personalized nurture sequences, vector similarity search ("find leads like best client"), Claude-powered content generation, assessment scoring with semantic analysis, real-time engagement intelligence.

### The Hybrid Approach

Odoo is the **CRM system of record** (people, deals, money).
Next.js + Neon PG is the **intelligence and automation layer** (AI, assessments, nurture, content, vector search).

```
                         Odoo (VPS)
                    ┌─────────────────────┐
                    │  CRM (contacts,     │
                    │  companies, deals)  │
                    │  Pipeline stages    │
                    │  Invoicing          │
                    │  Activity log       │
                    │  Website (future?)  │
                    └────────┬────────────┘
                             │
                     Odoo XML-RPC API
                     (bidirectional sync)
                             │
              ┌──────────────┴──────────────┐
              │    Next.js App (Vercel)      │
              │                             │
              │  Assessments (public)       │
              │  AI scoring engine          │
              │  Nurture automation         │
              │  Content auto-posting       │
              │  Event registration         │
              │  Vector intelligence        │
              │  Admin dashboard            │
              └──────────────┬──────────────┘
                             │
                          Neon PG
                    ┌─────────────────────┐
                    │  survey_responses   │
                    │  social_posts       │
                    │  nurture_enrollments│
                    │  event_registrations│
                    │  contact_embeddings │
                    │  email_tracking     │
                    │  ai_recommendations │
                    └─────────────────────┘
```

### Data Ownership

| Odoo (source of truth for people) | Neon PG (source of truth for automation) |
|----------------------------------|-----------------------------------------|
| Contacts & companies | Survey responses & scores |
| Deal pipeline & stages | Social post queue & history |
| Activities & notes | Nurture sequence state |
| Invoices & proposals | Event registrations |
| Tags & segments | Vector embeddings (pgvector) |
| Contact owner (Lia/team) | Email open/click tracking |
| Revenue tracking | AI recommendations log |

### Sync Logic

- New assessment lead → create in Neon PG → sync to Odoo CRM contact
- Odoo pipeline change → webhook/poll → update lead temperature in Neon
- AI recommendation "alert Lia" → create Odoo activity/task
- Event attendee → Neon PG + sync to Odoo contact

---

## Where Things Run

| What | Where | Why |
|------|-------|-----|
| Next.js app (assessments, admin, API) | **Vercel** | Native Next.js hosting, auto-deploy from GitHub, edge functions, cron |
| Odoo (CRM, pipeline, invoicing) | **VPS** | Odoo needs persistent server, full control |
| Background workers (heavy AI batch, data sync) | **VPS** | Long-running processes, no serverless timeout limits |
| Cron: social posting, nurture | **Vercel Cron** or **VPS cron** | Vercel cron for simple triggers, VPS for heavy batch work |
| Database | **Neon** (serverless PG) | Scales to zero, pgvector, connects from both Vercel and VPS |
| Email sending | **M365 Graph API** | Real @gecbusiness.com addresses |
| Code | **GitHub** | GEC's own org account |
| Project management | **ClickUp** | Already in use |

---

## VPS Role

```
VPS
├── Odoo instance (odoo.gecbusiness.com)
│   ├── CRM module
│   ├── Invoicing module
│   ├── Website module (future?)
│   └── API (XML-RPC) ←→ Next.js sync
│
├── Worker processes
│   ├── odoo-sync.ts        — bidirectional Odoo ↔ Neon PG sync
│   ├── ai-batch.ts         — weekly AI recommendations (long-running)
│   ├── apollo-enrichment.ts — batch lead enrichment
│   └── embedding-generator.ts — vector embedding updates
│
└── Cron (systemd timers or node-cron)
    ├── Every hour:  nurture check + email send
    ├── Daily:       social auto-post + Odoo sync
    └── Weekly:      AI recommendations + Apollo refresh
```

---

## Automation Flows

### 1. Assessment → CRM (Odoo + Neon)

```
app.gecbusiness.com/assess/ai-readiness
    │
    ▼
User completes survey → email gate
    │
    ▼
/api/surveys/[id]/submit
    ├── Score answers (Claude AI)
    ├── Save response → Neon PG (survey_responses)
    ├── Generate PDF scorecard (pdf-lib)
    ├── Send scorecard (Graph API → lia@gecbusiness.com)
    ├── Enroll in nurture sequence → Neon PG
    │
    └── Sync to Odoo (XML-RPC)
        ├── Create/update contact
        ├── Set tags: "AI Readiness", score level
        ├── Create activity: "New lead — score 7/10"
        └── Add to pipeline stage based on score
```

### 2. Email Nurture (Graph API + Neon State)

```
VPS cron (hourly) or Vercel cron
    │
    ▼
Query Neon: nurture_enrollments WHERE next_send_at <= now()
    │
    ▼
For each enrollment:
    ├── Get contact from Neon (+ check Odoo for latest status)
    ├── Claude AI → personalize email content
    ├── Graph API → send from lia@gecbusiness.com
    ├── Log to Neon (email_tracking)
    ├── Update enrollment (next step, next_send_at)
    └── If replied/booked → update Odoo pipeline stage
```

### 3. Social Auto-Posting

```
Vercel cron (daily 9am) or VPS cron
    │
    ▼
Query Neon: social_posts WHERE scheduled_at <= now() AND status = 'scheduled'
    │
    ▼
Meta Graph API → FB + IG
LinkedIn → queue for manual posting (until API approved)
    │
    ▼
Update post status in Neon
```

### 4. AI Weekly Intelligence (VPS — Long Running)

```
VPS cron (weekly, Sunday night)
    │
    ▼
For each active contact (from Odoo + Neon data):
    ├── Gather: assessment scores, email engagement, event attendance,
    │           Odoo pipeline stage, Apollo company data, last interaction
    │
    ├── Claude API → recommendation:
    │   ├── "Send insight about [topic]" → auto-email via Graph API
    │   ├── "Invite to [event]" → auto-email
    │   ├── "Do nothing" → skip
    │   └── "Needs human touch" → create Odoo activity for Lia
    │
    └── Log to Neon (ai_recommendations)
```

### 5. Odoo ↔ Neon Bidirectional Sync

```
VPS worker (runs on schedule + event-driven)
    │
    ├── Neon → Odoo:
    │   ├── New assessment leads → create Odoo contacts
    │   ├── Score updates → update Odoo tags
    │   ├── Event registrations → update Odoo activities
    │   └── AI recommendations → create Odoo tasks
    │
    └── Odoo → Neon:
        ├── Pipeline stage changes → update lead_temperature
        ├── New contacts added manually → sync to Neon
        ├── Deal won/lost → update nurture status
        └── Contact edits → reflect in Neon
```

---

## Email Architecture (Microsoft Graph API)

### Why Graph API Instead of Resend/Mailgun

- Emails come FROM real `lia@gecbusiness.com` (or any GEC M365 user)
- Appears in sender's Sent folder
- SPF/DKIM/DMARC already configured for M365 — no extra DNS
- No per-email cost (included in M365 license)
- 10,000 emails/day limit — more than enough for GEC's scale

### Graph API Flow

```
Trigger (survey complete, event, nurture schedule)
    │
    ▼
AI Engine (Claude) generates personalized email content
    │
    ▼
Microsoft Graph API
POST /users/lia@gecbusiness.com/sendMail
    │
    ├── Email sent FROM real GEC address
    ├── Appears in Lia's Sent folder
    ├── M365 handles SPF/DKIM/DMARC
    └── No extra DNS records needed
    │
    ▼
Tracking:
    ├── Open: embedded pixel (1x1 img → /api/track/open?id=xxx)
    └── Click: UTM links via redirect → /api/track/click?id=xxx
    │
    ▼
Log open/click to Neon PG → updates contact engagement → feeds AI engine
```

### Azure Setup (One-Time)

1. Azure Portal → Entra ID → App Registrations → New
2. Name: "GEC Email Automation"
3. API permission: `Microsoft Graph` → Application → `Mail.Send`
4. Admin consent (grant)
5. Create client secret → `.env.local`
6. Copy Tenant ID + Client ID → `.env.local`

No user login needed. App sends on behalf of GEC addresses using service credentials.

---

## Tech Stack

| Component | Technology | Runs On |
|-----------|-----------|---------|
| App framework | Next.js 16 + React 19 + TypeScript | Vercel |
| CRM | **Odoo** | VPS |
| Intelligence DB | Neon PostgreSQL + pgvector + Drizzle ORM | Cloud (serverless) |
| Email | **Microsoft Graph API** | Via Vercel/VPS |
| AI | Claude API (@anthropic-ai/sdk) | Via Vercel/VPS |
| Social posting | Meta Graph API (direct fetch) | Via Vercel cron |
| PDF | pdf-lib + fontkit | Vercel (serverless) |
| Auth (admin) | iron-session | Vercel |
| Validation | Zod | Vercel |
| Booking | Cal.com | External |
| Enrichment | Apollo.io API | VPS (batch) |
| Analytics | GA4 + Meta Pixel + LinkedIn Insight | Client-side |
| Project mgmt | **ClickUp** | External |
| Code hosting | **GitHub** (GEC org) | Cloud |
| Deployment | **Vercel** (auto-deploy from GitHub) | Cloud |
| DNS | Hostinger | — |
| Main website | one.com (now) → **Odoo website** (future?) | one.com / VPS |

### Dependencies

```
# Production
next react react-dom
drizzle-orm @neondatabase/serverless pgvector
@microsoft/microsoft-graph-client @azure/identity    # Email (replaces Resend)
xmlrpc                                                # Odoo sync
@anthropic-ai/sdk                                     # AI
pdf-lib @pdf-lib/fontkit                              # PDF generation
iron-session                                          # Admin auth
zod                                                   # Validation
date-fns                                              # Dates
node-cron                                             # Cron (VPS workers)
lucide-react                                          # Icons

# Dev
drizzle-kit typescript eslint prettier vitest
@vitejs/plugin-react @testing-library/react @testing-library/jest-dom
vite-tsconfig-paths husky lint-staged @types/node-cron
```

**Changes from v1:**
- REMOVED: `resend`, `@netlify/plugin-nextjs`
- ADDED: `@microsoft/microsoft-graph-client`, `@azure/identity`, `xmlrpc`

---

## Project Structure

```
gec-ecosystem/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout + analytics scripts
│   │   ├── page.tsx                      # App landing / redirect to main site
│   │   │
│   │   ├── (public)/                     # Public-facing routes
│   │   │   ├── assess/
│   │   │   │   ├── ai-readiness/page.tsx
│   │   │   │   ├── export-readiness/page.tsx
│   │   │   │   ├── bpm-maturity/page.tsx
│   │   │   │   └── strategy/page.tsx
│   │   │   ├── events/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   └── unsubscribe/page.tsx
│   │   │
│   │   ├── (admin)/                      # Protected admin routes
│   │   │   ├── layout.tsx
│   │   │   ├── admin/page.tsx            # Dashboard
│   │   │   ├── admin/crm/               # CRM view (reads from Odoo + Neon)
│   │   │   ├── admin/content/           # Content calendar + scheduler
│   │   │   ├── admin/surveys/           # Survey responses + scores
│   │   │   ├── admin/nurture/           # Nurture pipeline
│   │   │   ├── admin/events/            # Event management
│   │   │   ├── admin/sme/              # SME Programme
│   │   │   ├── admin/partners/          # Partner event tracker
│   │   │   └── admin/analytics/         # Full analytics
│   │   │
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── surveys/[id]/submit/route.ts
│   │       ├── crm/contacts/route.ts
│   │       ├── crm/search/route.ts       # Vector similarity search
│   │       ├── email/send/route.ts
│   │       ├── social/post/route.ts
│   │       ├── events/[id]/register/route.ts
│   │       ├── enrichment/route.ts
│   │       ├── track/open/route.ts       # Email open pixel
│   │       ├── track/click/route.ts      # Email click redirect
│   │       ├── odoo/sync/route.ts        # Manual sync trigger
│   │       └── cron/
│   │           ├── social-post/route.ts  # Vercel cron: daily
│   │           ├── nurture/route.ts      # Vercel cron: hourly
│   │           └── ai-recommend/route.ts # Vercel cron: weekly
│   │
│   ├── lib/
│   │   ├── db.ts                         # Neon + Drizzle client
│   │   ├── auth.ts                       # iron-session config
│   │   ├── graph-mail.ts                 # Microsoft Graph API email sender
│   │   ├── email-tracker.ts              # Open/click pixel tracking
│   │   ├── odoo-client.ts               # Odoo XML-RPC client + sync logic
│   │   ├── social-publisher.ts           # Meta Graph API (FB + IG)
│   │   ├── pdf-generator.ts              # Scorecard PDFs
│   │   ├── nurture-engine.ts             # Multi-track nurture sequences
│   │   ├── ai-engine.ts                  # Claude API: content, personalization, scoring
│   │   ├── embeddings.ts                 # pgvector: embed + search contacts
│   │   ├── survey-scoring.ts             # Assessment scoring logic
│   │   ├── apollo.ts                     # Apollo.io lead enrichment
│   │   ├── analytics.ts                  # GA4 + Pixel + LinkedIn tracking
│   │   └── constants.ts                  # GEC brand, services, config
│   │
│   ├── db/
│   │   ├── schema.ts                     # Drizzle schema (automation tables)
│   │   ├── migrations/
│   │   └── seed.ts                       # Survey questions, initial data
│   │
│   ├── components/
│   │   ├── ui/                           # Button, Card, Table, Modal
│   │   ├── layout/                       # AdminShell, Sidebar, Header
│   │   ├── surveys/                      # SurveyForm, ScoreDisplay, ResultsGate
│   │   ├── crm/                          # ContactTable, ContactDetail
│   │   ├── analytics/                    # MetricsCard, Charts, FunnelView
│   │   └── email/                        # EmailPreview, SequenceTimeline
│   │
│   ├── emails/                           # Email templates (HTML string builders)
│   │   ├── scorecard.ts
│   │   ├── nurture.ts
│   │   ├── event-invite.ts
│   │   ├── event-followup.ts
│   │   └── ai-insight.ts
│   │
│   └── types/
│       └── index.ts
│
├── workers/                              # VPS worker scripts
│   ├── odoo-sync.ts                      # Bidirectional Odoo ↔ Neon sync
│   ├── ai-batch.ts                       # Weekly AI recommendations
│   ├── apollo-enrichment.ts              # Batch lead enrichment
│   └── embedding-generator.ts            # Vector embedding updates
│
├── drizzle/                              # Generated migrations
├── public/                               # Static assets, GEC logo
├── tests/
│   ├── unit/
│   ├── integration/
│   └── components/
│
├── vercel.json                           # Vercel config + cron definitions
├── drizzle.config.ts
├── vitest.config.ts
├── vitest.setup.ts
├── eslint.config.mjs
├── .prettierrc.json
├── next.config.ts
├── tsconfig.json
├── package.json
├── .env.local
├── .env.example
└── .gitignore
```

---

## Database Schema (Neon PostgreSQL + pgvector)

Neon holds **automation state only**. People/deals live in Odoo.

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Link to Odoo contacts (source of truth is Odoo)
contacts_sync (
  id, odoo_contact_id, email, name, company_name,
  lead_temperature, last_synced_at
)

-- P2: Surveys
surveys (id, slug, title, service_type, questions_json, scoring_rules_json, active)
survey_responses (id, survey_id, contact_sync_id, answers_json, scores_json,
                  total_score, maturity_level, completed_at)

-- P4: Nurture
nurture_sequences (id, name, trigger_type, steps_json, active)
nurture_enrollments (id, contact_sync_id, sequence_id, current_step, status,
                     next_send_at, started_at)

-- P1: Content
social_posts (id, content, platforms, media_urls, scheduled_at, posted_at,
              status, engagement_json)

-- P5: Events
events (id, title, slug, type, date, capacity, registration_count, status, metadata_json)
event_registrations (id, event_id, contact_sync_id, status, registered_at)

-- P6: SME Programme
sme_cohorts (id, name, year, start_date, end_date, status)
sme_enrollments (id, cohort_id, contact_sync_id, company_name, mentor_id, progress_json)

-- Email tracking (replaces Resend webhooks)
email_tracking (id, contact_sync_id, email_type, subject, sent_at,
                opened_at, clicked_at, click_url)

-- AI recommendations
ai_recommendations (id, contact_sync_id, recommendation_type, content,
                    action_taken, created_at)

-- Vector intelligence
contact_embeddings (id, contact_sync_id, embedding vector(1536), metadata_json, updated_at)
```

---

## DNS Setup at Hostinger

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| Existing | @ (A/CNAME) | one.com target | Main website |
| Existing | MX | M365 mail servers | Email delivery |
| Existing | TXT | SPF for M365 | Email authentication |
| **NEW** | CNAME `app` | `cname.vercel-dns.com` | Next.js app on Vercel |
| **NEW** | A `odoo` | VPS IP address | Odoo instance |

---

## Vercel Configuration

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/social-post",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/nurture",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/ai-recommend",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

Note: Vercel Hobby plan allows 2 cron jobs, Pro allows 40. Heavy batch work runs on VPS instead.

---

## Environment Variables

### .env.local (Vercel + local dev)

```env
# Database — Neon PostgreSQL
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/gec?sslmode=require

# Auth — Admin panel
SESSION_SECRET=generate-32-char-random-string

# Microsoft 365 — Graph API (email)
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
M365_SENDER_EMAIL=lia@gecbusiness.com

# AI — Claude
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Social — Meta Graph API
META_PAGE_ID=xxxxxxxxxxxx
META_PAGE_TOKEN=xxxxxxxxxxxx
META_IG_ACCOUNT_ID=xxxxxxxxxxxx

# Odoo — CRM sync
ODOO_URL=https://odoo.gecbusiness.com
ODOO_DB=gec
ODOO_USERNAME=admin
ODOO_API_KEY=xxxxxxxxxxxx

# Apollo.io — Lead enrichment
APOLLO_API_KEY=xxxxxxxxxxxx

# Cal.com — Booking
CALCOM_API_KEY=cal_live_xxxxxxxxxxxx

# Analytics
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=xxxxxxxxxxxx
NEXT_PUBLIC_LINKEDIN_PARTNER_ID=xxxxxxxxxxxx

# App URLs
NEXT_PUBLIC_APP_URL=https://app.gecbusiness.com
NEXT_PUBLIC_MAIN_SITE_URL=https://gecbusiness.com
```

---

## Website Future: one.com → Odoo

The architecture supports migrating gecbusiness.com to Odoo without changing the Next.js app.

```
CURRENT STATE:
  gecbusiness.com       → one.com (static website)
  app.gecbusiness.com   → Vercel (Next.js app)
  odoo.gecbusiness.com  → VPS (Odoo — CRM only)

FUTURE STATE (if website moves to Odoo):
  gecbusiness.com       → VPS (Odoo website module)
  app.gecbusiness.com   → Vercel (Next.js app — unchanged)
  (one.com dropped)
```

Odoo website provides: CMS, blog, forms, live chat, SEO tools, e-commerce, all natively connected to CRM. The Next.js app remains the **automation and intelligence layer** — assessments, AI scoring, nurture engine, vector search, content posting. These are things Odoo doesn't do well.

DNS change at Hostinger: update `@` record from one.com to VPS IP. Everything else stays the same.

---

## Open Decisions

| # | Decision | Options | Status |
|---|----------|---------|--------|
| 1 | CRM approach | Odoo as CRM + Next.js as intelligence layer | **Recommended** |
| 2 | Website migration to Odoo | Keep one.com for now, migrate later | Open |
| 3 | VPS provider/specs | Hetzner, DigitalOcean, existing? | **Need from Lia** |
| 4 | Odoo version/edition | Community (free) vs Enterprise | **Need from Lia** |
| 5 | Odoo modules to activate | CRM, Invoicing, Website(?), Email Marketing(?) | **Need from Lia** |
| 6 | Cron jobs: Vercel vs VPS | Light crons on Vercel, heavy batch on VPS | **Recommended** |
| 7 | ClickUp integration | Sync with dev workflow? | Open |
| 8 | Vercel plan | Hobby (free, 2 crons) vs Pro ($20/mo, 40 crons) | **Need from Lia** |
| 9 | App subdomain | `app.gecbusiness.com` vs other | **Need from Lia** |

---

*This document supersedes the original architecture assumptions in RESEARCH.md regarding Resend, Netlify, and custom CRM.*
