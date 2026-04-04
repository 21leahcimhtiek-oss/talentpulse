# Changelog

All notable changes to TalentPulse are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Full authentication system with Supabase (email/password, org invitations, RBAC)
- Role-based access control: admin, manager, employee
- Employee directory with profiles, departments, and manager hierarchy
- OKR tracking with progress visualization and automated at-risk alerts
- Performance review system with structured forms (1-5 scoring, strengths/improvements)
- AI-powered bias detection in performance reviews via OpenAI GPT-4o
- 360-degree peer feedback collection with AI sentiment analysis (GPT-4o-mini)
- AI-powered weekly coaching suggestion generation for managers (GPT-4o)
- Team health scoring with daily composite calculation (engagement + OKR + feedback)
- Analytics dashboard with org-wide KPIs, trends, and recharts visualizations
- Stripe billing integration (Starter $79/mo, Pro $199/mo, Enterprise custom)
- Stripe customer portal for subscription management
- Stripe webhook handler with signature verification
- Rate limiting on all API routes via Upstash Redis (100 req/min standard, 10 req/min for AI)
- Error tracking and performance monitoring via Sentry
- Automated CI/CD pipeline: lint → typecheck → unit tests → build → e2e
- Docker support for containerized deployment
- Full TypeScript strict mode throughout codebase
- Row Level Security enforced on all 9 database tables
- Vercel deployment configuration with daily cron job for team health scoring
- Zod validation on all API request bodies
- OpenAI retry logic with exponential backoff and graceful fallback
- Jest unit test suite (employees, reviews, bias detection, coaching generation)
- Playwright e2e test suite (OKR flow, review flow)