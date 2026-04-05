# TalentPulse Architecture

## Overview
TalentPulse is a multi-tenant SaaS built on **Next.js 14 App Router**, deployed on **Vercel**, with **Supabase** for the database and authentication layer. The AI features run exclusively server-side via **OpenAI GPT-4o**, and billing is handled by **Stripe**.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React, SSR, API routes |
| Database | Supabase (PostgreSQL) | Relational data, RLS, real-time |
| Auth | Supabase Auth + JWT | OAuth, email/password, session management |
| AI | OpenAI GPT-4o | Bias detection, coaching, sentiment |
| Payments | Stripe | Subscriptions, checkout, webhooks |
| Rate Limiting | Upstash Redis | Sliding-window per-user rate limiting |
| Monitoring | Sentry | Error tracking, performance |
| Deployment | Vercel | Edge functions, CDN, CI/CD |
| Testing | Jest + Playwright | Unit tests + E2E tests |

---

## Application Layers

### 1. Presentation Layer
- **Next.js App Router** pages and layouts under `app/`
- **Server Components** by default; Client Components only where interactivity is needed
- **shadcn/ui** component library built on Radix UI + Tailwind CSS
- Pages: Dashboard, Employees, OKRs, Reviews, Feedback, Coaching, Team Health, Billing, Settings

### 2. API Layer
- **Route Handlers** under `app/api/` (Next.js App Router)
- Each route handler: authenticates via Supabase JWT → checks rate limit → validates input → queries DB → returns JSON
- AI calls (OpenAI) only happen in server-side route handlers — never in client components
- Stripe webhook handler runs at edge runtime for low latency

### 3. Business Logic Layer
- `lib/openai/detect-bias.ts` — GPT-4o bias detection for review text
- `lib/openai/generate-coaching.ts` — Personalized coaching suggestions
- `lib/openai/sentiment.ts` — Feedback sentiment scoring
- `lib/rate-limit.ts` — Upstash Redis sliding-window rate limiter
- `lib/stripe/` — Stripe checkout, portal, webhook processing
- `lib/supabase/` — Client and server Supabase clients

### 4. Data Layer
- **Supabase PostgreSQL** with Row Level Security (RLS)
- All data access goes through Supabase client; no raw SQL from app code
- Migrations managed via `supabase/migrations/`

---

## Database Schema

```
organizations
├── id (PK)
├── name
└── slug

profiles (extends auth.users)
├── id (PK, FK → auth.users)
├── org_id (FK → organizations)
├── email
├── full_name
├── role: admin | manager | employee
└── stripe_customer_id

employees
├── id (PK)
├── profile_id (FK → profiles)
├── org_id (FK → organizations)
├── manager_id (FK → profiles)
├── job_title
├── department
└── status: active | inactive

okrs
├── id (PK)
├── employee_id (FK → profiles)
├── title, description, quarter, year
├── progress (0–100)
└── status: draft | on_track | at_risk | completed

key_results
├── id (PK)
├── okr_id (FK → okrs)
├── title
├── target_value, current_value, unit

performance_reviews
├── id (PK)
├── reviewer_id (FK → profiles)
├── reviewee_id (FK → profiles)
├── cycle, overall_score (1–5)
├── strengths, improvements, comments
└── bias_flags (jsonb)

peer_feedback
├── id (PK)
├── giver_id (FK → profiles)
├── recipient_id (FK → profiles)
├── content
├── is_anonymous
└── sentiment_score, sentiment_label

coaching_suggestions
├── id (PK)
├── employee_id (FK → profiles)
├── manager_id (FK → profiles)
└── suggestions (jsonb array)

team_health_scores
├── id (PK)
├── org_id (FK → organizations)
├── score, engagement_score, okr_attainment, feedback_sentiment
└── calculated_at

subscriptions
├── id (PK)
├── user_id (FK → profiles)
├── org_id (FK → organizations)
├── stripe_subscription_id (UNIQUE)
├── plan_tier: free | starter | pro | enterprise
└── status: trialing | active | past_due | canceled
```

---

## Authentication & Authorization

### Authentication Flow
1. User signs in via Supabase Auth (email/password or OAuth)
2. Supabase issues a JWT stored in a secure HttpOnly cookie
3. Next.js middleware validates the JWT on every request
4. Route handlers call `createClient()` (server) to get an authenticated Supabase client

### Row Level Security (RLS)
All tables have RLS enabled. Policies enforce:
- **profiles**: Users can only view/edit profiles in their own organization
- **employees/okrs/reviews**: Authenticated users within the same org
- **subscriptions**: Users can only view their own subscription

### RBAC Roles
| Role | Capabilities |
|---|---|
| `admin` | Full access — manage org, billing, all employees |
| `manager` | View/manage their direct reports, run reviews |
| `employee` | View own data, submit peer feedback |

---

## AI Pipeline

All AI calls are **server-side only** — the OpenAI API key is never exposed to the client.

### Bias Detection (`/api/reviews` POST)
1. Review text extracted from request body
2. GPT-4o prompted with structured JSON schema: `{ flags[], bias_free, overall_assessment }`
3. Flags include type (gender, racial, age, etc.) and excerpt
4. Result stored in `performance_reviews.bias_flags` and returned in API response

### Coaching Generation (`/api/coaching` POST)
1. Last 90 days of reviews, OKRs, and peer feedback fetched for the employee
2. GPT-4o generates 3–5 personalized coaching suggestions as a JSON array
3. Results stored in `coaching_suggestions` table

### Sentiment Analysis (`/api/feedback` POST)
1. Feedback content sent to GPT-4o with a sentiment classification prompt
2. Returns `sentiment_score` (0–1) and `sentiment_label` (positive/neutral/negative)
3. Score stored in `peer_feedback` and used in team health calculation

---

## Rate Limiting Strategy

Uses **Upstash Redis** with a sliding-window algorithm:

```typescript
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '60s'),
});
```

Each route handler calls `checkRateLimit(userId, endpoint)` as the first step after authentication. If the limit is exceeded, a `429` response is returned immediately.

---

## Billing Integration

### Stripe Checkout Flow
1. User clicks "Upgrade" → calls `POST /api/billing/create-checkout`
2. Server creates a Stripe Checkout Session with the selected price ID
3. User is redirected to Stripe-hosted checkout page
4. On success, Stripe redirects to `/billing/success`

### Webhook Processing
- Endpoint: `POST /api/billing/webhook` (Edge Runtime)
- Stripe-Signature header verified with `stripe.webhooks.constructEvent()`
- Events handled: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Subscription status synced to `subscriptions` table on every webhook event

---

## Security Considerations

| Concern | Mitigation |
|---|---|
| API authentication | Supabase JWT required on all `/api/*` routes |
| Data isolation | RLS policies enforce org-level data separation |
| OpenAI key exposure | API key only used in server-side route handlers |
| Stripe webhook spoofing | Signature verification with `STRIPE_WEBHOOK_SECRET` |
| CSRF | Next.js App Router same-origin policy; no custom CSRF needed for API routes with JSON bodies |
| Rate limiting | Upstash Redis sliding window prevents abuse |
| Secrets in code | All secrets via environment variables, never committed |

---

## Deployment

### Vercel Configuration
- **Next.js** auto-detected by Vercel
- **Edge Runtime** for `/api/billing/webhook` (low cold-start latency)
- **Cron Job** (Vercel Cron) for weekly coaching generation: `0 9 * * 1` (Monday 9am UTC)

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `OPENAI_API_KEY` | OpenAI API key (server only) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_STARTER_PRICE_ID` | Stripe Price ID for Starter plan |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro plan |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. https://talentpulse.vercel.app) |
| `SENTRY_DSN` | Sentry DSN for error tracking |

---

## Performance

- **Server Components** by default — zero client JS for data-heavy pages
- **Next.js App Router caching** — `fetch` with `cache: 'force-cache'` for static data; `revalidate` for near-real-time
- **ISR** (Incremental Static Regeneration) for marketing pages
- **Supabase connection pooling** via PgBouncer (built-in on Supabase)
- **Edge Runtime** for latency-sensitive webhook processing