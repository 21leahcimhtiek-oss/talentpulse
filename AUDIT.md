# TalentPulse Security and Compliance Audit Checklist

> Version 1.0 | Aurora Rayes LLC | Review quarterly or after any major release.

---

## 1. Row Level Security (RLS) Enforcement

### Tables Requiring RLS Verification

| Table | RLS Policy Summary | Verified |
|---|---|---|
| profiles | Users read/update own row; admins read all | [ ] |
| employees | Managers see own team; admins see all org | [ ] |
| okrs | Employee owns their OKRs; manager reads team; admin reads all | [ ] |
| performance_reviews | Reviewer and reviewee access own rows; admin reads all | [ ] |
| peer_feedback | Sender and recipient access own rows; admin reads all | [ ] |
| coaching_suggestions | Manager reads own suggestions; admin reads all | [ ] |
| team_health_scores | Managers read own team scores; admin reads all | [ ] |
| subscriptions | Org admin reads own subscription; service role manages | [ ] |
| audit_logs | Admin read-only; service role writes only | [ ] |

### RLS Verification Procedure

1. Connect to Supabase SQL editor with each role (anon, employee, manager, admin)
2. Cross-tenant read test: run SELECT * FROM employees and confirm only authorized rows are returned
3. Cross-tenant write test: attempt INSERT with another org user's employee_id and confirm RLS violation (error 42501)
4. Confirm service role client is only instantiated in server-side code under src/lib/supabase/server.ts
5. Run the following to confirm RLS is enabled on all public tables (all rows must show rowsecurity = true):
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

---

## 2. RBAC Permission Matrix

| Action | Employee | Manager | Admin |
|---|---|---|---|
| View own profile | Yes | Yes | Yes |
| View team member profiles | No | Yes | Yes |
| View all profiles org-wide | No | No | Yes |
| Create and update own OKRs | Yes | Yes | Yes |
| View direct report OKRs | No | Yes | Yes |
| View all OKRs org-wide | No | No | Yes |
| Submit a performance review | Yes | Yes | Yes |
| View reviews for own direct reports | No | Yes | Yes |
| View all reviews org-wide | No | No | Yes |
| Submit peer feedback | Yes | Yes | Yes |
| View team coaching suggestions | No | Yes | Yes |
| View team health scores | No | Yes | Yes |
| Invite new employees | No | No | Yes |
| Manage subscription and billing | No | No | Yes |
| View audit logs | No | No | Yes |
| Delete employee accounts | No | No | Yes |
| Modify org settings | No | No | Yes |

### RBAC Verification Procedure

1. Create test accounts for each role
2. Test each action in the matrix and confirm expected allow or deny for every row
3. Verify JWT claims include role and org_id custom fields set by Supabase Auth hook
4. Confirm all API route middleware checks role before processing business logic
5. Confirm there is no client-side role-gating that is not also enforced server-side

---

## 3. API Authentication Checklist

- [ ] All /api/* routes extract and validate Supabase session token before executing any logic
- [ ] SUPABASE_SERVICE_ROLE_KEY is never referenced in any client-side code or NEXT_PUBLIC_ env vars
- [ ] Auth check is the first operation in every handler (fail-fast pattern)
- [ ] Unauthenticated requests return 401 Unauthorized, never a 200 with empty data
- [ ] Requests authenticated but with insufficient role return 403 Forbidden
- [ ] All sensitive API responses include Cache-Control: no-store header

### Verification Procedure

1. Call every API route without an Authorization header and confirm 401 response
2. Call with a valid but wrong-role token and confirm 403 response
3. Search: grep -r "SUPABASE_SERVICE_ROLE_KEY" src/ and confirm zero results in client components
4. Search: grep -r "createBrowserClient" src/app/api/ and confirm zero results in API routes

---

## 4. Stripe Webhook Signature Verification

- [ ] Webhook handler at /api/webhooks/stripe calls stripe.webhooks.constructEvent(rawBody, signature, secret)
- [ ] Raw body (not parsed JSON) is passed to constructEvent
- [ ] STRIPE_WEBHOOK_SECRET is set via environment variable and never hardcoded
- [ ] Webhook handler returns 200 immediately after signature verification
- [ ] Subscription status updates are idempotent with duplicate event.id detection
- [ ] Failed webhook processing is logged to Sentry for retry
- [ ] Subscription status is always verified server-side before granting access to paid features

### Verification Procedure

1. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe
2. Trigger: stripe trigger customer.subscription.updated
3. Confirm 200 response and database subscription status update
4. Modify request body and re-send; confirm 400 response for signature mismatch

---

## 5. OpenAI API Key Security

- [ ] OPENAI_API_KEY is server-side only, no NEXT_PUBLIC_ prefix, never in client code
- [ ] Key is not logged in application logs, error messages, or Sentry events
- [ ] Key is rotated immediately on any suspected exposure
- [ ] Monthly usage limit set in OpenAI dashboard to cap runaway spend
- [ ] Prompt injection mitigations: user-supplied content wrapped in clear delimiters, never injected into system prompt
- [ ] AI responses are sanitized and validated with Zod before storing in database

---

## 6. Rate Limiting Coverage (Upstash Redis)

| Endpoint | Limit | Window | Scope | Verified |
|---|---|---|---|---|
| /api/auth/signup | 5 requests | 1 hour | Per IP | [ ] |
| /api/auth/login | 10 requests | 1 minute | Per IP | [ ] |
| /api/ai/bias-detect | 20 requests | 1 hour | Per user | [ ] |
| /api/ai/coaching | 5 requests | 1 hour | Per user | [ ] |
| /api/reviews POST | 50 requests | 1 hour | Per org | [ ] |
| /api/okrs POST and PATCH | 100 requests | 1 hour | Per org | [ ] |
| /api/feedback POST | 100 requests | 1 hour | Per org | [ ] |
| /api/webhooks/stripe | Unlimited (Stripe IPs allowlisted) | n/a | n/a | [ ] |

### Verification Procedure

1. Exceed rate limit threshold on each endpoint and confirm 429 Too Many Requests response
2. Confirm Retry-After header is included in all 429 responses
3. Verify rate limit keys are scoped per user or org, never global
4. Test rate limit window reset and confirm requests succeed again after window expires

---

## 7. GDPR and CCPA Compliance Checklist

### Data Subject Rights

- [ ] Right to Access: Users can export all personal data as JSON from the dashboard settings page
- [ ] Right to Erasure: Admins can delete employee records with cascading delete across all related tables
- [ ] Right to Portability: Data exportable in JSON and CSV format from the UI
- [ ] Right to Rectification: Users can update their own profile data (name, email, avatar)
- [ ] Right to Object: Users can opt out of AI analysis features via profile settings

### Consent and Notices

- [ ] Privacy Policy published and linked from app footer and sign-up page
- [ ] Terms of Service linked from sign-up and billing pages
- [ ] Cookie consent banner implemented if any analytics cookies are set
- [ ] Data Processing Agreement (DPA) available for Enterprise customers on request
- [ ] Employees informed during onboarding that AI analysis is applied to their performance data

### Data Minimization

- [ ] Only data required for product functionality is collected
- [ ] PII fields documented in Section 9 of this document
- [ ] Third-party analytics only activated with explicit user consent

---

## 8. SOC2 Type II Control Mapping

| SOC2 Criteria | Control Description | Implementation |
|---|---|---|
| CC1.1 COSO Principles | Security policy documented | AUDIT.md plus internal security policy |
| CC6.1 Logical Access Controls | Authentication required for all data access | Supabase Auth plus JWT validation |
| CC6.2 Access Provisioning | Least-privilege access by role | RLS policies plus RBAC middleware |
| CC6.3 Access Removal | Offboarding removes access immediately | Admin delete plus session revocation via Supabase |
| CC7.1 System Monitoring | Errors and anomalies tracked | Sentry error tracking plus performance monitoring |
| CC7.2 Anomaly Detection | Unusual traffic detected and throttled | Upstash Redis rate limiting |
| CC8.1 Change Management | All changes reviewed before production | GitHub Actions CI/CD plus PR approval required |
| CC9.1 Risk Assessment | Dependencies scanned for vulnerabilities | npm audit in CI pipeline plus Dependabot |
| A1.1 Availability | System uptime monitored | Vercel SLA plus Sentry uptime alerts |
| PI1.1 Processing Integrity | All inputs validated before processing | Zod schema validation on all API routes |
| C1.1 Confidentiality | Data encrypted in transit and at rest | Supabase TLS in-transit plus AES-256 at-rest |
| P1.1 Privacy | GDPR and CCPA compliance controls | Section 7 of this document |

---

## 9. PII Data Inventory

| Field | Table | Classification | Retention Period | Notes |
|---|---|---|---|---|
| full_name | profiles | PII | Until deletion request | |
| email | profiles | PII | Until deletion request | Used for auth and notifications |
| avatar_url | profiles | PII | Until deletion request | Supabase Storage URL |
| department | employees | Internal | Until deletion request | |
| manager_id | employees | Internal | Until deletion request | FK to profiles |
| review_text | performance_reviews | Sensitive PII | 7 years | Employment law requirement |
| feedback_text | peer_feedback | Sensitive PII | 7 years | Employment law requirement |
| coaching_content | coaching_suggestions | Internal | 2 years | AI-generated, not user PII |
| health_score | team_health_scores | Internal | 2 years | Aggregate metric |
| stripe_customer_id | subscriptions | Financial reference | 7 years | Tax and financial compliance |

### Data Retention Enforcement

- [ ] Supabase scheduled function deletes coaching_suggestions older than 2 years
- [ ] Supabase scheduled function deletes team_health_scores older than 2 years
- [ ] Performance reviews and feedback retained for 7 years per employment law
- [ ] Billing records retained for 7 years per tax compliance
- [ ] All data deletions written to audit_logs table with timestamp and actor

---

## 10. Dependency Vulnerability Scanning

Run before every release and in CI on every PR:
  npm audit
  npm audit fix  (never use --force without manual review)

Set minimum severity threshold in .npmrc:
  audit-level=high

### CI Pipeline Requirements

- [ ] npm audit --audit-level=high in GitHub Actions on every PR, failing the build on high or critical severity
- [ ] GitHub Dependabot configured in .github/dependabot.yml for automated security PRs
- [ ] Dependabot security PRs reviewed and merged within 7 days

---

## 11. Security Headers

All API responses must include:

| Header | Required Value | Purpose |
|---|---|---|
| X-Content-Type-Options | nosniff | Prevent MIME-type sniffing attacks |
| X-Frame-Options | DENY | Prevent clickjacking via iframes |
| X-XSS-Protection | 1; mode=block | Legacy browser XSS filter |
| Content-Security-Policy | Strict whitelist policy | Prevent XSS and data injection |
| Strict-Transport-Security | max-age=63072000; includeSubDomains | Force HTTPS for 2 years |
| Referrer-Policy | strict-origin-when-cross-origin | Limit referrer header leakage |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Disable unused browser APIs |

---

## 12. Environment Variable Security

- [ ] All secrets stored in Vercel project environment variables, never in source code
- [ ] .env.local is in .gitignore and has never been committed
- [ ] No secrets in NEXT_PUBLIC_ variables except intentionally public keys
- [ ] NEXTAUTH_SECRET generated with openssl rand -base64 32
- [ ] Secret rotation procedure followed when any team member with access departs

### Secret Rotation Procedure

1. Generate new secret value
2. Update value in Vercel environment variables dashboard
3. Trigger a new deployment
4. Revoke old secret at source (OpenAI, Stripe, Supabase, Upstash dashboards)
5. Monitor Sentry for auth errors in the 30 minutes following rotation
6. Document rotation in security log with date and reason

---

## 13. Penetration Testing and Review Schedule

| Activity | Frequency | Owner |
|---|---|---|
| Automated dependency scan | Every PR | CI and Dependabot |
| Manual security review of new API routes | Every PR with new routes | Engineering lead |
| Full RLS policy audit | Quarterly | Engineering |
| External penetration test | Annually | Third-party firm |
| GDPR compliance review | Annually | Legal and Engineering |
| SOC2 audit prep review | Annually | Engineering and Ops |

---

Last reviewed: 2024-01-15 | Next review due: 2024-04-15