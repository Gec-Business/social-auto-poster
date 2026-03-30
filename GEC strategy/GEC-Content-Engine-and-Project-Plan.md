# GEC Content Auto-Posting Engine & Project Execution Plan

**Version:** 1.0
**Date:** February 25, 2026
**Parent Document:** GEC-Sales-Ecosystem-Master-Plan.md

---

## Part 1: Content Auto-Posting Engine

### Content Serves 4 Jobs Simultaneously

1. **VISIBILITY** — "we exist, we're active, Google sees us"
2. **DRIVE ACTION** — push people to assessments, webinars, events
3. **CREDIBILITY** — thought leadership, prove we know what we talk about
4. **NURTURE** — existing leads see us in their feed, stay warm

### Platform Strategy

| Platform | Role for GEC | Priority | Frequency (Active) | Frequency (Break) |
|----------|-------------|----------|--------------------|--------------------|
| LinkedIn | Primary B2B. Decision makers live here. | #1 | Daily | 3x/week |
| Facebook | Broad reach in Georgia. Events + community. | #2 | Daily | 3x/week |
| Instagram | Visual brand, stories, reels. | #3 | 4x/week | 2x/week |

### Content Mix

| Category | % of Posts | Example | Drives To |
|----------|-----------|---------|-----------|
| Insight / Educational | 35% | "3 signs your export strategy needs an upgrade" | Assessment |
| Event Promotion | 20% | "Limited seats: AI Readiness Webinar March 2" | Registration |
| Social Proof | 15% | "How Company X improved their BPM score by 40%" | Trust |
| Assessment Teaser | 15% | "73% of SMEs score below 5/10 on AI readiness. Where do you stand?" | Assessment link |
| Behind the Scenes | 10% | "Preparing for our SME Programme kick-off" | Brand |
| Partner / Co-branded | 5% | "Together with BOG, we're hosting..." | Event |

### Weekly Content Calendar (Active Periods)

| Day | Content Type |
|-----|-------------|
| Monday | Insight post (educational, related to week's event theme) |
| Tuesday | Assessment teaser (drive to self-assessment) |
| Wednesday | Event promo or partner content |
| Thursday | Case study / social proof |
| Friday | Behind-the-scenes or culture post |
| Weekend | Reshare best performer or rest |

### Weekly Content Calendar (Break Periods)

| Day | Content Type |
|-----|-------------|
| Monday | Insight post |
| Wednesday | Assessment teaser |
| Friday | Curated industry news + GEC take |

### Event Promotion Arc (7 posts per event)

Every event generates 7 auto-posts:

| Timing | Post Type |
|--------|-----------|
| -14 days | Announcement ("Save the date") |
| -10 days | Topic deep-dive ("Why this matters") |
| -7 days | Speaker/mentor spotlight or teaser stat |
| -3 days | "Limited seats remaining" (urgency) |
| -1 day | Final reminder |
| Event day | Live story/update |
| +1 day | Key takeaway + "Missed it? Take the assessment" |
| +3 days | Recording/slides available (gated = email capture) |

24 events × 7 posts = **168 event-related posts per year** (auto-generated from event data)

### Content Generation Architecture

```
                ANNUAL CALENDAR (24 events)
                       │
                       ▼
          ┌─────────────────────────┐
          │   CONTENT GENERATOR     │
          │   (Claude API)          │
          │                         │
          │ Inputs:                 │
          │  • Event data           │
          │  • Content pillar       │
          │  • Platform (LI/FB/IG)  │
          │  • GEC tone guidelines  │
          │  • Assessment links     │
          │  • Past performance     │
          │                         │
          │ Outputs:                │
          │  • Post copy            │
          │  • Hashtags             │
          │  • UTM links            │
          │  • Image prompt         │
          │  • Best posting time    │
          └──────────┬──────────────┘
                     │
                ┌────┴────┐
                ▼         ▼
          Auto-post    Queue for
          (FB + IG)    Lia review
                       (LinkedIn)
```

### Monthly Workflow

1. **Beginning of month:** AI generates full month's content (30 posts)
2. **Lia reviews in batch** (30 min), approves/edits
3. **System schedules** all approved posts
4. **Daily auto-posting** runs on schedule
5. **LinkedIn** posts flagged for manual posting (until API ready)
6. **Weekly performance review:** AI adjusts next week's content based on engagement

### Technical Implementation

- Fork auto-posting system from saletool.ninja (Meta Graph API v25.0)
- Extend with LinkedIn posting (manual queue → API when approved)
- Content generation via Claude API with GEC tone prompt
- Image generation prompts for Remotion or AI image tools
- UTM tracking on all links: `utm_source=linkedin&utm_medium=social&utm_campaign=ai-readiness&utm_content=insight-post`
- Performance data feeds back into content generator

---

## Part 2: Project Execution Plan

### The 8 Pillars

| # | Pillar | Description |
|---|--------|-------------|
| P1 | Content & Auto-Posting | Social media engine across LI/FB/IG |
| P2 | Self-Assessment Surveys | 4 lead magnets with scoring + PDF |
| P3 | CRM + Intelligence DB | PostgreSQL + pgvector + Apollo.io |
| P4 | Nurture & Communication | AI-personalized email + multi-channel |
| P5 | Event Management | Webinar/workshop/bank event system |
| P6 | SME Development Programme | Cohort management, mentors, tracking |
| P7 | Partnership Development | Bank + association co-branding |
| P8 | Analytics & Dashboard | Full visibility across all pillars |

### How Pillars Connect

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

P3 (CRM + Intelligence DB) is the central nervous system. Everything flows through it.

### Sprint Calendar 2026

#### Sprint 1 — Mar 1-14: "Foundation"
**Pillars:** P3 + P1

- [ ] PostgreSQL + pgvector set up (Supabase)
- [ ] Contact + Company schema designed and deployed
- [ ] GEC content auto-posting system (fork from saletool.ninja)
- [ ] First month content calendar generated + approved
- [ ] Auto-posting live on FB + IG
- [ ] LinkedIn posts queued for manual posting

**Milestone:** GEC is posting daily. Database exists.

#### Sprint 2 — Mar 15-28: "First Assessment"
**Pillars:** P2 + P3 + P5

- [ ] AI Readiness assessment built (survey UI + scoring)
- [ ] PDF scorecard generator
- [ ] Assessment results flow into CRM database
- [ ] Apollo.io account + API connected (lead enrichment)
- [ ] Webinar registration page built
- [ ] First webinar promoted via auto-posts

**Milestone:** First lead magnet is live. Leads flow into DB.

#### Sprint 3 — Mar 29-Apr 11: "Nurture Begins"
**Pillars:** P4 + P2 + P5

- [ ] Post-assessment email nurture sequence (7 emails)
- [ ] Post-event email sequence (4 emails)
- [ ] Second assessment built (Export Readiness)
- [ ] Event promotion arc auto-generated from calendar
- [ ] Webinar recording → gated content flow
- [ ] Booking integration (Cal.com) for diagnostic calls

**Milestone:** Full loop works: content → assessment → nurture → booking.

#### Sprint 4 — Apr 12-25: "Scale Assessments"
**Pillars:** P2 + P3 + P7

- [ ] Third assessment (BPM Maturity)
- [ ] Fourth assessment (Strategy Readiness)
- [ ] Partnership landing pages (co-branded with banks)
- [ ] Event attendee data → CRM pipeline
- [ ] Lead scoring model v1 (assessment + engagement)
- [ ] BOG event executed with full data capture

**Milestone:** All 4 assessments live. Partner events feeding pipeline.

#### Sprint 5 — Apr 26-May 9: "Intelligence"
**Pillars:** P3 + P8 + P4

- [ ] AI communication engine v1 (Claude API)
- [ ] Weekly personalized outreach recommendations
- [ ] Contact activity dashboard
- [ ] Company intelligence enrichment (Apollo batch)
- [ ] Vector embeddings for contact similarity search
- [ ] "Find leads like [best client]" feature

**Milestone:** AI starts recommending actions per contact.

#### Sprint 6 — May 10-23: "SME Programme"
**Pillars:** P6 + P3 + P5

- [ ] SME Programme platform (cohort management)
- [ ] Mentor profiles + matching system
- [ ] Progress tracking for SMEs
- [ ] Programme data feeds into CRM
- [ ] Partner reporting dashboard (for banks)

**Milestone:** SME Programme has a digital home.

#### Sprint 7 — May 24-Jun 7: "Optimization"
**Pillars:** P8 + P4 + P1

- [ ] Full analytics dashboard (all pillars)
- [ ] Content performance tracking → AI adjusts strategy
- [ ] Email engagement analytics
- [ ] Diagnostic preview auto-generator (pre-proposal)
- [ ] Re-engagement flows for cold leads
- [ ] Summer content calendar generated

**Milestone:** System runs semi-autonomously through summer.

#### Summer Break — Jun 15-Sep 30: Autopilot

System runs independently:
- Auto-posting continues (3x/week)
- Assessments live, capturing leads
- Nurture sequences running
- AI recommendations weekly (Lia reviews)
- Data accumulating in intelligence DB

#### Sprint 8 — Oct 1-14: "Autumn Launch"
**Pillars:** ALL

- [ ] Review summer data + optimize everything
- [ ] Predictive lead scoring
- [ ] Automated proposal drafts
- [ ] LinkedIn API integration (if approved)
- [ ] Autumn content calendar
- [ ] 2027 planning begins

**Milestone:** Full system operational, optimizing itself.

### Weekly Rhythm

| Day | Activity |
|-----|----------|
| Monday | Sprint planning / review. Lia approves content queue. Check AI recommendations. |
| Wednesday | Mid-sprint check. Review pipeline, prep upcoming event. |
| Friday | Sprint deliverable review. Content performance. Next week auto-generated + queued. |

### Division of Work

| I Build | Lia Does |
|---------|----------|
| All code, integrations, automation | Review + approve content batches (30 min/week) |
| Assessment surveys + scoring logic | Write/refine assessment questions (domain expertise) |
| CRM schema + intelligence engine | Review AI communication recommendations |
| Email templates + nurture logic | Present at webinars + workshops |
| Auto-posting system | Manage partner relationships |
| Analytics dashboards | Make strategic decisions from data |
| PDF scorecards + proposals | Final review on proposals before sending |
| Event registration + promotion | Host the events |

---

*This document is part of the GEC Digital Sales Ecosystem Master Plan.*
