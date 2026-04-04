# TalentPulse — System Architecture

> Aurora Rayes LLC — Internal Engineering Documentation  
> Version 1.0 | Last Updated: 2025

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Design](#4-database-design)
5. [Authentication Flow](#5-authentication-flow)
6. [AI Integration](#6-ai-integration)
7. [Billing Flow](#7-billing-flow)
8. [Caching Strategy](#8-caching-strategy)
9. [Error Handling & Observability](#9-error-handling--observability)
10. [Security](#10-security)
11. [Deployment](#11-deployment)
12. [Performance](#12-performance)

---

## 1. System Overview

TalentPulse is a multi-tenant SaaS application built on a modern edge-first stack. All traffic is served through Vercel's global edge network, with Supabase providing the relational database, auth, and real-time capabilities.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│   │  Web Browser │    │  Mobile PWA  │    │  API Consumers       │  │
│   │  (Next.js)   │    │  (Next.js)   │    │  (REST clients)      │  │
│   └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘  │
└──────────┼────────────────────┼───────────────────────┼─────────────┘
           │                    │                       │
           └────────────────────┴───────────────────────┘
                                │  HTTPS / TLS 1.3
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       VERCEL EDGE NETWORK                           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              Vercel Edge Middleware                         │   │
│   │  • Auth token validation  • Geo-routing  • A/B testing      │   │
│   └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                      │
│   ┌──────────────────────────▼──────────────────────────────────┐   │
│   │                 Next.js 14 Application                      │   │
│   │  ┌─────────────────┐         ┌────────────────────────────┐ │   │
│   │  │  App Router     │         │     API Routes             │ │   │
│   │  │  Server Comps   │         │  /api/employees            │ │   │
│   │  │  Client Comps   │         │  /api/okrs                 │ │   │
│   │  │  Streaming RSC  │         │  /api/reviews              │ │   │
│   │  └─────────────────┘         │  /api/feedback             │ │   │
│   │                              │  /api/coaching             │ │   │
│   │                              │  /api/team-health          │ │   │
│   │                              │  /api/billing/*            │ │   │
│   │                              │  /api/auth/invite          │ │   │
│   │                              └────────────────────────────┘ │   │
│   └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                       │
    ┌──────▼──────┐    ┌────────▼──────┐    ┌──────────▼──────────┐
    │  Supabase   │    │   OpenAI API  │    │    Stripe API       │
    │             │    │               │    │                     │
    │  • Postgres │    │  • GPT-4o     │    │  • Checkout         │
    │  • Auth     │    │  • GPT-4o-mini│    │  • Subscriptions    │
    │  • RLS      │    │  • Embeddings │    │  • Webhooks         │
    │  • Realtime │    │               │    │  • Customer Portal  │
    └─────────────┘    └───────────────┘    └─────────────────────┘
           │
    ┌──────▼──────┐    ┌───────────────┐
    │   Upstash   │    │    Sentry     │
    │   Redis     │    │               │
    │             │    │  • Error      │
    │  • Rate     │    │    Tracking   │
    │    Limiting │    │  • Performance│
    │  • Caching  │    │    Monitoring │
    └─────────────┘    └───────────────┘
```

### Request Lifecycle

```
Browser Request
      │
      ▼
Vercel Edge Middleware
  ├── Check auth cookie
  ├── Redirect unauthenticated users to /login
  └── Forward authenticated requests
      │
      ▼
Next.js Route Handler
  ├── Server Component (no JS shipped to client)
  │     └── Direct Supabase query with service role
  └── API Route
        ├── Auth middleware (verify JWT)
        ├── Rate limit middleware (Redis check)
        ├── Validation middleware (Zod schema)
        └── Business logic execution
              └── Supabase query (RLS enforced)
```

---

## 2. Frontend Architecture

### Next.js 14 App Router

TalentPulse uses the Next.js 14 App Router with React Server Components as the default rendering strategy.

```
app/
├── (auth)/
│   ├── login/page.tsx          # Server Component
│   ├── signup/page.tsx         # Server Component
│   └── invite/[token]/page.tsx # Server Component
├── (dashboard)/
│   ├── layout.tsx              # Server Component (auth check)
│   ├── dashboard/page.tsx      # Server Component
│   ├── employees/
│   │   ├── page.tsx            # Server Component
│   │   ├── [id]/page.tsx       # Server Component
│   │   └── new/page.tsx        # Client Component (form)
│   ├── okrs/
│   │   ├── page.tsx            # Server Component
│   │   └── [id]/page.tsx       # Server Component
│   ├── reviews/
│   │   ├── page.tsx            # Server Component
│   │   └── new/page.tsx        # Client Component (form + AI)
│   ├── feedback/page.tsx       # Client Component (real-time)
│   ├── coaching/page.tsx       # Client Component (streaming AI)
│   └── settings/
│       ├── page.tsx            # Client Component
│       └── billing/page.tsx    # Client Component
└── api/                        # API Routes
```

### Server Components vs. Client Components Decision Tree

```
Is the component purely presentational with no interactivity?
    │
    ├── YES → Use Server Component
    │         Benefits: No JS bundle cost, direct DB access,
    │         SEO-friendly, faster initial load
    │
    └── NO → Does it need: useState, useEffect, onClick,
              browser APIs, real-time updates?
                  │
                  ├── YES → Use Client Component ("use client")
                  │         Benefits: Interactivity, local state,
                  │         browser events, streaming AI output
                  │
                  └── MIXED → Server Component wrapping Client Component
                              Pass serializable data as props
                              Keep "use client" boundary as deep as possible
```

### Tailwind CSS Design System

```
Design Tokens:
─────────────────────────────────────────────────
Primary:     #6366F1 (Indigo 500)
Secondary:   #8B5CF6 (Violet 500)
Success:     #10B981 (Emerald 500)
Warning:     #F59E0B (Amber 500)
Danger:      #EF4444 (Red 500)
Background:  #F9FAFB (Gray 50)
Surface:     #FFFFFF (White)
Border:      #E5E7EB (Gray 200)
Text:        #111827 (Gray 900)
Muted:       #6B7280 (Gray 500)

Typography:
─────────────────────────────────────────────────
Font Family: Inter (Google Fonts)
H1: text-3xl font-bold tracking-tight
H2: text-2xl font-semibold
H3: text-xl font-semibold
Body: text-base font-normal
Small: text-sm
Label: text-xs font-medium uppercase tracking-wide

Spacing Scale: Tailwind default (4px base)
Border Radius: rounded-lg (8px) for cards, rounded-full for badges
Shadow: shadow-sm for cards, shadow-md for modals
```

---

## 3. Backend Architecture

### API Routes Middleware Chain

Every API route in TalentPulse passes through a standardized middleware chain:

```
Incoming Request
      │
      ▼
┌─────────────────────────────────────────┐
│           1. AUTH MIDDLEWARE            │
│                                         │
│  • Extract session from cookie/header   │
│  • Verify JWT with Supabase Auth        │
│  • Attach user + org to request context │
│  • Return 401 if invalid/expired        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│        2. RATE LIMIT MIDDLEWARE         │
│                                         │
│  • Check Redis for request count        │
│  • Key: ip:userId (per-user per-IP)     │
│  • Window: 60 seconds                   │
│  • Limit: 100 requests/window           │
│  • Return 429 with Retry-After header   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│        3. VALIDATION MIDDLEWARE         │
│                                         │
│  • Parse request body                   │
│  • Validate against Zod schema          │
│  • Return 422 with field errors         │
│  • Sanitize inputs                      │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         4. EXECUTE BUSINESS LOGIC       │
│                                         │
│  • Supabase query (RLS enforced)        │
│  • OpenAI API call (if AI endpoint)     │
│  • Stripe API call (if billing)         │
│  • Return structured JSON response      │
└─────────────────────────────────────────┘
```

### Supabase Row Level Security (RLS) Enforcement

All database queries from API routes use the user's session token, meaning Postgres RLS policies are automatically enforced. No data from other organizations can ever be accessed.

```sql
-- Example RLS Policy Pattern (applied to all tables)
CREATE POLICY "org_isolation" ON employees
  USING (org_id = auth.jwt() ->> 'org_id');
```

---

## 4. Database Design

### Entity Relationship Diagram

```
organizations
    │ 1
    │
    ├──────────────────────────────────────────────────────┐
    │ n                                                     │ n
 profiles                                              subscriptions
    │ 1                                                (1 per org)
    │
    ├─────────────────┬──────────────┬─────────────────────┐
    │ n               │ n            │ n                    │ n
 employees          okrs          reviews              feedback
    │ 1               │ 1            │ 1
    │                 │              │
    │ n               │ n            │ 1
 coaching_sessions  okr_updates  review_comments
    │
    │ 1
    │
    │ 1
 team_health_scores
```

### Table Definitions

#### 1. `organizations`
```sql
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'starter',   -- starter|pro|enterprise
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_see_own_org" ON organizations
  FOR SELECT USING (id IN (
    SELECT org_id FROM profiles WHERE user_id = auth.uid()
  ));
```

#### 2. `profiles`
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',    -- admin|manager|member
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_org_id ON profiles(org_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON profiles
  USING (org_id IN (
    SELECT org_id FROM profiles WHERE user_id = auth.uid()
  ));
```

#### 3. `employees`
```sql
CREATE TABLE employees (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  department   TEXT,
  role         TEXT,
  manager_id   UUID REFERENCES employees(id),
  hire_date    DATE,
  status       TEXT NOT NULL DEFAULT 'active',   -- active|inactive|on_leave
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_employees_org_id ON employees(org_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(org_id, status);

-- RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON employees
  USING (org_id IN (
    SELECT org_id FROM profiles WHERE user_id = auth.uid()
  ));
```

#### 4. `okrs`
```sql
CREATE TABLE okrs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id   UUID REFERENCES employees(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  target_value  NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit          TEXT,                            -- %, $, count, etc.
  due_date      DATE,
  status        TEXT NOT NULL DEFAULT 'active',  -- active|completed|cancelled
  quarter       TEXT,                            -- Q1 2025, Q2 2025, etc.
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_okrs_org_id ON okrs(org_id);
CREATE INDEX idx_okrs_employee_id ON okrs(employee_id);
CREATE INDEX idx_okrs_quarter ON okrs(org_id, quarter);
```

#### 5. `reviews`
```sql
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id     UUID REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id     UUID REFERENCES profiles(id),
  review_type     TEXT NOT NULL,                 -- self|peer|manager|360
  period          TEXT,                          -- Q1 2025, Annual 2025, etc.
  content         TEXT,
  rating          NUMERIC(3,2),                  -- 1.00 to 5.00
  bias_score      NUMERIC(3,2),                  -- 0.00 (no bias) to 1.00
  bias_flags      JSONB DEFAULT '[]',            -- array of detected bias types
  status          TEXT NOT NULL DEFAULT 'draft', -- draft|submitted|acknowledged
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reviews_org_id ON reviews(org_id);
CREATE INDEX idx_reviews_employee_id ON reviews(employee_id);
CREATE INDEX idx_reviews_status ON reviews(org_id, status);
```

#### 6. `feedback`
```sql
CREATE TABLE feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id     UUID REFERENCES employees(id) ON DELETE CASCADE,
  giver_id        UUID REFERENCES profiles(id),
  content         TEXT NOT NULL,
  sentiment       TEXT,                          -- positive|neutral|negative
  sentiment_score NUMERIC(4,3),                  -- -1.000 to 1.000
  is_anonymous    BOOLEAN DEFAULT false,
  tags            JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_feedback_org_id ON feedback(org_id);
CREATE INDEX idx_feedback_employee_id ON feedback(employee_id);
```

#### 7. `coaching_sessions`
```sql
CREATE TABLE coaching_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id     UUID REFERENCES employees(id) ON DELETE CASCADE,
  generated_by    UUID REFERENCES profiles(id),
  suggestions     JSONB NOT NULL,                -- array of coaching items
  context_summary TEXT,
  week_of         DATE,                          -- start of the coaching week
  acknowledged_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_coaching_org_id ON coaching_sessions(org_id);
CREATE INDEX idx_coaching_employee_id ON coaching_sessions(employee_id);
CREATE INDEX idx_coaching_week ON coaching_sessions(employee_id, week_of);
```

#### 8. `team_health_scores`
```sql
CREATE TABLE team_health_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  department      TEXT,
  score           NUMERIC(4,2),                  -- 0 to 100
  components      JSONB,                         -- breakdown by category
  computed_at     DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_health_org_id ON team_health_scores(org_id);
CREATE INDEX idx_health_computed ON team_health_scores(org_id, computed_at DESC);
```

#### 9. `subscriptions`
```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                  TEXT NOT NULL DEFAULT 'starter',
  status                TEXT NOT NULL DEFAULT 'active',  -- active|past_due|cancelled
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
```

---

## 5. Authentication Flow

```
User enters credentials
         │
         ▼
Supabase Auth (supabase.auth.signInWithPassword)
         │
         ├── FAILURE → Return error to UI
         │
         └── SUCCESS
               │
               ▼
         Supabase issues:
         • access_token (JWT, 1 hour expiry)
         • refresh_token (rotating, 30 day expiry)
         • Session stored in httpOnly cookies (Next.js middleware)
               │
               ▼
         JWT Payload contains:
         {
           sub: "user-uuid",
           email: "user@company.com",
           org_id: "org-uuid",        ← custom claim
           role: "admin|manager|member" ← custom claim
         }
               │
               ▼
         API Route receives request
               │
               ▼
         createServerClient(cookies()) verifies JWT
               │
               ├── INVALID → 401 Unauthorized
               │
               └── VALID
                     │
                     ▼
               Supabase executes query
               WITH user's session token
                     │
                     ▼
               Postgres RLS policies evaluate:
               auth.uid() = user UUID
               auth.jwt() ->> 'org_id' = org UUID
                     │
                     ▼
               Returns only rows belonging
               to the authenticated user's org
```

### Organization Isolation

Each user belongs to exactly one organization. The `org_id` is embedded in the JWT as a custom claim via a Supabase database function triggered on user creation. RLS policies on every table enforce that users can only read/write data within their org.

---

## 6. AI Integration

### GPT-4o — Bias Detection in Performance Reviews

```
Review content submitted
         │
         ▼
Preprocessing:
• Strip PII (names → "[Employee]", "[Manager]")
• Tokenize and chunk if > 2000 tokens
         │
         ▼
OpenAI GPT-4o API call:
{
  model: "gpt-4o",
  messages: [
    { role: "system", content: BIAS_DETECTION_SYSTEM_PROMPT },
    { role: "user", content: sanitizedReviewText }
  ],
  response_format: { type: "json_object" },
  temperature: 0.1   // Low for consistency
}
         │
         ▼
Response parsing:
{
  bias_score: 0.0–1.0,
  bias_flags: ["gender_coded_language", "recency_bias", "halo_effect"],
  explanation: "...",
  suggestions: ["Rewrite: '...' → '...'"]
}
         │
         ▼
Store in reviews.bias_score + reviews.bias_flags
Display in-UI with highlighted passages
```

### GPT-4o-mini — Sentiment Analysis on Feedback

```
Feedback content submitted
         │
         ▼
OpenAI GPT-4o-mini API call (batch when possible):
{
  model: "gpt-4o-mini",
  messages: [...],
  response_format: { type: "json_object" }
}
         │
         ▼
Response:
{
  sentiment: "positive|neutral|negative",
  score: -1.0 to 1.0,
  themes: ["communication", "leadership", "technical_skills"]
}
         │
         ▼
Store in feedback.sentiment + feedback.sentiment_score
```

### GPT-4o — Weekly Coaching Generation

```
Weekly cron job triggers (every Monday 9am UTC)
         │
         ▼
For each active employee in active orgs:
  Gather context:
  • Last 4 weeks of feedback (sentiment summary)
  • OKR progress (% complete vs target)
  • Last performance review themes
  • Previous coaching acknowledgment rate
         │
         ▼
GPT-4o API call with structured context
         │
         ▼
Response:
{
  suggestions: [
    {
      category: "communication|leadership|technical|wellbeing",
      priority: "high|medium|low",
      suggestion: "...",
      action_item: "...",
      resources: ["..."]
    }
  ]
}
         │
         ▼
Store in coaching_sessions table
Notify manager via in-app notification
```

### Retry Logic & Fallback Strategy

```javascript
// Exponential backoff with jitter
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,    // 1 second
  maxDelay: 10000,       // 10 seconds
  backoffFactor: 2,
};

// Fallback hierarchy
1. Primary: GPT-4o / GPT-4o-mini
2. On RateLimit (429): Queue for retry after 60s
3. On ServiceError (500): Return partial result with degraded flag
4. On Timeout (>30s): Return null with "AI analysis pending" UI state
5. Circuit breaker: After 5 consecutive failures, pause AI calls for 5 minutes
```

---

## 7. Billing Flow

```
User clicks "Upgrade to Pro"
         │
         ▼
POST /api/billing/create-checkout
• Creates Stripe Checkout Session
• Sets success_url and cancel_url
• Attaches metadata: { org_id, plan }
         │
         ▼
User redirected to Stripe-hosted checkout page
         │
         ├── CANCELLED → Redirect to /settings/billing (no change)
         │
         └── PAYMENT SUCCESS
               │
               ▼
         Stripe sends webhook to:
         POST /api/billing/webhook
               │
               ▼
         Webhook handler:
         1. Verify Stripe signature (STRIPE_WEBHOOK_SECRET)
         2. Parse event type
               │
               ├── checkout.session.completed
               │     • Upsert subscriptions table
               │     • Update organizations.plan
               │
               ├── customer.subscription.updated
               │     • Update subscription status/period
               │     • Handle plan upgrades/downgrades
               │
               └── customer.subscription.deleted
                     • Mark subscription as cancelled
                     • Downgrade org to 'starter' plan
               │
               ▼
         Plan enforcement:
         • Feature flags read from organizations.plan
         • Middleware blocks pro/enterprise features on starter
         • UI shows upgrade prompts for locked features
```

---

## 8. Caching Strategy

### Upstash Redis — Rate Limiting

```javascript
// Rate limit check per API request
const rateLimitKey = `ratelimit:${ip}:${userId}`;
const requests = await redis.incr(rateLimitKey);
if (requests === 1) await redis.expire(rateLimitKey, 60);
if (requests > 100) return new Response(null, {
  status: 429,
  headers: { 'Retry-After': '60' }
});
```

### Next.js Built-in Caching

```typescript
// Static pages — cached at build time
export const revalidate = 3600; // 1 hour ISR for marketing pages

// Dynamic data — no cache (dashboard pages)
export const dynamic = 'force-dynamic';

// API Routes — cache GET responses
export async function GET() {
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' }
  });
}
```

### Caching Hierarchy

```
Request → Edge Cache (Vercel CDN)
              │ MISS
              ▼
          Next.js Data Cache (fetch cache)
              │ MISS
              ▼
          Supabase / OpenAI / Stripe
              │
              └── Response stored at appropriate cache level
```

---

## 9. Error Handling & Observability

### Sentry Integration

```typescript
// sentry.server.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,          // 10% of transactions
  profilesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  integrations: [Sentry.prismaIntegration()],
});

// Capture errors with context
Sentry.captureException(error, {
  tags: { org_id: ctx.orgId, endpoint: req.url },
  extra: { userId: ctx.userId }
});
```

### Graceful Degradation for AI Services

```
AI Service Error Handling:
──────────────────────────────────────────────────────
Error Type          │ Response Strategy
──────────────────────────────────────────────────────
Rate Limit (429)    │ Queue for retry, return "pending" state
Timeout (>30s)      │ Return null, show "Analysis in progress"
Invalid Response    │ Skip AI fields, save review without scores
Service Down        │ Circuit breaker, fallback to manual review
Token Limit         │ Truncate input, flag as "partial analysis"
──────────────────────────────────────────────────────
```

### Structured Error Responses

```typescript
// All API errors follow this schema
{
  "error": {
    "code": "VALIDATION_ERROR",        // Machine-readable code
    "message": "Invalid email format", // Human-readable message
    "field": "email",                  // Optional: specific field
    "request_id": "req_abc123"         // For support correlation
  }
}
```

---

## 10. Security

### Security Controls Matrix

```
Control                    │ Implementation
───────────────────────────┼────────────────────────────────────────
Transport Security         │ HTTPS/TLS 1.3 enforced by Vercel
Row Level Security         │ Enabled on all Postgres tables
JWT Authentication         │ Supabase Auth with rotating refresh tokens
RBAC                       │ admin/manager/member role enforcement
Rate Limiting              │ 100 req/min via Upstash Redis
Webhook Verification       │ Stripe signature verification (HMAC-SHA256)
Secrets Management         │ Vercel environment variables (never in code)
Input Sanitization         │ Zod schema validation on all inputs
XSS Prevention             │ React's built-in escaping + CSP headers
CSRF Protection            │ SameSite cookie policy + origin checks
SQL Injection              │ Parameterized queries via Supabase client
Audit Logging              │ Postgres audit triggers on sensitive tables
```

### Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com;
  frame-src https://js.stripe.com https://hooks.stripe.com;
  connect-src 'self' https://*.supabase.co https://api.openai.com;
  img-src 'self' data: https:;
```

---

## 11. Deployment

### Vercel Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/team-health",
      "schedule": "0 9 * * 1"     // Every Monday 9am UTC
    },
    {
      "path": "/api/cron/coaching",
      "schedule": "0 8 * * 1"     // Every Monday 8am UTC
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Environment Promotion

```
Development → Staging (preview deployments) → Production
     │                    │                        │
  localhost          pr-*.vercel.app         talentpulse.app
  .env.local        Preview env vars         Production env vars
  Test DB           Staging Supabase         Production Supabase
  Test Stripe       Test Stripe keys         Live Stripe keys
```

---

## 12. Performance

### Server Components & Bundle Optimization

```
Page                          │ Strategy              │ JS Bundle Impact
──────────────────────────────┼───────────────────────┼──────────────────
/dashboard                    │ Server Component       │ ~0kb added
/employees                    │ Server Component       │ ~0kb added
/employees/[id]               │ Server Component       │ ~0kb added
/reviews/new (form)           │ Client Component       │ ~45kb
/feedback (real-time)         │ Client Component       │ ~30kb
/coaching (streaming AI)      │ Client Component       │ ~25kb
```

### AI Response Streaming

```typescript
// Stream coaching suggestions to browser in real-time
const stream = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  stream: true,
});

// Return as ReadableStream
return new Response(stream.toReadableStream(), {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

### Image Optimization

All employee avatars and company logos use Next.js `<Image>` component for automatic WebP conversion, lazy loading, and responsive sizing.

### Core Web Vitals Targets

```
Metric    │ Target   │ Strategy
──────────┼──────────┼──────────────────────────────────────────
LCP       │ < 2.5s   │ Server Components, edge caching
FID/INP   │ < 200ms  │ Minimal client JS, deferred loading
CLS       │ < 0.1    │ Explicit image dimensions, skeleton screens
TTFB      │ < 800ms  │ Vercel edge, Supabase connection pooling
```

---

*Architecture document maintained by the Aurora Rayes LLC engineering team.*