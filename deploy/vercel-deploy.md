# Deploying TalentPulse to Vercel

This guide walks you through a complete production deployment of TalentPulse.

---

## Prerequisites

Before you begin, make sure you have:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm 9+ (`npm --version`)
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] A [Supabase](https://supabase.com) account and project
- [ ] A [Stripe](https://stripe.com) account with products configured
- [ ] An [Upstash](https://upstash.com) Redis database
- [ ] An [OpenAI](https://platform.openai.com) API key
- [ ] A [Sentry](https://sentry.io) project (optional but recommended)

---

## Step 1: Clone and Prepare the Repo

```bash
git clone https://github.com/21leahcimhtiek-oss/talentpulse.git
cd talentpulse
npm install
```

Create a `.env.local` file in the project root (see Step 5 for all variables).

---

## Step 2: Set Up Supabase and Run Migrations

1. Create a new Supabase project at [supabase.com](https://supabase.com/dashboard).
2. Note your **Project URL** and **Anon Key** from Project Settings → API.
3. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
4. Link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
5. Run the migrations:
   ```bash
   supabase db push
   ```
   This applies `supabase/migrations/001_initial_schema.sql` and creates all tables, RLS policies, and triggers.

6. Verify in the Supabase dashboard (Table Editor) that all 11 tables are present.

---

## Step 3: Set Up Stripe Products

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products).
2. Create two products:
   - **TalentPulse Starter** — $79/month (monthly) and $790/year (annual)
   - **TalentPulse Pro** — $199/month (monthly) and $1990/year (annual)
3. Copy the **Price IDs** (format: `price_xxx`) for each product/period.
4. Note your **Secret Key** from Stripe Dashboard → Developers → API Keys.

---

## Step 4: Configure Upstash Redis

1. Create a new Redis database at [upstash.com](https://console.upstash.com).
2. Select **Regional** (not Global) for lower latency.
3. Copy the **REST URL** and **REST Token** from the database dashboard.

---

## Step 5: Set Environment Variables in Vercel

All environment variables must be added in Vercel Dashboard → Project → Settings → Environment Variables.

| Variable | Description | Where to Find |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public/anon key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (never expose client-side) | Supabase → Settings → API |
| `OPENAI_API_KEY` | OpenAI API key | platform.openai.com → API Keys |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe → Webhooks (after Step 7) |
| `STRIPE_STARTER_PRICE_ID` | Stripe Price ID for Starter plan | Stripe → Products |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro plan | Stripe → Products |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Upstash → Database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Upstash → Database → REST API |
| `NEXT_PUBLIC_APP_URL` | Your production URL | e.g. `https://talentpulse.vercel.app` |
| `SENTRY_DSN` | Sentry DSN for error tracking | Sentry → Project → Settings → DSN |

> ⚠️ Never commit `.env.local` to version control. It is already in `.gitignore`.

---

## Step 6: Deploy to Vercel

```bash
vercel --prod
```

Follow the CLI prompts:
1. Set up and deploy: **Y**
2. Which scope: select your Vercel account
3. Link to existing project or create new: **Create new**
4. Project name: `talentpulse`
5. Override settings: **N** (Next.js is auto-detected)

Vercel will build and deploy. Your production URL will be printed at the end (e.g., `https://talentpulse.vercel.app`).

---

## Step 7: Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks).
2. Click **Add endpoint**.
3. Set the URL to:
   ```
   https://your-domain.com/api/billing/webhook
   ```
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing Secret** (starts with `whsec_`).
6. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`.
7. Redeploy: `vercel --prod`

---

## Step 8: Verify Deployment Checklist

After deployment, verify the following:

- [ ] `https://your-domain.com` loads the landing/login page
- [ ] Supabase auth callback URL is set: Supabase → Auth → URL Configuration → Site URL = `https://your-domain.com`
- [ ] Supabase Redirect URLs includes `https://your-domain.com/**`
- [ ] Sign up flow works end-to-end (email confirmation, dashboard redirect)
- [ ] Stripe checkout loads (`/billing` → click Upgrade)
- [ ] Stripe webhook test: `stripe trigger checkout.session.completed`
- [ ] OKR creation works (check Supabase table editor)
- [ ] Review submission triggers bias detection (check response for `bias` field)
- [ ] Rate limiting is active (hammer an endpoint and confirm 429 response)
- [ ] Sentry receiving errors (trigger a 500 and confirm in Sentry dashboard)

---

## Troubleshooting

### Auth callback URL error after login
**Symptom:** Redirect loop or "redirect_uri not allowed" error.
**Fix:** In Supabase → Auth → URL Configuration, set **Site URL** to your production domain and add it to **Redirect URLs**.

### Missing environment variables at build time
**Symptom:** Build fails with `process.env.X is undefined`.
**Fix:** Verify all variables are set in Vercel Dashboard for the `Production` environment. Variables prefixed `NEXT_PUBLIC_` must also be available at build time.

### Stripe webhook signature verification failed
**Symptom:** `400` errors on `/api/billing/webhook`.
**Fix:** Ensure `STRIPE_WEBHOOK_SECRET` is the signing secret from the **Vercel endpoint** (not the Stripe CLI secret). The CLI uses a different secret for local testing.

### Supabase RLS blocking queries
**Symptom:** Empty data or `403` errors despite being logged in.
**Fix:** Check that your Supabase client is initialized with the correct cookies in server components. Use the server client (`createClient` from `@/lib/supabase/server`), not the browser client.

---

## Custom Domain Setup

1. In Vercel Dashboard → Project → Settings → Domains, add your custom domain.
2. Follow the DNS configuration instructions (CNAME or A record).
3. Vercel auto-provisions an SSL certificate via Let's Encrypt.
4. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to the new domain.
5. Update the Stripe webhook endpoint URL to the new domain.
6. Update Supabase → Auth → URL Configuration to the new domain.

---

## Monitoring with Sentry

1. Install Sentry SDK (already in `package.json`):
   ```bash
   npm install @sentry/nextjs
   ```
2. Initialize via CLI:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
3. Add `SENTRY_DSN` to Vercel environment variables.
4. Sentry will automatically capture unhandled errors in both client and server components.
5. Configure alerts in Sentry → Alerts → Create Alert Rule for high error rates.