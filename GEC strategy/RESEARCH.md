# RESEARCH: GEC Digital Sales Ecosystem
Generated: 2026-03-02
Stack: Next.js 16 + TypeScript 6.0 + Node.js 24 LTS on Netlify

## EXISTING ASSETS
Forking patterns from `~/Documents/ninja docs/ninja-admin/` (production Next.js 16.1.4 app):
- `lib/social-publisher.ts` — Meta Graph API auto-posting (FB + IG)
- `lib/resend.ts` — Email templates + Resend integration
- `lib/pdf-generator.ts` — PDF generation with pdf-lib
- `lib/nurture-emails.ts` — Nurture sequence engine
- `lib/auth.ts` — iron-session auth
- `middleware.ts` — Route protection
- `netlify/functions/` — Cron jobs (social-scheduler, email-scheduler)
- `components/Analytics.tsx` — FB Pixel + GA4 + LinkedIn Insight tracking

## INSTALL
```bash
# Create project
pnpm create next-app@latest gec-ecosystem --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd gec-ecosystem

# Core dependencies
pnpm add drizzle-orm@0.45.1 @neondatabase/serverless@1.0.1 pgvector@0.2.1 resend@6.9.3 pdf-lib@1.17.1 @pdf-lib/fontkit@1.1.1 @anthropic-ai/sdk@0.78.0 iron-session@8.0.4 zod@3.24.4 date-fns@4.1.0 node-cron@4.3.4 lucide-react@0.563.0

# Dev dependencies
pnpm add -D drizzle-kit@0.30.6 @types/node-cron@3.0.11 vitest@4.0.18 @vitejs/plugin-react@4.5.2 @testing-library/react@16.3.0 @testing-library/jest-dom@6.6.3 vite-tsconfig-paths@5.1.4 @netlify/plugin-nextjs@5.12.0 prettier@3.5.3 prettier-plugin-tailwindcss@0.6.11 husky@9.1.7 lint-staged@15.5.1
```

## DEPENDENCIES
| package | version | purpose |
|---------|---------|---------|
| drizzle-orm | 0.45.1 | TypeScript-first PostgreSQL ORM |
| @neondatabase/serverless | 1.0.1 | Neon serverless PostgreSQL driver |
| pgvector | 0.2.1 | Vector embeddings for contacts |
| resend | 6.9.3 | Transactional + nurture emails |
| pdf-lib | 1.17.1 | Scorecard + invoice PDFs |
| @pdf-lib/fontkit | 1.1.1 | Custom fonts in PDFs |
| @anthropic-ai/sdk | 0.78.0 | Claude AI content + personalization |
| iron-session | 8.0.4 | Encrypted cookie sessions |
| zod | 3.24.4 | Runtime schema validation |
| date-fns | 4.1.0 | Date formatting + manipulation |
| node-cron | 4.3.4 | Scheduled job execution |
| lucide-react | 0.563.0 | Icon library |

## DEV DEPENDENCIES
| package | version | purpose |
|---------|---------|---------|
| drizzle-kit | 0.30.6 | Database migrations + studio |
| typescript | 6.0.0 | Type checking |
| eslint | 9.29.0 | Code linting (flat config) |
| prettier | 3.5.3 | Code formatting |
| prettier-plugin-tailwindcss | 0.6.11 | Tailwind class sorting |
| vitest | 4.0.18 | Unit + integration tests |
| @vitejs/plugin-react | 4.5.2 | React support for Vitest |
| @testing-library/react | 16.3.0 | Component testing |
| @testing-library/jest-dom | 6.6.3 | DOM assertion matchers |
| vite-tsconfig-paths | 5.1.4 | Path alias resolution |
| @netlify/plugin-nextjs | 5.12.0 | Netlify deployment adapter |
| husky | 9.1.7 | Git hooks |
| lint-staged | 15.5.1 | Pre-commit file filtering |
| @types/node-cron | 3.0.11 | Cron type definitions |

## CONFIG FILES TO CREATE

### next.config.ts
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.gecbusiness.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### drizzle.config.ts
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    prefix: 'timestamp',
  },
  strict: true,
  verbose: true,
});
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: ['node_modules/', '.next/', 'drizzle/'],
    },
  },
});
```

### vitest.setup.ts
```typescript
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
```

### eslint.config.mjs
```javascript
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { ignores: ['node_modules/', '.next/', 'drizzle/'] },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
```

### .prettierrc.json
```json
{
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### netlify.toml
```toml
[build]
  command = "pnpm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### .env.local
```env
# Database — Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/gec?sslmode=require

# Auth
SESSION_SECRET=generate-a-32-char-random-string-here

# Email — Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=hello@gecbusiness.com

# AI — Claude
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx

# Social — Meta Graph API
META_PAGE_ID=xxxxxxxxxxxx
META_PAGE_TOKEN=xxxxxxxxxxxx
META_IG_ACCOUNT_ID=xxxxxxxxxxxx

# Social — LinkedIn (when approved)
LINKEDIN_CLIENT_ID=xxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxx

# Analytics
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=xxxxxxxxxxxx
NEXT_PUBLIC_LINKEDIN_PARTNER_ID=xxxxxxxxxxxx

# Booking — Cal.com
CALCOM_API_KEY=cal_live_xxxxxxxxxxxx

# Apollo.io — Lead Enrichment
APOLLO_API_KEY=xxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=https://gecbusiness.com
```

### .env.example
Same as .env.local with placeholder values (commit this to repo).

## PROJECT STRUCTURE
```
gec-ecosystem/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout + analytics scripts
│   │   ├── page.tsx                      # Public landing (gecbusiness.com)
│   │   ├── middleware.ts                 # Auth guard for /admin routes
│   │   │
│   │   ├── (public)/                     # Public-facing routes
│   │   │   ├── assess/
│   │   │   │   ├── ai-readiness/page.tsx       # P2: AI Readiness survey
│   │   │   │   ├── export-readiness/page.tsx   # P2: Export Readiness survey
│   │   │   │   ├── bpm-maturity/page.tsx       # P2: BPM Maturity survey
│   │   │   │   └── strategy/page.tsx           # P2: Strategy Readiness survey
│   │   │   ├── events/
│   │   │   │   ├── page.tsx                    # P5: Event listing
│   │   │   │   └── [slug]/page.tsx             # P5: Event registration
│   │   │   └── unsubscribe/page.tsx            # Email unsubscribe
│   │   │
│   │   ├── (admin)/                      # Protected admin routes
│   │   │   ├── layout.tsx                # Admin shell (sidebar + nav)
│   │   │   ├── admin/page.tsx            # P8: Dashboard overview
│   │   │   ├── admin/crm/
│   │   │   │   ├── page.tsx              # P3: Contact list + search
│   │   │   │   ├── [id]/page.tsx         # P3: Contact detail + timeline
│   │   │   │   └── companies/page.tsx    # P3: Company list
│   │   │   ├── admin/content/
│   │   │   │   ├── page.tsx              # P1: Content calendar
│   │   │   │   └── scheduler/page.tsx    # P1: Post scheduler
│   │   │   ├── admin/surveys/
│   │   │   │   ├── page.tsx              # P2: Survey responses
│   │   │   │   └── [id]/page.tsx         # P2: Individual response + score
│   │   │   ├── admin/nurture/
│   │   │   │   ├── page.tsx              # P4: Nurture pipeline view
│   │   │   │   └── sequences/page.tsx    # P4: Sequence editor
│   │   │   ├── admin/events/
│   │   │   │   ├── page.tsx              # P5: Event management
│   │   │   │   └── [id]/page.tsx         # P5: Attendee list + stats
│   │   │   ├── admin/sme/
│   │   │   │   └── page.tsx              # P6: SME Programme dashboard
│   │   │   ├── admin/partners/
│   │   │   │   └── page.tsx              # P7: Partner event tracker
│   │   │   └── admin/analytics/
│   │   │       └── page.tsx              # P8: Full analytics dashboard
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   └── logout/route.ts
│   │       ├── surveys/
│   │       │   └── [id]/submit/route.ts  # Survey submission + scoring
│   │       ├── crm/
│   │       │   ├── contacts/route.ts     # CRUD contacts
│   │       │   └── search/route.ts       # Vector similarity search
│   │       ├── email/
│   │       │   ├── send/route.ts
│   │       │   └── webhook/route.ts      # Resend webhooks
│   │       ├── social/
│   │       │   └── post/route.ts         # Manual post trigger
│   │       ├── events/
│   │       │   └── [id]/register/route.ts
│   │       ├── enrichment/
│   │       │   └── route.ts              # Apollo.io enrichment
│   │       └── cron/
│   │           ├── social-post/route.ts  # Daily auto-posting
│   │           ├── nurture/route.ts      # Hourly nurture check
│   │           └── ai-recommend/route.ts # Weekly AI recommendations
│   │
│   ├── lib/
│   │   ├── db.ts                         # Neon + Drizzle client
│   │   ├── auth.ts                       # iron-session config
│   │   ├── resend.ts                     # Email service (fork from ninja)
│   │   ├── social-publisher.ts           # Meta Graph API (fork from ninja)
│   │   ├── pdf-generator.ts              # Scorecard PDFs (fork from ninja)
│   │   ├── nurture-engine.ts             # Multi-track nurture (extend ninja)
│   │   ├── ai-engine.ts                  # Claude API: content, personalization, scoring
│   │   ├── embeddings.ts                 # pgvector: embed + search contacts
│   │   ├── survey-scoring.ts             # Assessment scoring logic
│   │   ├── apollo.ts                     # Apollo.io lead enrichment
│   │   ├── analytics.ts                  # GA4 + Pixel + LinkedIn tracking
│   │   └── constants.ts                  # GEC brand, services, config
│   │
│   ├── db/
│   │   ├── schema.ts                     # Drizzle schema (all tables)
│   │   ├── migrations/                   # Generated by drizzle-kit
│   │   └── seed.ts                       # Survey questions, initial data
│   │
│   ├── components/
│   │   ├── ui/                           # Reusable primitives (Button, Card, Table, Modal)
│   │   ├── layout/                       # AdminShell, Sidebar, Header
│   │   ├── surveys/                      # SurveyForm, ScoreDisplay, ResultsGate
│   │   ├── crm/                          # ContactTable, ContactDetail, CompanyCard
│   │   ├── analytics/                    # MetricsCard, Charts, FunnelView
│   │   └── email/                        # EmailPreview, SequenceTimeline
│   │
│   ├── emails/                           # Email templates (HTML string builders)
│   │   ├── scorecard.ts                  # Assessment PDF scorecard email
│   │   ├── nurture.ts                    # Nurture sequence emails
│   │   ├── event-invite.ts              # Event invitation
│   │   ├── event-followup.ts            # Post-event follow-up
│   │   └── ai-insight.ts               # AI-personalized weekly insight
│   │
│   └── types/
│       └── index.ts                      # Shared TypeScript types
│
├── netlify/
│   └── functions/
│       ├── social-scheduler.ts           # Daily cron: auto-post
│       └── email-scheduler.ts            # Hourly cron: nurture emails
│
├── drizzle/                              # Generated migrations
├── public/                               # Static assets, GEC logo
├── tests/
│   ├── unit/                             # lib/ tests
│   ├── integration/                      # API route tests
│   └── components/                       # Component tests
│
├── drizzle.config.ts
├── vitest.config.ts
├── vitest.setup.ts
├── eslint.config.mjs
├── .prettierrc.json
├── netlify.toml
├── next.config.ts
├── tsconfig.json
├── package.json
├── .env.local
├── .env.example
└── .gitignore
```

## DATABASE SCHEMA (Neon PostgreSQL + pgvector)
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- P3: CRM Core
contacts (id, email, name, phone, company_id, role, linkedin_url, industry, location, utm_source, utm_medium, utm_campaign, lead_temperature, communication_style, created_at, updated_at)
companies (id, name, industry, size, website, apollo_id, funding_stage, location, created_at)
interactions (id, contact_id, type, channel, metadata, created_at)

-- P2: Surveys
surveys (id, slug, title, service_type, questions_json, scoring_rules_json, active)
survey_responses (id, survey_id, contact_id, answers_json, scores_json, total_score, maturity_level, completed_at)

-- P4: Nurture
nurture_sequences (id, name, trigger_type, steps_json, active)
nurture_enrollments (id, contact_id, sequence_id, current_step, status, next_send_at, started_at)

-- P1: Content
social_posts (id, content, platforms, media_urls, scheduled_at, posted_at, status, engagement_json)

-- P5: Events
events (id, title, slug, type, date, capacity, registration_count, status, metadata_json)
event_registrations (id, event_id, contact_id, status, registered_at)

-- P6: SME Programme
sme_cohorts (id, name, year, start_date, end_date, status)
sme_enrollments (id, cohort_id, contact_id, company_id, mentor_id, progress_json)

-- P3: Vector Intelligence
contact_embeddings (id, contact_id, embedding vector(1536), metadata_json, updated_at)
```

## SETUP STEPS
1. `pnpm create next-app@latest gec-ecosystem --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. `cd gec-ecosystem`
3. Install dependencies (see INSTALL section)
4. Create Neon project at neon.tech, enable pgvector extension
5. Copy `.env.example` to `.env.local`, fill in credentials
6. Create `src/db/schema.ts` with Drizzle schema
7. `pnpm db:generate` then `pnpm db:push` to create tables
8. Fork `lib/auth.ts`, `lib/social-publisher.ts`, `lib/resend.ts`, `lib/pdf-generator.ts` from ninja-admin
9. Adapt `middleware.ts` from ninja-admin for `/admin` route protection
10. Build P3 (CRM) first — it's the central nervous system
11. Build P2 (first assessment: AI Readiness) — first lead magnet
12. Wire P4 (nurture engine) to P2 + P3
13. Deploy to Netlify with `@netlify/plugin-nextjs`

## KEY PATTERNS

**Server Components by default** — Use Client Components (`"use client"`) only for forms, charts, and interactive UI. Data fetching and DB queries happen in Server Components.

**Server Actions for mutations** — Use `"use server"` functions for form submissions, CRM updates, survey scoring. Use API Routes only for webhooks and external integrations.

**Route groups for auth boundaries** — `(public)` routes are open, `(admin)` routes are protected by middleware.

**Colocated feature code** — Each admin section has its own `_lib/` and `_components/` folders for route-specific logic.

**Drizzle schema as single source of truth** — All types inferred from `db/schema.ts`. No duplicate type definitions.

**Vector search pattern** — Embed contact data with Claude API, store in pgvector, query with cosine similarity for "find similar leads" and "who should attend this event".

**Netlify Scheduled Functions for cron** — `social-scheduler.ts` runs daily for auto-posting, `email-scheduler.ts` runs hourly for nurture sequences. Same pattern as ninja-admin.

**Progressive enhancement from ninja-admin** — Fork working code first (auth, email, social, PDF), then extend with new capabilities (CRM, surveys, AI engine, vector search).

## PACKAGE.JSON SCRIPTS
```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "format": "prettier --write .",
  "type-check": "tsc --noEmit",
  "test": "vitest",
  "test:coverage": "vitest --coverage",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

## OPEN DECISIONS RESOLVED
| Decision | Recommendation |
|----------|---------------|
| Database hosting | **Neon** — serverless PostgreSQL, pgvector built-in, free tier generous |
| First assessment | **AI Readiness** — strongest hook for GEC's brand positioning |
| Package manager | **pnpm** — disk efficient, fastest installs, lockfile reliability |
| Formatter | **Prettier** — consistent with ninja-admin, Tailwind plugin support |

## SOURCES
**Stack validation:**
- https://www.raftlabs.com/blog/how-to-choose-the-tech-stack-for-your-saas-app/
- https://wasp.sh/resources/2026/02/24/best-frameworks-web-dev-2026
- https://supastarter.dev/blog/best-saas-stack
- https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/

**Dependencies:**
- https://www.npmjs.com/package/drizzle-orm
- https://www.npmjs.com/package/@neondatabase/serverless
- https://www.npmjs.com/package/pgvector
- https://www.npmjs.com/package/resend
- https://www.npmjs.com/package/@anthropic-ai/sdk
- https://www.npmjs.com/package/zod
- https://orm.drizzle.team/docs/latest-releases

**Dev tooling:**
- https://eslint.org/blog/2025/06/eslint-v9.29.0-released/
- https://vitest.dev/blog/vitest-4
- https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/
- https://github.com/pnpm/pnpm/releases

**Architecture:**
- https://nextjs.org/docs/app/getting-started/project-structure
- https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon
- https://www.instaclustr.com/education/vector-database/pgvector-key-features-tutorial-and-pros-and-cons-2026-guide/
- https://resend.com/nextjs

**Config:**
- https://nextjs.org/docs/app/api-reference/config/next-config-js
- https://nextjs.org/docs/app/api-reference/config/eslint
- https://orm.drizzle.team/docs/drizzle-config-file
- https://nextjs.org/docs/pages/guides/testing/vitest
