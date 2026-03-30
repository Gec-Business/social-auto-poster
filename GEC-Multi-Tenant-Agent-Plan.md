# GEC Multi-Tenant Platform + AI Agent Pipeline — Plan

**Version:** 1.0
**Date:** March 19, 2026
**Parent Documents:** GEC-Architecture-v2.md, GEC-Content-Auto-Posting-Plan.md
**Status:** Planning

---

## Context

GEC's auto-posting system (currently planned as single-tenant for GEC) evolves into a **multi-tenant consulting delivery platform**. Each GEC client (e.g., 3 Shaurma) becomes a tenant with:
- Automated consulting deliverables (strategy, audit, content plans)
- Auto-posting to their social media accounts
- Ongoing analytics and optimization

The 3 Shaurma project (`Projects/GEC/3 shawarma/`) is the proof-of-concept — its deliverables (4 analysis PDFs + 4 content strategy docs) were created manually. This plan automates that process for all future tenants.

---

## Part A: Multi-Tenant Schema

### New Table: `tenants`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| name | text | e.g. "3 Shaurma" |
| slug | text | unique, e.g. "3-shaurma" |
| industry | text | e.g. "fast_food", "consulting", "retail" |
| description | text | brief business description |
| location | text | e.g. "Tbilisi, Georgia" |
| website | text | nullable |
| social_links | jsonb | { facebook, instagram, tiktok, linkedin } |
| meta_credentials | jsonb | { page_id, page_token, ig_account_id } — encrypted |
| linkedin_credentials | jsonb | { client_id, client_secret, org_id } — encrypted |
| brand_config | jsonb | { tone, languages, colors, hashtags, posting_schedule } |
| subscription_tier | text | free \| starter \| pro \| enterprise |
| status | text | onboarding \| active \| paused \| churned |
| onboarded_at | timestamptz | |
| created_at | timestamptz | default now() |

### Row-Level Security (RLS)

All existing tables gain a `tenant_id uuid REFERENCES tenants(id)` column:

- `content_sources` → + tenant_id
- `content_items` → + tenant_id
- `posting_schedule` → + tenant_id
- `newsletters` → + tenant_id
- `linkedin_tokens` → + tenant_id

RLS policies ensure each API request only sees its own tenant's data:

```sql
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON content_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

The app sets `current_tenant_id` from the session/JWT on every request.

### New Table: `consulting_engagements`

Tracks the AI-generated consulting pipeline per tenant.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | FK → tenants | |
| status | text | collecting_data \| research_complete \| competitors_mapped \| brand_audited \| strategy_generated \| human_review \| delivered |
| raw_data | jsonb | Research Agent output |
| competitor_map | jsonb | Competitor Agent output |
| brand_audit | jsonb | Brand Agent output |
| strategy_docs | jsonb | Strategy Agent output |
| human_review_notes | text | Consultant's notes/edits |
| reviewed_by | text | |
| reviewed_at | timestamptz | |
| delivered_at | timestamptz | |
| created_at | timestamptz | default now() |

### New Table: `agent_runs`

Audit trail for agent executions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| engagement_id | FK → consulting_engagements | |
| agent_type | text | research \| competitor \| brand \| strategy \| orchestrator |
| status | text | running \| completed \| failed \| retrying |
| input_summary | text | what the agent received |
| output_summary | text | what the agent produced |
| tokens_used | int | Claude API token consumption |
| duration_ms | int | execution time |
| error_message | text | nullable |
| started_at | timestamptz | |
| completed_at | timestamptz | |

---

## Part B: AI Agent Pipeline for Automated Consulting

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  ORCHESTRATOR AGENT                       │
│  Input: tenant_id + business info                        │
│  Output: complete consulting deliverable set              │
│  Role: sequences agents, manages retries, flags review   │
└──────────┬──────────┬──────────┬──────────┬─────────────┘
           │          │          │          │
     ┌─────▼────┐ ┌──▼───┐ ┌───▼──┐ ┌────▼─────┐
     │ RESEARCH │ │COMPET│ │BRAND │ │ STRATEGY │
     │  AGENT   │ │AGENT │ │AGENT │ │  AGENT   │
     └──────────┘ └──────┘ └──────┘ └──────────┘
```

### Agent 1: Research Agent

**Purpose:** Collect raw data about the tenant's business and market.

**Inputs:**
- Tenant record (name, location, industry, social_links)
- Google Maps place ID or search query
- Delivery platform info (Wolt/Bolt/Glovo)

**Data Sources:**
- Google Maps Places API → ratings, review count, address, hours, photos
- Google Maps Reviews → sentiment analysis on recent reviews
- Wolt/Bolt API or scraping → menu items, prices, delivery info
- Social media APIs → follower counts, posting frequency, engagement rates
- Public business registries → registration ID, revenue (if available)

**Outputs (→ `raw_data` jsonb):**
```json
{
  "business_profile": {
    "name": "3 Shaurma",
    "legal_form": "შპს Food Concept",
    "registration_id": "405456787",
    "phone": "+995 511 130 313",
    "branches": [
      { "name": "Saburtalo", "address": "...", "google_place_id": "..." },
      { "name": "Dighomi", "address": "..." },
      { "name": "Isani Metro", "address": "..." },
      { "name": "Gldani", "address": "..." }
    ],
    "operating_hours": "10:30 – 01:30",
    "delivery_platforms": ["wolt"]
  },
  "menu": {
    "items": [
      { "name": "პატარა შაურმა", "price": 13.8, "status": "popular" },
      { "name": "სტანდარტული შაურმა", "price": 16.5, "status": "popular" }
    ],
    "price_range": "mid-range",
    "price_category": "₾9–25"
  },
  "ratings": {
    "google_maps": { "score": 3.9, "reviews": 237 },
    "yandex": { "score": 4.4, "reviews": 8 },
    "restaurant_guru": { "score": 3.9, "reviews": 245 },
    "bolt_food": { "score": 4.4 }
  },
  "review_sentiment": {
    "positive": ["taste", "service_speed", "atmosphere", "price"],
    "negative": ["order_accuracy", "inconsistency", "google_rating_low"]
  },
  "social_media": {
    "facebook": { "url": "...", "followers": null, "posts_per_week": null },
    "tiktok": { "url": null, "status": "not_present" },
    "instagram": { "url": null, "status": "not_present" }
  },
  "market_context": {
    "city": "Tbilisi",
    "sector": "fast_food_shawarma",
    "total_competitors": 73,
    "sector_revenue_estimate": "₾200M+",
    "delivery_penetration": "35-42%"
  }
}
```

### Agent 2: Competitor Agent

**Purpose:** Map the competitive landscape.

**Inputs:**
- Research Agent's `raw_data`
- Industry + location parameters
- Number of competitors to analyze (default: 10-12)

**Process:**
1. Identify competitors via Google Maps search (e.g., "shawarma Tbilisi")
2. For each competitor: collect name, type, branches, ratings, pricing, positioning
3. Classify by tier (premium/mid/budget), type (chain/single/franchise)
4. Map geographic overlap with tenant's branches
5. Identify differentiation opportunities

**Outputs (→ `competitor_map` jsonb):**
```json
{
  "competitors": [
    {
      "name": "Mac-Shawarma",
      "type": "premium_chain",
      "branches": 10,
      "google_rating": 4.3,
      "price_range": "premium",
      "positioning": "Revenue leader, premium brand",
      "revenue_estimate": "₾14.8M",
      "strengths": ["brand recognition", "branch count", "consistency"],
      "weaknesses": ["higher prices", "less authentic feel"],
      "geographic_overlap": ["Saburtalo"]
    }
  ],
  "market_segments": [
    { "name": "Budget", "price": "₾8-13", "share": "~40%", "players": ["Flash Shaurma", "Black Shaurma"] },
    { "name": "Mid-range", "price": "₾13-20", "share": "~45%", "players": ["3 Shaurma", "Shaurma Club", "Marge"] },
    { "name": "Premium", "price": "₾20-30", "share": "~15%", "players": ["Mac-Shawarma", "Tiflis Shaurma"] }
  ],
  "tenant_position": {
    "segment": "mid-range",
    "rank_in_segment": 3,
    "geographic_advantage": "residential districts (Gldani, Dighomi, Vazisubani)",
    "differentiation_gaps": ["no TikTok", "weak Google rating", "no Bolt/Glovo", "no loyalty program"]
  },
  "competitive_threats": [
    { "threat": "Mac-Shawarma expansion to Gldani/Dighomi", "probability": "moderate", "impact": "high" }
  ]
}
```

### Agent 3: Brand Agent

**Purpose:** Run brand audit frameworks and produce diagnostic scores.

**Inputs:**
- Research Agent's `raw_data`
- Competitor Agent's `competitor_map`

**Frameworks Applied:**
1. **Keller CBBE Pyramid** — Identity, Meaning, Response, Resonance (scored /50 each)
2. **Kapferer Brand Identity Prism** — Physique, Personality, Culture, Relationship, Reflection, Self-image
3. **Brand Awareness Funnel** — Unaided → Aided → Consideration → Trial → Loyalty
4. **Perceptual Map** — Price vs Quality positioning relative to competitors
5. **Online Reputation Scorecard** — Aggregate across all platforms
6. **Share of Voice** — Social media presence vs competitors
7. **Customer Journey Map** — Discovery → Consideration → Purchase → Post-purchase → Advocacy
8. **Social Media Audit** — Platform presence, content quality, engagement
9. **NPS Proxy** — Derived from review sentiment analysis
10. **Value Proposition Canvas** — Jobs, Pains, Gains vs Products, Pain Relievers, Gain Creators

**Outputs (→ `brand_audit` jsonb):**
```json
{
  "cbbe_scores": {
    "identity": { "score": 18, "max": 50, "status": "critical" },
    "meaning": { "score": 33, "max": 60, "status": "moderate" },
    "response": { "score": 28, "max": 50, "status": "moderate" },
    "resonance": { "score": 8, "max": 30, "status": "critical" },
    "total": { "score": 87, "max": 190, "percentage": 46 }
  },
  "kapferer_prism": {
    "physique": "3 ზომა (S/M/L/XL), lavashi, lori, fast service",
    "personality": "მეგობარი, ეგნიდან, სწრაფი, გულისხმიერი",
    "culture": "ქართული, residential, community",
    "relationship": "ჯერ ხუჭი, ტრანსაქც., არ არის emotional",
    "reflection": "18-40, მუშა კლასი, residential districts",
    "self_image": "ოჯახი, მეგობრები"
  },
  "swot": {
    "strengths": ["4 branches in strategic locations", "Wolt delivery", "mid-range pricing", "Georgian-style menu"],
    "weaknesses": ["Google 3.9", "no Bolt/Glovo", "no TikTok", "weak brand identity", "no loyalty program"],
    "opportunities": ["TikTok virality", "residential expansion", "B2B catering", "delivery platform expansion"],
    "threats": ["competitor expansion", "food cost inflation", "delivery platform dependency", "staff turnover"]
  },
  "key_findings": [
    "Brand identity is critically weak (36%) — '3' as a number has no brand narrative",
    "Resonance almost non-existent (27%) — no loyalty program, no community",
    "Online reputation is the #1 tactical priority — 3.9 Google needs to reach 4.2+",
    "TikTok absence is a critical gap — competitors are gaining free visibility"
  ],
  "priority_actions": [
    { "action": "Fix Google rating → 4.2+", "timeframe": "0-3 months", "impact": "high" },
    { "action": "Launch TikTok presence", "timeframe": "0-1 month", "impact": "high" },
    { "action": "Build loyalty system", "timeframe": "1-3 months", "impact": "medium" },
    { "action": "Expand to Bolt/Glovo", "timeframe": "1-2 months", "impact": "medium" },
    { "action": "Develop brand narrative for '3'", "timeframe": "3-6 months", "impact": "high" }
  ]
}
```

### Agent 4: Strategy Agent

**Purpose:** Generate actionable strategy documents from all previous analyses.

**Inputs:**
- All three agents' outputs
- Tenant's brand_config (tone, languages)
- Industry-specific templates

**Outputs (→ `strategy_docs` jsonb):**

Generates 4 documents (matching the manual 3 Shaurma deliverable structure):

1. **Strategic Framework** — Vision, mission alignment, strategic pillars, KPIs
2. **Channel Strategy** — Platform selection, frequency, content types per channel, budget allocation
3. **Messaging & Content Strategy** — Brand voice, content pillars, messaging matrix by audience segment
4. **Action Plan** — 90-day roadmap with specific tasks, owners, deadlines, budgets

Each document generated in both Georgian and English.

**Additionally generates:**
5. **Disruptive Innovation Recommendations** — 3-5 low-cost, high-ROI innovations specific to this business
6. **Content Calendar Seed** — First 30 days of social media posts (feeds directly into the auto-posting system)

### How Agents Share Information

**Sequential pipeline with shared database state:**

```
Step 1: Orchestrator creates consulting_engagement (status: collecting_data)
Step 2: Research Agent runs → writes raw_data → status: research_complete
Step 3: Competitor Agent runs (reads raw_data) → writes competitor_map → status: competitors_mapped
Step 4: Brand Agent runs (reads raw_data + competitor_map) → writes brand_audit → status: brand_audited
Step 5: Strategy Agent runs (reads all) → writes strategy_docs → status: strategy_generated
Step 6: Orchestrator flags for human review → status: human_review
Step 7: GEC consultant reviews/edits → status: delivered
Step 8: Strategy docs feed into content_items → auto-posting begins
```

**Parallel where possible:**
- Research Agent must go first (data collection)
- Competitor Agent and parts of Brand Agent can run in parallel (both read raw_data)
- Strategy Agent must wait for all others

**Agent communication is indirect** — via the `consulting_engagements` row. Each agent reads from previous agents' jsonb columns and writes to its own. The orchestrator polls status and triggers the next step.

---

## Part C: 3 Shaurma as First Tenant

### Tenant Record

```json
{
  "name": "3 შაურმა / 3 Shaurma",
  "slug": "3-shaurma",
  "industry": "fast_food",
  "description": "Mid-range shawarma chain, 4 branches in Tbilisi residential districts",
  "location": "Tbilisi, Georgia",
  "social_links": {
    "facebook": "3 შაურმა - 3 Shaurma",
    "tiktok": null,
    "instagram": null
  },
  "brand_config": {
    "tone": "friendly, neighborhood, Georgian-authentic",
    "primary_language": "ka",
    "secondary_language": "en",
    "posting_schedule": {
      "active_days": ["mon", "tue", "wed", "thu", "fri", "sat"],
      "post_time_utc": "06:00",
      "platforms": ["facebook", "tiktok"]
    }
  },
  "subscription_tier": "pro",
  "status": "active"
}
```

### Pre-Existing Data

The manual consulting deliverables in `Projects/GEC/3 shawarma/` serve as **ground truth** to validate the agent pipeline. When the agents are built, we can:

1. Run the pipeline for 3 Shaurma
2. Compare agent output vs the manual PDFs
3. Calibrate agent prompts until output quality matches
4. Use this as the benchmark for all future tenants

### Content Strategy → Auto-Posting

The 4 DOCX content strategy documents + GUIDE.md already define 3 Shaurma's posting plan. Once the multi-tenant auto-poster is built:

1. Import the content strategy into `content_sources` (type: "campaign")
2. Generate initial 30-day content batch via AI Content Generator (using the strategy docs as context)
3. Review + approve
4. Auto-post daily via Meta Graph API

---

## Part D: Automation Levels Per Tenant Tier

| Capability | Free | Starter | Pro | Enterprise |
|-----------|------|---------|-----|------------|
| Auto-posting | 3x/week, 1 platform | Daily, 2 platforms | Daily, all platforms | Unlimited |
| AI content generation | — | 10 posts/month | 30 posts/month | Unlimited |
| Consulting package | — | — | Auto-generated, human-reviewed | Auto-generated + dedicated consultant |
| Competitor monitoring | — | — | Quarterly refresh | Monthly refresh |
| Brand audit | — | — | Annual | Quarterly |
| Analytics dashboard | Basic | Standard | Full | Custom |

---

## Part E: Implementation Phases

### Phase 0: Foundation (Current)
- [x] Architecture planning docs
- [x] App scaffold (gec-ecosystem)
- [x] Manual proof-of-concept (3 Shaurma deliverables)
- [ ] Multi-tenant schema design (this document)

### Phase 1: Multi-Tenant Core (Week 1-2)
- [ ] Add `tenants` table + RLS policies
- [ ] Add `tenant_id` to all existing schema tables
- [ ] Tenant CRUD in admin panel
- [ ] Session/JWT carries tenant context
- [ ] Per-tenant Meta/LinkedIn credential storage

### Phase 2: Auto-Posting Multi-Tenant (Week 3-4)
- [ ] Fork social-publisher.ts with tenant awareness
- [ ] Per-tenant posting schedules
- [ ] Per-tenant content calendars
- [ ] Cron job iterates all active tenants
- [ ] Add 3 Shaurma as first tenant, begin auto-posting

### Phase 3: Research Agent (Week 5-6)
- [ ] Google Maps Places API integration
- [ ] Review sentiment analyzer (Claude)
- [ ] Social media presence scanner
- [ ] Delivery platform data collector
- [ ] Agent runner framework (agent_runs table)

### Phase 4: Competitor + Brand Agents (Week 7-8)
- [ ] Competitor discovery and profiling
- [ ] CBBE scoring engine
- [ ] SWOT generator
- [ ] Brand audit report generator
- [ ] Validate against 3 Shaurma manual deliverables

### Phase 5: Strategy Agent + Orchestrator (Week 9-10)
- [ ] Strategy document generator (4 docs)
- [ ] Disruptive innovation recommender
- [ ] Content calendar seed generator
- [ ] Orchestrator pipeline (sequential agent execution)
- [ ] Human review workflow in admin

### Phase 6: End-to-End Pipeline (Week 11-12)
- [ ] New tenant onboarding flow
- [ ] Full pipeline: onboard → research → analyze → strategy → auto-post
- [ ] PDF export of consulting deliverables
- [ ] Tenant dashboard (client-facing)
- [ ] Second tenant onboarding (validation)

---

## Open Decisions

| # | Decision | Options | Status |
|---|----------|---------|--------|
| 1 | Agent implementation | Claude API tool_use vs Claude Agent SDK vs custom orchestration | TBD |
| 2 | Data collection for Research Agent | Google Maps API (paid) vs scraping vs manual input | TBD |
| 3 | Delivery platform data | Wolt/Bolt API access vs scraping vs manual input | TBD |
| 4 | Document output format | PDF (pdf-lib) vs HTML vs both | TBD |
| 5 | Tenant onboarding | Self-service vs consultant-assisted | TBD |
| 6 | Agent hosting | Vercel serverless (timeout limits) vs VPS (long-running) | TBD — likely VPS for heavy agents |
| 7 | Credential encryption | Vercel env vars vs database-level encryption vs vault | TBD |
| 8 | Client-facing dashboard | Same app (role-based) vs separate app | TBD |

---

*This document extends GEC-Architecture-v2.md and GEC-Content-Auto-Posting-Plan.md with multi-tenant and AI agent capabilities.*
