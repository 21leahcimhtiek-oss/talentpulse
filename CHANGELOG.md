# Changelog

All notable changes to TalentPulse are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Full authentication system with Supabase (email/password, magic link, org invitations)
- Role-based access control (admin, manager, employee)
- Employee directory with profiles, departments, and manager hierarchy
- OKR tracking with progress visualization and automated at-risk alerts
- Performance review system with structured forms (1-5 scoring, strengths/improvements)
- AI-powered bias detection in performance reviews via OpenAI GPT-4o
- 360-degree peer feedback collection with AI sentiment analysis
- AI-powered weekly coaching suggestion generation for managers
- Team health scoring with daily composite calculation (engagement + OKR attainment + feedback sentiment)
- Analytics dashboard with org-wide KPIs, trends, and charts
- Stripe billing integration (Starter $79/mo, Pro $199/mo, Enterprise custom)
- Stripe customer portal for subscription management
- Rate limiting on all API routes via Upstash Redis
- Error tracking and performance monitoring via Sentry
- Automated CI/CD pipeline with GitHub Actions (lint -> typecheck -> test -> build)
- Docker support for containerized deployment
- Full TypeScript strict mode throughout
- Row Level Security on all database tables
- Vercel deployment configuration with cron jobs