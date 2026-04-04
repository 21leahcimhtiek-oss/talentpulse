# TalentPulse

> **Performance management that runs on data, not gut feel.**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)

TalentPulse is a **production-grade AI employee performance analytics SaaS** built for modern HR teams at Aurora Rayes LLC. Stop guessing about your people. Start knowing.

---

## Features

| # | Feature | Description |
|---|---|---|
| 🔐 | **Auth and RBAC** | Supabase-powered authentication with role-based access control (admin, manager, employee) |
| 🎯 | **OKR Tracking** | Automated objective and key result progress tracking with at-risk alerts |
| 📋 | **Performance Reviews** | Structured digital review forms with 1 to 5 scoring, strengths, and improvement areas |
| 🤖 | **AI Bias Detection** | GPT-4o scans every review for language bias in real time before submission |
| 💬 | **360 Peer Feedback** | Collect, aggregate, and sentiment-analyze peer feedback at scale |
| 🧠 | **AI Coaching Suggestions** | Weekly manager coaching recommendations generated automatically by AI |
| 💚 | **Team Health Score** | Daily composite score from engagement plus OKR attainment plus feedback sentiment |
| 📊 | **Analytics Dashboard** | Org-wide KPIs, performance trends, and Recharts visualizations |
| 💳 | **Stripe Billing** | Starter ($79/mo), Pro ($199/mo), and Enterprise plans with self-serve customer portal |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Language | TypeScript 5.5 (strict mode) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (email/password, magic link, org invitations) |
| AI | OpenAI GPT-4o |
| Payments | Stripe (subscriptions + customer portal) |
| Rate Limiting | Upstash Redis |
| Error Monitoring | Sentry |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Testing | Jest + React Testing Library + Playwright |
| Deployment | Vercel (with cron jobs) |
| Container | Docker (multi-stage build) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account
- An [OpenAI](https://platform.openai.com) API key
- A [Stripe](https://stripe.com) account
- An [Upstash](https://upstash.com) Redis database

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/21leahcimhtiek-oss/talentpulse.git
cd talentpulse

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Set up Supabase
# - Create a new project at https://supabase.com
# - Run migrations in /supabase/migrations/
# - Enable Row Level Security on all tables
# - Copy your project URL and anon key to .env.local

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Other Commands

```bash
npm run build          # Production build
npm run typecheck      # TypeScript type checking
npm run lint           # ESLint
npm test               # Jest unit tests
npm run test:coverage  # Jest with coverage report
npm run test:e2e       # Playwright end-to-end tests
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_STARTER_PRICE_ID` | Stripe price ID for Starter plan | Yes |
| `STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro plan | Yes |
| `SENTRY_DSN` | Sentry DSN for server-side error tracking | Yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side error tracking | Yes |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map upload | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL for rate limiting | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL | Yes |
| `NEXTAUTH_SECRET` | Secret for session signing (32-byte random) | Yes |

Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`

---

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/21leahcimhtiek-oss/talentpulse)

1. Click the button above or import the repository in the Vercel dashboard
2. Configure all environment variables from the table above
3. Deploy — Vercel handles build, hosting, and the daily cron job automatically

### Docker

```bash
docker build -t talentpulse .
docker run -p 3000:3000 --env-file .env.local talentpulse
```

---

## Architecture Overview

```
talentpulse/
|-- src/
|   |-- app/                    # Next.js App Router
|   |   |-- (auth)/             # Public auth pages (login, signup, invite)
|   |   |-- (dashboard)/        # Protected dashboard pages
|   |   `-- api/                # API route handlers
|   |       |-- ai/             # Bias detection and coaching AI routes
|   |       |-- okrs/           # OKR CRUD endpoints
|   |       |-- reviews/        # Performance review routes
|   |       |-- feedback/       # Peer feedback routes
|   |       |-- team-health/    # Health score calculation + cron
|   |       `-- webhooks/       # Stripe webhook handler
|   |-- components/
|   |   |-- ui/                 # Primitive UI components (Button, Card, etc.)
|   |   |-- charts/             # Recharts visualization wrappers
|   |   `-- dashboard/          # Feature-specific dashboard components
|   |-- lib/
|   |   |-- supabase/           # Server + browser Supabase clients
|   |   |-- openai/             # OpenAI client and prompt templates
|   |   |-- stripe/             # Stripe client and billing helpers
|   |   `-- ratelimit/          # Upstash rate limit configurations
|   `-- types/                  # Global TypeScript type definitions
|-- supabase/
|   `-- migrations/             # SQL schema and RLS policies
|-- e2e/                        # Playwright end-to-end tests
`-- __tests__/                  # Jest unit and integration tests
```

### Data Flow

1. **Auth** - Supabase Auth issues JWTs; middleware validates on every request
2. **API Routes** - Server-side handlers check auth, rate limits (Upstash), then execute business logic
3. **Database** - All queries go through Supabase with RLS enforcing row-level tenant isolation
4. **AI Features** - Server-side only; OpenAI API key never exposed to client
5. **Billing** - Stripe webhooks update subscription status; customer portal for self-serve management
6. **Monitoring** - Sentry captures errors and performance traces across client, server, and edge

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for our development workflow, commit conventions, and code style guidelines.

---

## License

**MIT** (c) [Aurora Rayes LLC](LICENSE)

---

*Built with care by Aurora Rayes LLC*