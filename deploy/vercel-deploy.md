# Deploying TalentPulse to Vercel

> Aurora Rayes LLC — Deployment Guide  
> Estimated time: 30–45 minutes for a complete production deployment

---

## Prerequisites

Before deploying, ensure you have accounts and access to the following services:

| Service | Purpose | Free Tier Available |
|---------|---------|-------------------|
| [Vercel](https://vercel.com) | Hosting & edge functions | Yes |
| [Supabase](https://supabase.com) | Database, auth, RLS | Yes (500MB DB) |
| [Stripe](https://stripe.com) | Payments & subscriptions | Yes (test mode) |
| [OpenAI](https://platform.openai.com) | GPT-4o / GPT-4o-mini | Pay-per-use |
| [Upstash](https://upstash.com) | Redis rate limiting | Yes (10k req/day) |
| [Sentry](https://sentry.io) | Error monitoring | Yes (5k events/mo) |
| GitHub | Source repository | Yes |

---

## Step 1: Supabase Setup

### 1.1 Create a New Project

1. Navigate to [app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Enter project details:
   - **Name:** `talentpulse-production`
   - **Database Password:** Generate a strong password and save it securely
   - **Region:** Choose the region closest to your users
4. Click **Create new project** and wait ~2 minutes for provisioning

### 1.2 Run the Database Migration

1. In the Supabase dashboard, navigate to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql` from your repository
4. Paste and click **Run** (Ctrl+Enter)
5. Verify success — you should see all 9 tables created in the **Table Editor**

### 1.3 Configure Authentication

1. Navigate to **Authentication → Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email settings:
   - Enable **Confirm email** (recommended for production)
   - Set **Site URL** to your Vercel domain (update after Step 5)
   - Add redirect URLs: `https://your-app.vercel.app/auth/callback`
4. Navigate to **Authentication → Email Templates** and customize the invite and confirmation templates with your branding

### 1.4 Set Up Custom JWT Claims

TalentPulse requires `org_id` and `role` as custom JWT claims. Run this function in SQL Editor:

```sql
-- Function to inject org_id and role into JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  claims jsonb;
  v_org_id uuid;
  v_role text;
BEGIN
  SELECT org_id, role INTO v_org_id, v_role
  FROM public.profiles
  WHERE user_id = (event->>'user_id')::uuid
  LIMIT 1;

  claims := event->'claims';
  IF v_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{org_id}', to_jsonb(v_org_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
```

5. Navigate to **Authentication → Hooks** and enable the `custom_access_token_hook` function

### 1.5 Retrieve API Credentials

1. Navigate to **Settings → API**
2. Copy and save:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret — never expose in client code

---

## Step 2: Stripe Setup

### 2.1 Create Products and Prices

1. Navigate to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to **Products** → **Add product**

**Create Pro Plan:**
- Name: `TalentPulse Pro`
- Description: `AI-powered performance management — unlimited employees`
- Pricing: Recurring, `$12.00 USD` per month per user
  - *Or use a flat monthly rate if preferred: `$199/month`*
- Copy the **Price ID** → `STRIPE_PRO_PRICE_ID`

**Create Enterprise Plan:**
- Name: `TalentPulse Enterprise`
- Description: `Enterprise performance management with dedicated support`
- Pricing: Custom / contact sales (or set a fixed price)
- Copy the **Price ID** → `STRIPE_ENTERPRISE_PRICE_ID`

### 2.2 Configure the Webhook Endpoint

> **Note:** Complete Step 5 (Vercel Deploy) first to get your production URL, then return here to configure the webhook.

1. Navigate to **Developers → Webhooks**
2. Click **Add endpoint**
3. Set **Endpoint URL:** `https://your-app.vercel.app/api/billing/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Click the endpoint and reveal/copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 2.3 Retrieve API Keys

1. Navigate to **Developers → API keys**
2. Copy:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY` ⚠️ Keep secret

> **Test vs. Live mode:** Use test mode keys during development. Switch to live mode keys for production. Stripe provides separate key pairs for each.

---

## Step 3: Upstash Redis Setup

### 3.1 Create a Redis Database

1. Navigate to [console.upstash.com](https://console.upstash.com)
2. Click **Create Database**
3. Configure:
   - **Name:** `talentpulse-ratelimit`
   - **Type:** Regional (single region for lowest latency)
   - **Region:** Match your Vercel deployment region
   - **TLS:** Enabled (required)
4. Click **Create**

### 3.2 Retrieve Credentials

1. In the database details page, scroll to **REST API**
2. Copy:
   - **UPSTASH_REDIS_REST_URL** → `UPSTASH_REDIS_REST_URL`
   - **UPSTASH_REDIS_REST_TOKEN** → `UPSTASH_REDIS_REST_TOKEN`

---

## Step 4: Sentry Setup

### 4.1 Create a New Project

1. Navigate to [sentry.io](https://sentry.io)
2. Click **Projects → Create Project**
3. Select platform: **Next.js**
4. Name: `talentpulse-production`
5. Click **Create Project**

### 4.2 Retrieve DSN

1. After project creation, copy the **DSN** from the setup page
2. It looks like: `https://abc123@o123456.ingest.sentry.io/7890123`
3. Save as → `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`

### 4.3 Create Auth Token (for source maps)

1. Navigate to **Settings → Auth Tokens**
2. Create a new token with **project:write** and **org:read** scopes
3. Save as → `SENTRY_AUTH_TOKEN`

---

## Step 5: Deploy to Vercel

### 5.1 Import Repository

1. Navigate to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your GitHub account and find the `talentpulse` repository
4. Click **Import**

### 5.2 Configure Environment Variables

Before deploying, add all environment variables. Click **Environment Variables** in the deployment configuration:

| Variable | Value Source | Environment |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | All |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys | All |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys | All |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Endpoint | Production |
| `STRIPE_PRO_PRICE_ID` | Stripe → Products → Price ID | All |
| `STRIPE_ENTERPRISE_PRICE_ID` | Stripe → Products → Price ID | All |
| `OPENAI_API_KEY` | platform.openai.com → API Keys | All |
| `UPSTASH_REDIS_REST_URL` | Upstash → Database → REST API | All |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → Database → REST API | All |
| `SENTRY_DSN` | Sentry → Project Settings | All |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry → Project Settings | All |
| `SENTRY_AUTH_TOKEN` | Sentry → Auth Tokens | All |
| `NEXT_PUBLIC_APP_URL` | Your Vercel domain (set after first deploy) | Production |
| `CRON_SECRET` | Generate random 32-char string | All |

> **Generating CRON_SECRET:** Run `openssl rand -hex 32` or use a password manager to generate a secure random string.

### 5.3 Configure Build Settings

Vercel auto-detects Next.js projects. Verify these settings:

- **Framework Preset:** Next.js (auto-detected)
- **Build Command:** `next build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)
- **Node.js Version:** 20.x (recommended)

### 5.4 Deploy

1. Click **Deploy**
2. Watch the build logs — initial deployment typically takes 2–4 minutes
3. On success, Vercel assigns a URL like `talentpulse-xyz.vercel.app`

---

## Step 6: Post-Deployment Configuration

### 6.1 Update NEXT_PUBLIC_APP_URL

1. In Vercel dashboard, go to **Settings → Environment Variables**
2. Add/update `NEXT_PUBLIC_APP_URL` with your deployment URL: `https://talentpulse-xyz.vercel.app`
3. Trigger a redeployment: **Deployments → Redeploy** (select latest)

### 6.2 Update Supabase Auth Redirect URLs

1. In Supabase → **Authentication → URL Configuration**
2. Update **Site URL:** `https://talentpulse-xyz.vercel.app`
3. Add **Redirect URL:** `https://talentpulse-xyz.vercel.app/auth/callback`

### 6.3 Update Stripe Webhook URL

1. Return to Stripe → **Developers → Webhooks**
2. Update the webhook endpoint URL to your production Vercel domain
3. Save and copy the new **Signing secret** → update `STRIPE_WEBHOOK_SECRET` in Vercel

### 6.4 End-to-End Smoke Tests

Run these checks to verify the deployment is healthy:

**Authentication:**
- [ ] Navigate to `/login` — page loads correctly
- [ ] Sign up with a new email — confirmation email received
- [ ] Confirm email — redirected to dashboard
- [ ] Log out — redirected to `/login`

**Core Features:**
- [ ] Create an employee record via `/employees/new`
- [ ] Create an OKR for the employee
- [ ] Submit a performance review — verify bias analysis runs
- [ ] Submit feedback — verify sentiment score appears

**Billing:**
- [ ] Navigate to `/settings/billing`
- [ ] Click upgrade — Stripe Checkout opens (use test card `4242 4242 4242 4242`)
- [ ] Complete payment — subscription activates, plan updates to Pro
- [ ] Click "Manage subscription" — Stripe Portal opens

**Cron Jobs:**
- [ ] Verify cron endpoint is accessible: `GET /api/cron/team-health` with `Authorization: Bearer <CRON_SECRET>`
- [ ] Check Vercel logs for successful cron execution the next Monday

### 6.5 Monitor for Errors

1. Open [sentry.io](https://sentry.io) and navigate to your project
2. Monitor the **Issues** tab for any errors from the smoke test
3. Check **Performance** for any slow queries or API calls
4. Set up an alert rule for error rate > 1% in any 5-minute window

---

## Environment Variables Reference

Complete reference of all environment variables used by TalentPulse:

### Supabase

| Variable | Description | Required | Where to Find |
|----------|-------------|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public API key | Yes | Supabase → Settings → API → Project API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | Yes | Supabase → Settings → API → Project API Keys |

### Stripe

| Variable | Description | Required | Where to Find |
|----------|-------------|----------|---------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (safe for client) | Yes | Stripe → Developers → API Keys |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-only) | Yes | Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification secret | Yes | Stripe → Developers → Webhooks → Endpoint |
| `STRIPE_PRO_PRICE_ID` | Price ID for Pro plan | Yes | Stripe → Products → Pro Plan |
| `STRIPE_ENTERPRISE_PRICE_ID` | Price ID for Enterprise plan | No | Stripe → Products → Enterprise Plan |

### OpenAI

| Variable | Description | Required | Where to Find |
|----------|-------------|----------|---------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o access | Yes | platform.openai.com → API Keys |

### Upstash Redis

| Variable | Description | Required | Where to Find |
|----------|-------------|----------|---------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint URL | Yes | Upstash → Database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST authentication token | Yes | Upstash → Database → REST API |

### Sentry

| Variable | Description | Required | Where to Find |
|----------|-------------|----------|---------------|
| `SENTRY_DSN` | Sentry Data Source Name (server-side) | Yes | Sentry → Project → Settings → Client Keys |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (client-side) | Yes | Same as above |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map uploads | Yes | Sentry → Settings → Auth Tokens |

### Application

| Variable | Description | Required | Where to Find |
|----------|-------------|----------|---------------|
| `NEXT_PUBLIC_APP_URL` | Full public URL of the application | Yes | Your Vercel deployment URL |
| `CRON_SECRET` | Secret token to authenticate cron job requests | Yes | Generate with `openssl rand -hex 32` |

---

## Custom Domain Setup

### Adding a Custom Domain in Vercel

1. Navigate to **Project → Settings → Domains**
2. Enter your domain: `talentpulse.app` (or your custom domain)
3. Follow DNS configuration instructions:
   - **Option A (recommended):** Add Vercel nameservers to your domain registrar
   - **Option B:** Add an A record or CNAME record to your existing DNS

### SSL Certificate

Vercel automatically provisions and renews SSL certificates via Let's Encrypt. No configuration required.

### Update Service Configurations After Domain Change

After switching to a custom domain, update:

1. **Supabase:** Authentication → URL Configuration → Site URL + Redirect URLs
2. **Stripe:** Developers → Webhooks → Endpoint URL
3. **Vercel:** Environment Variables → `NEXT_PUBLIC_APP_URL`
4. **Sentry:** (No update needed — DSN is project-based, not URL-based)

---

## Scaling Considerations

### Database

| Trigger | Action |
|---------|--------|
| > 500 concurrent connections | Enable Supabase connection pooling (PgBouncer) |
| > 10GB database size | Upgrade Supabase plan or archive old records |
| Slow queries (> 500ms) | Add missing indexes, analyze query plans |
| > 1000 employees per org | Implement cursor-based pagination in all list endpoints |

### OpenAI API

| Trigger | Action |
|---------|--------|
| Rate limit errors | Implement request queue with exponential backoff |
| High latency (> 15s) | Enable streaming responses for coaching endpoints |
| High costs | Batch sentiment analysis, use GPT-4o-mini more aggressively |
| > 1000 reviews/day | Implement async analysis queue (Supabase Edge Functions + pg_cron) |

### Vercel

| Trigger | Action |
|---------|--------|
| > 100k serverless invocations/day | Review pricing tier and optimize cold starts |
| Edge function timeouts | Move heavy processing to background jobs |
| Large static assets | Use Vercel's built-in CDN and image optimization |

### Redis

| Trigger | Action |
|---------|--------|
| > 10k requests/day (free tier) | Upgrade Upstash plan |
| > 1000 concurrent users | Increase rate limit window or implement request coalescing |

---

## Troubleshooting Common Issues

### Issue: Login redirects to blank page
**Cause:** Supabase redirect URL not configured  
**Fix:** Add `https://your-app.vercel.app/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs

### Issue: `NEXT_PUBLIC_SUPABASE_URL` environment variable not found
**Cause:** Environment variable not set in Vercel or incorrect variable name  
**Fix:** Check Vercel → Settings → Environment Variables. Ensure variable names match exactly (case-sensitive).

### Issue: Stripe webhook returns 400 Invalid Signature
**Cause:** `STRIPE_WEBHOOK_SECRET` mismatch — usually from copying the webhook secret before it was finalized, or using a test key in production  
**Fix:** In Stripe → Webhooks, reveal the endpoint's signing secret and update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables. Redeploy.

### Issue: OpenAI API calls timing out
**Cause:** Long review content + synchronous processing exceeding Vercel's 30-second function timeout  
**Fix:** Enable streaming responses. For very long reviews, implement async processing via Supabase Edge Functions.

### Issue: RLS policy blocking queries
**Cause:** Missing `org_id` in JWT claims — custom JWT hook not configured  
**Fix:** Ensure the `custom_access_token_hook` function is created in Supabase and enabled in Authentication → Hooks. Have users log out and back in to refresh their JWT.

### Issue: Cron jobs not running
**Cause:** `vercel.json` cron configuration not deployed, or `CRON_SECRET` mismatch  
**Fix:** Verify `vercel.json` is in the repository root. Check Vercel → Settings → Cron Jobs to confirm jobs are registered. Verify `CRON_SECRET` matches the `Authorization: Bearer` header your cron endpoints expect.

### Issue: Build fails with "Module not found"
**Cause:** Missing dependency or incorrect import path  
**Fix:** Run `npm install` locally and verify all imports. Check that `package.json` includes all required dependencies with correct versions.

### Issue: Team health scores not updating
**Cause:** Cron job failing silently  
**Fix:** Check Sentry for errors from `/api/cron/team-health`. Verify the cron endpoint returns 200 when called manually with the correct `CRON_SECRET`.

---

## Health Check Endpoints

Use these endpoints to verify deployment health:

```bash
# Application health
curl https://your-app.vercel.app/api/health

# Cron job manual trigger (for testing)
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://your-app.vercel.app/api/cron/team-health

# Stripe webhook test (use Stripe CLI)
stripe listen --forward-to https://your-app.vercel.app/api/billing/webhook
```

---

## Rollback Procedure

If a deployment causes issues:

1. Navigate to **Vercel → Deployments**
2. Find the last known good deployment
3. Click **...** → **Promote to Production**
4. Verify the rollback restores correct behavior
5. Investigate the failed deployment's build logs and Sentry errors before re-deploying

---

*Deployment guide maintained by the Aurora Rayes LLC engineering team.*