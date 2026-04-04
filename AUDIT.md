# AUDIT.md — TalentPulse Security & Compliance Audit Checklist

## 1. Row Level Security (RLS) Enforcement

Verify in Supabase SQL editor for each table:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- rowsecurity must be TRUE for all 9 tables
```

**Tables requiring RLS:** orgs, users, departments, employees, okrs, reviews, feedback_360, coaching_logs, team_health

**Policy verification:**
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```
Each table must have org-isolation policy using `get_user_org_id()` helper.

---

## 2. RBAC Permission Matrix

| Action | admin | manager | employee |
|--------|-------|---------|----------|
| View employees | ✅ | ✅ | ✅ (own org) |
| Create/edit employees | ✅ | ✅ | ❌ |
| Delete employees | ✅ | ❌ | ❌ |
| Create reviews | ✅ | ✅ | ❌ |
| View all reviews | ✅ | ✅ | ❌ |
| Generate AI coaching | ✅ | ✅ | ❌ |
| Manage billing | ✅ | ❌ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| View team health | ✅ | ✅ | ❌ |

Role checks enforced in API routes via `userData.role` comparison. Never trust client-supplied role claims.

---

## 3. API Authentication

Every API route must:
- [ ] Call `supabase.auth.getUser()` and check for error/null user
- [ ] Return 401 if unauthenticated
- [ ] Verify `userData.role` for restricted operations
- [ ] Apply rate limiting via Upstash before DB queries
- [ ] Capture exceptions with `Sentry.captureException()`

**Verify with:** `grep -r "auth.getUser" src/app/api/` — must appear in every route file.

---

## 4. Stripe Webhook Security

- [ ] Webhook endpoint: `POST /api/billing/webhook`
- [ ] Signature verified with `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`
- [ ] Raw body used (not parsed JSON) — Next.js route handler reads `request.text()`
- [ ] Returns 400 if signature invalid
- [ ] STRIPE_WEBHOOK_SECRET stored in env, never committed
- [ ] Webhook events subscribed: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted

---

## 5. OpenAI API Security

- [ ] `OPENAI_API_KEY` stored in server-side env only (never `NEXT_PUBLIC_`)
- [ ] Review text truncated before sending (max 2000 chars to avoid token abuse)
- [ ] No employee PII (names, IDs) included in OpenAI prompts
- [ ] Rate limiting on AI endpoints: 10 requests/minute for POST /api/coaching
- [ ] OpenAI errors caught and fallback returned; never expose API errors to client

---

## 6. Rate Limiting Coverage

Using Upstash Redis sliding window (100 req/min standard, 10 req/min strict):

| Endpoint | Limit |
|----------|-------|
| GET /api/employees | 100/min |
| POST /api/employees | 100/min |
| POST /api/reviews | 100/min |
| POST /api/coaching | 10/min (strict) |
| POST /api/billing/create-checkout | 100/min |
| POST /api/auth/invite | 100/min |

**Verify:** `grep -r "rateLimit" src/app/api/` — must appear in every route handler.

---

## 7. GDPR / CCPA Compliance Checklist

- [ ] **Data inventory:** all employee PII documented (name, email, department, review text, feedback)
- [ ] **Lawful basis:** performance management = legitimate interest; document in DPA
- [ ] **Right to erasure:** DELETE /api/employees/[id] cascades to all related records via FK constraints
- [ ] **Data portability:** CSV export available (Pro plan)
- [ ] **Data minimization:** only collect fields necessary for performance management
- [ ] **Third-party processors:** Supabase (data storage), OpenAI (text analysis), Stripe (billing), Sentry (error logs — ensure PII scrubbing)
- [ ] **Sentry PII scrubbing:** `beforeSend` hook in sentry.client.config.ts — verify no PII in event payloads
- [ ] **Data residency:** Supabase project region selected per customer requirement
- [ ] **DPA agreements:** signed with Supabase, OpenAI, Stripe, Sentry, Upstash

---

## 8. SOC 2 Type II Readiness

### CC6 — Logical and Physical Access Controls
- [x] MFA enforced on Supabase dashboard
- [x] RLS prevents cross-tenant data access
- [x] API keys rotated quarterly
- [ ] Access reviews conducted quarterly

### CC7 — System Operations
- [x] Sentry alerting on error rate spikes
- [x] Upstash Redis monitoring for rate limit anomalies
- [ ] Uptime monitoring (add Checkly or Better Uptime)

### CC8 — Change Management
- [x] All changes via PR with required review
- [x] CI pipeline: lint → typecheck → test → build required to pass
- [x] Conventional commits enforced

### CC9 — Risk Mitigation
- [x] Stripe webhook signature verification
- [x] OpenAI API key server-side only
- [x] No secrets in source code (enforced via .gitignore + secret scanning)

---

## 9. PII Data Inventory

| Field | Table | Classification | Retention |
|-------|-------|---------------|-----------|
| name | employees | PII | Until account deletion |
| email | users | PII | Until account deletion |
| review text | reviews | Sensitive | 3 years default |
| feedback content | feedback_360 | Sensitive | 3 years default |
| coaching suggestions | coaching_logs | Internal | 1 year default |

---

## 10. Dependency Vulnerability Scanning

Run before each release:
```bash
npm audit --audit-level=high
```
- [ ] Zero high/critical vulnerabilities
- [ ] Dependabot alerts enabled on GitHub repo
- [ ] `npm audit` runs in CI pipeline

---

## 11. Security Headers

Configured in `vercel.json` for all `/api/*` routes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

For production, add via Next.js `headers()` config:
- `Content-Security-Policy`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`