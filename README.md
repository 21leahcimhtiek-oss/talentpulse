# TalentPulse

> **Performance management that runs on data, not gut feel.**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)

TalentPulse is a production-grade AI-powered employee performance analytics and OKR tracking SaaS built for modern HR teams. Get data-driven insights, eliminate bias from reviews, and give managers AI-generated coaching suggestions — all in one platform.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **OKR Tracking** | Set, track, and visualize objectives with automated at-risk alerts |
| 🛡️ **AI Bias Detection** | Catch unconscious bias in performance reviews with GPT-4o |
| 💬 **360° Feedback** | Peer feedback collection with AI sentiment analysis |
| 🧠 **AI Coaching** | Weekly manager coaching suggestions from real performance data |
| 📊 **Team Health Score** | Daily composite scores across engagement, OKRs, and feedback |
| 📈 **Analytics Dashboard** | Org-wide insights on attainment rates, review completion, and trends |
| 💳 **Subscription Billing** | Starter / Pro / Enterprise plans via Stripe |
| 🔐 **Auth + RBAC** | Supabase auth with admin / manager / employee roles |

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Zod validation |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | OpenAI GPT-4o (bias detection, coaching), GPT-4o-mini (sentiment) |
| Billing | Stripe (subscriptions + webhooks) |
| Rate Limiting | Upstash Redis |
| Error Tracking | Sentry |
| Deployment | Vercel |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/21leahcimhtiek-oss/talentpulse.git
cd talentpulse

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Set up Supabase
# 1. Create a new project at supabase.com
# 2. Run the migration:
supabase db push  # or paste supabase/migrations/001_initial_schema.sql into SQL editor

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Environment Variables

See [`.env.example`](.env.example) for all required environment variables.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL for rate limiting |
| `SENTRY_DSN` | Sentry DSN for error tracking |

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests (requires running dev server)
npm run test:e2e

# Coverage report
npm run test:coverage
```

## �� Deployment

See [deploy/vercel-deploy.md](deploy/vercel-deploy.md) for step-by-step deployment instructions.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/21leahcimhtiek-oss/talentpulse)

## 📖 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## 💰 Pricing

| Plan | Price | Employees |
|------|-------|-----------|
| Starter | $79/mo | Up to 25 |
| Pro | $199/mo | Unlimited |
| Enterprise | Custom | Unlimited |

## 📄 License

MIT © 2024 [Aurora Rayes LLC](https://aurorarayes.com)