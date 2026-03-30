# GEC Digital Sales Ecosystem — Project Hub

## What Is This Project

GEC (gec.ge → gecbusiness.com) is a **Tech & AI Oriented Business Growth Services** consulting firm based in Georgia. This project is building GEC's entire digital sales ecosystem — an automated machine that attracts, captures, nurtures, qualifies, and converts B2B consulting leads.

**Owner:** Lia Kereselidze (likunakereselidze@gmail.com)
**Website:** gec.ge (redirects to gecbusiness.com)
**Related project:** saletool.ninja (Digital Export Manager course — separate repo at ~/Documents/ninja docs/ninja-admin)

## Core Philosophy

```
MEET them → GIVE them something → SOLVE their problem → They spread the word
```

- Never aggressive, never boring
- Every touchpoint delivers value
- AI-personalized communication, not generic drip sequences
- Decrease conversion time for complex, customized consulting services

## GEC Services

1. **Strategy Consulting** — strategic planning, change management
2. **Business Process Management (BPM)** — process optimization, digital workflows
3. **Export Consulting** — market readiness, EU compliance, trade facilitation
4. **Digital Transformation / AI** — AI adoption, digital tools, automation
5. **SME Development Programme** — year-long cohort mentorship (10+ mentors, ecosystem approach)

## Brand Tone

GEC = tech-first, AI-powered. We practice what we preach.

| Don't say | Say instead |
|-----------|------------|
| "We help businesses grow" | "We engineer growth systems" |
| "Our consultants will..." | "Our AI-augmented methodology..." |
| "Contact us for more info" | "Take the 3-min AI Readiness scan" |
| "Schedule a meeting" | "Book a free diagnostic session" |
| "Our team" | "Our network of 10+ specialized mentors and AI-powered tools" |

**Content pillars:** AI in Business, Export & Growth, Process Excellence, Strategic Thinking, SME Ecosystem

## The 8 Pillars

| # | Pillar | Description | Status |
|---|--------|-------------|--------|
| P1 | Content & Auto-Posting | Social media engine (LI/FB/IG) | Planning |
| P2 | Self-Assessment Surveys | 4 lead magnets with scoring + PDF | Planning |
| P3 | CRM + Intelligence DB | PostgreSQL + pgvector + Apollo.io | Planning |
| P4 | Nurture & Communication | AI-personalized email + multi-channel | Planning |
| P5 | Event Management | Webinar/workshop/bank event system | Planning |
| P6 | SME Development Programme | Cohort management, mentors, tracking | Planning |
| P7 | Partnership Development | Bank + association co-branding | Planning |
| P8 | Analytics & Dashboard | Full visibility across all pillars | Planning |

**P3 (CRM + Intelligence DB) is the central nervous system. Everything flows through it.**

```
P1 Content ──drives──→ P2 Assessments ──captures──→ P3 CRM
    ↑                       │                          │
    │                       ▼                          ▼
P5 Events ──attendees──→ P3 CRM ──triggers──→ P4 Nurture
    ↑                       │                     │
    │                       ▼                     ▼
P7 Partners ──co-host──→ P5 Events          P8 Analytics
    │                                             │
P6 SME Programme ──data──→ P3 CRM ←──reads──── P8
```

## Tech Stack

### Installed (~/Documents/GEC/gec-ecosystem/)

**App created 2026-03-02. All packages installed via pnpm. Build verified.**

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js + React | 16.1.6 + 19.2.3 | App Router, Server Components |
| Language | TypeScript | 5.9.3 | Type safety |
| Hosting | Netlify | — | Deployment via @netlify/plugin-nextjs |
| Database | Neon PostgreSQL + pgvector | serverless 1.0.2 + pgvector 0.2.1 | Contacts, companies, vector search |
| ORM | Drizzle ORM + Drizzle Kit | 0.45.1 + 0.31.9 | Database queries + migrations |
| Email | Resend | 6.9.3 | Transactional + nurture emails |
| PDF | pdf-lib + fontkit | 1.17.1 + 1.1.1 | Scorecards, invoices, reports |
| AI Engine | @anthropic-ai/sdk (Claude) | 0.78.0 | Content, personalization, scoring |
| Auth | iron-session | 8.0.4 | Admin panel encrypted cookies |
| Validation | Zod | 4.3.6 | Runtime schema validation |
| Dates | date-fns | 4.1.0 | Date formatting + manipulation |
| Cron | node-cron | 4.2.1 | Scheduled tasks (posting, nurture) |
| Icons | Lucide React | 0.576.0 | UI icons |
| CSS | Tailwind CSS | 4.2.1 | Styling |
| Social posting | Meta Graph API v25.0 | Direct fetch (no SDK) | Facebook + Instagram auto-posting |
| LinkedIn | LinkedIn Marketing API | TBD (when approved) | Auto-posting |
| CRM / Prospecting | Apollo.io (API) | Free tier | Lead enrichment |
| Booking | Cal.com | Free tier | Diagnostic calls |
| Analytics | GA4 + Meta Pixel + LinkedIn Insight | Free | Triple-tracking |
| Webinar platform | Zoom / Livestorm / Demio (TBD) | — | Online events with limited seats |

**Dev tools (installed):** ESLint 9 (flat config), Prettier 3.8, Vitest 4, Husky 9, lint-staged 16
**Package manager:** pnpm 10.30.3

### Monthly Cost Estimate

| Phase | Cost | What's paid |
|-------|------|-------------|
| Months 1-3 | ~$5-15/mo | Claude API only (pay-per-use) |
| Months 4-6 | ~$20-40/mo | Claude API + possible Neon upgrade |
| At scale | ~$50-100/mo | More emails, AI, data |

Everything else is free (Neon free tier, Resend 3k emails/mo free, Netlify free, Cal.com free for 1 user, GA4/Pixel/LinkedIn Insight free).

### Forking from saletool.ninja (~/Documents/ninja docs/ninja-admin/)

Production-ready code to fork directly:
- `lib/social-publisher.ts` — Meta Graph API auto-posting (FB + IG)
- `lib/resend.ts` — Email templates + Resend integration
- `lib/pdf-generator.ts` — PDF generation with design tokens
- `lib/nurture-emails.ts` — Nurture sequence engine
- `lib/auth.ts` — iron-session setup
- `middleware.ts` — Route protection for /admin
- `netlify/functions/social-scheduler.ts` — Daily cron for auto-posting
- `netlify/functions/email-scheduler.ts` — Hourly cron for nurture emails
- `components/Analytics.tsx` — FB Pixel + GA4 + LinkedIn Insight tracking

## Annual Activity Calendar

**Active periods:** March 1 – June 15, October 1 – December 15
**Breaks:** Jun 16 – Sep 30 (summer), Dec 16 – Feb 28 (winter)
**Capacity:** 1 event per week, 24 total per year

| Type | Count | Format |
|------|-------|--------|
| Webinars | 8/year | Online, limited seats |
| SME Programme Meetings | 8/year | In-person or hybrid |
| Bank/Partner Events | 8/year | Co-hosted (BOG, TBC, Liberty) |

Auto-posting and nurture sequences continue during breaks.

## Self-Assessment Surveys (Lead Magnets)

4 assessments, each mapped to a GEC service:

| Assessment | Service | Questions | Output |
|------------|---------|-----------|--------|
| AI Readiness | Digital transformation / AI | 10-12 | AI adoption roadmap preview |
| Export Readiness | Export consulting | 12-15 | Market-readiness score + checklist |
| BPM Maturity | Business Process Management | 10-12 | Process maturity level + gap analysis |
| Strategy Readiness | Strategy consulting | 12-15 | Strategy maturity scorecard |

**Flow:** Survey → gated results (email) → PDF scorecard → CRM entry → Apollo enrichment → nurture track based on score

## Content Auto-Posting Strategy

**Platforms:** LinkedIn (#1), Facebook (#2), Instagram (#3)
**Frequency:** Daily during active periods, 3x/week during breaks

**Content mix:**
- 35% Insight/Educational → drives to assessments
- 20% Event Promotion → drives to registration
- 15% Social Proof → builds trust
- 15% Assessment Teaser → drives to assessment link
- 10% Behind the Scenes → builds brand
- 5% Partner Co-branded → drives to events

**Event promotion arc (7 posts per event):**
-14d announcement, -10d deep-dive, -7d spotlight, -3d urgency, -1d reminder, event day live, +1d takeaway, +3d recording (gated)

**Monthly workflow:** AI generates 30 posts → Lia reviews (30 min) → system schedules → auto-posts daily

## Contact Intelligence — What We Track

**Identity:** name, email, phone, company, role, LinkedIn, industry, location, UTM source
**Engagement:** webinars attended, assessments (scores + answers), emails opened/clicked, events, downloads
**AI-Generated:** communication style, decision-making pattern, lead temperature, predicted needs, recommended next action
**External (Apollo):** job changes, company news, funding, competitor activity, public posts
**Vector Embeddings:** semantic search — "find leads similar to [best client]", "who should I invite to [topic]?"

## Nurture Flow Design

**Post-Assessment:** Day 0 PDF scorecard → Day 1 score explanation → Day 3 case study → Day 5 free resource → Day 8 social proof → Day 12 diagnostic call invite → Day 15 personalized insight → Day 20 event invite → Day 30 check-in → AI weekly cadence

**Post-Event:** Same day thanks + recording → Day 2 takeaway + micro-survey → Day 5 related assessment → Day 10 next event

**Re-engagement:** 30 days = industry insight (no CTA), 60 days = question email, 90 days = quarterly newsletter only

## AI Communication Engine

No two contacts receive the same communication. Weekly, for each contact:
1. Gather context (last interaction, assessment data, company news, engagement, upcoming events)
2. AI recommends: personalized insight / relevant resource / event invite / do nothing / alert Lia
3. Log action → feeds back into profile

## Partnership Strategy

**Credibility:** AmCham Georgia, AI Association, SME Associations
**Distribution/Financial:** Bank of Georgia (BOG), TBC Bank, Liberty Bank

Each partner event: Partner provides venue + audience, GEC provides content + speaker + assessment + follow-up, attendee data flows into intelligence system.

## SME Development Programme

- 1 year per cohort, 10+ experienced mentors
- Ecosystem approach: SMEs group together to access mentors they couldn't hire individually
- 8 workshops per year during active periods
- Success stories become case studies, mentors become webinar speakers, banks see results → co-fund next cohort
- **Details TBD — Lia will provide specifics on mentors, selection criteria, programme structure**

## Sprint Calendar 2026

| Sprint | Dates | Name | Pillars | Milestone |
|--------|-------|------|---------|-----------|
| 1 | Mar 1-14 | Foundation | P3 + P1 | GEC posting daily, database exists |
| 2 | Mar 15-28 | First Assessment | P2 + P3 + P5 | First lead magnet live, leads flow into DB |
| 3 | Mar 29-Apr 11 | Nurture Begins | P4 + P2 + P5 | Full loop: content → assessment → nurture → booking |
| 4 | Apr 12-25 | Scale Assessments | P2 + P3 + P7 | All 4 assessments live, partner events feeding pipeline |
| 5 | Apr 26-May 9 | Intelligence | P3 + P8 + P4 | AI recommending actions per contact |
| 6 | May 10-23 | SME Programme | P6 + P3 + P5 | SME Programme has a digital home |
| 7 | May 24-Jun 7 | Optimization | P8 + P4 + P1 | System runs semi-autonomously through summer |
| — | Jun 15-Sep 30 | Autopilot | ALL | Auto-posting, assessments, nurture running independently |
| 8 | Oct 1-14 | Autumn Launch | ALL | Full system operational, optimizing itself |

## Open Decisions

| # | Decision | Options | Status |
|---|----------|---------|--------|
| 1 | Database hosting | ~~Supabase vs Neon vs self-hosted~~ | **Neon** (serverless, pgvector built-in, free tier) |
| 2 | First assessment to build | ~~AI Readiness vs Export Readiness~~ | **AI Readiness** (strongest brand hook) |
| 3 | Apollo.io plan | Free tier first vs paid | **Free tier first** (60 credits/mo) |
| 4 | Webinar platform | Zoom vs Livestorm vs Demio | TBD |
| 5 | Booking tool | ~~Cal.com vs Calendly~~ | **Cal.com** (free for 1 user) |
| 6 | SME Programme details | Awaiting from Lia | TBD |
| 7 | Assessment hosting domain | gec.ge subdomain vs separate domain | TBD |
| 8 | LinkedIn API access | Apply for Marketing API | TBD |
| 9 | Contract/proposal tool | PandaDoc vs custom build | TBD |
| 10 | Migrate saletool.ninja from Netlify Blobs to PostgreSQL | Full migration vs hybrid | TBD |

## Project Files

```
~/Documents/GEC/
├── CLAUDE.md                                  ← THIS FILE (project hub)
├── RESEARCH.md                                ← Tech stack research (2026-03-02)
├── GEC-Sales-Ecosystem-Master-Plan.md         ← Full strategic plan (editable)
├── GEC-Sales-Ecosystem-Master-Plan.html       ← Visual version (light theme)
├── GEC-Content-Engine-and-Project-Plan.md     ← Content engine + sprint plan
├── gec strategy.docx                          ← Original brief from Lia
├── deploy/
│   └── index.html                             ← Deployed to Netlify
├── .netlify/                                  ← Netlify config
└── gec-ecosystem/                             ← THE APP (Next.js 16 + TypeScript)
    ├── src/
    │   └── app/                               ← App Router pages + API routes
    ├── package.json                           ← All dependencies installed
    ├── pnpm-lock.yaml                         ← pnpm lockfile
    ├── next.config.ts                         ← Next.js config
    ├── tsconfig.json                          ← TypeScript config
    ├── eslint.config.mjs                      ← ESLint flat config
    └── netlify.toml                           ← (to create before deploy)
```

**Master Plan URL:** https://gec-master-plan.netlify.app
**Netlify Site ID:** 29bd4e3c-1471-43ab-8360-527495d111a3
**App directory:** `~/Documents/GEC/gec-ecosystem/`

## Division of Work

| Claude Builds | Lia Does |
|---------------|----------|
| All code, integrations, automation | Review + approve content batches (30 min/week) |
| Assessment surveys + scoring logic | Write/refine assessment questions (domain expertise) |
| CRM schema + intelligence engine | Review AI communication recommendations |
| Email templates + nurture logic | Present at webinars + workshops |
| Auto-posting system | Manage partner relationships |
| Analytics dashboards | Make strategic decisions from data |
| PDF scorecards + proposals | Final review on proposals before sending |
| Event registration + promotion | Host the events |

## Commands

```bash
# --- GEC Ecosystem App ---
cd ~/Documents/GEC/gec-ecosystem

# Run dev server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Database commands (after Neon setup)
pnpm db:generate    # Generate migrations from schema
pnpm db:push        # Push schema to database
pnpm db:studio      # Open Drizzle Studio (visual DB browser)

# Lint + format
pnpm lint
pnpm format

# --- Master Plan (existing) ---
# Deploy master plan to Netlify
cd ~/Documents/GEC/deploy && NETLIFY_SITE_ID=29bd4e3c-1471-43ab-8360-527495d111a3 netlify deploy --dir=. --prod --no-build

# Open master plan locally
open ~/Documents/GEC/GEC-Sales-Ecosystem-Master-Plan.html

# Open project folder
open ~/Documents/GEC
```
