# TalentPulse API Reference

## Overview

### Base URL
```
https://talentpulse.vercel.app/api
```

### Authentication
All endpoints require a valid Supabase JWT token passed as a Bearer token in the `Authorization` header:
```
Authorization: Bearer <supabase_access_token>
```

### Rate Limiting
Rate limits are enforced per endpoint per user using a sliding-window algorithm (Upstash Redis):

| Endpoint group | Limit |
|---|---|
| `/api/employees` | 100 req / 60s |
| `/api/okrs` | 100 req / 60s |
| `/api/reviews` | 50 req / 60s |
| `/api/feedback` | 100 req / 60s |
| `/api/coaching` | 20 req / 60s |
| `/api/team-health` | 30 req / 60s |
| `/api/billing/*` | 20 req / 60s |

### Response Format
All responses return JSON. Successful list responses follow:
```json
{
  "data": [...],
  "count": 42,
  "page": 1,
  "limit": 20
}
```
Errors follow:
```json
{
  "error": "Human-readable error message"
}
```

---

## Employees

### GET /api/employees
Returns a paginated list of employees in the authenticated user's organization.

**Query Parameters**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `department` | string | — | Filter by department |
| `status` | string | — | Filter by status (`active` / `inactive`) |

**Response**
```json
{
  "data": [
    {
      "id": "uuid",
      "profile_id": "uuid",
      "job_title": "Software Engineer",
      "department": "Engineering",
      "hire_date": "2022-03-01",
      "status": "active"
    }
  ],
  "count": 34,
  "page": 1,
  "limit": 20
}
```

```bash
curl -X GET "https://talentpulse.vercel.app/api/employees?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

### POST /api/employees
Creates a new employee record.

**Request Body**
```json
{
  "profile_id": "uuid",
  "job_title": "Designer",
  "department": "Design",
  "manager_id": "uuid",
  "hire_date": "2024-01-15"
}
```

**Response** `201 Created`
```json
{
  "data": { "id": "uuid", "profile_id": "uuid", ... }
}
```

```bash
curl -X POST "https://talentpulse.vercel.app/api/employees" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"profile_id":"uuid","job_title":"Designer","department":"Design"}'
```

---

### GET /api/employees/[id]
Returns a single employee by ID.

```bash
curl -X GET "https://talentpulse.vercel.app/api/employees/emp-uuid" \
  -H "Authorization: Bearer <token>"
```

---

### PATCH /api/employees/[id]
Updates an employee record.

**Request Body** (partial update)
```json
{
  "job_title": "Senior Engineer",
  "department": "Platform"
}
```

---

### DELETE /api/employees/[id]
Soft-deletes an employee (sets `status` to `inactive`).

---

## OKRs

### GET /api/okrs
Returns OKRs for the authenticated user or filtered by `employee_id`.

**Query Parameters**
| Param | Type | Description |
|---|---|---|
| `employee_id` | uuid | Filter OKRs for a specific employee |
| `quarter` | string | e.g. `Q1` |
| `year` | number | e.g. `2024` |
| `status` | string | `draft`, `on_track`, `at_risk`, `completed` |

```bash
curl "https://talentpulse.vercel.app/api/okrs?employee_id=uuid&quarter=Q1&year=2024" \
  -H "Authorization: Bearer <token>"
```

---

### POST /api/okrs
Creates a new OKR with optional key results.

**Request Body**
```json
{
  "employee_id": "uuid",
  "title": "Improve system reliability",
  "description": "Reduce P1 incidents by 50%",
  "quarter": "Q2",
  "year": 2024,
  "key_results": [
    { "title": "Reduce MTTR to < 30 min", "target_value": 30, "unit": "minutes" },
    { "title": "Achieve 99.9% uptime", "target_value": 99.9, "unit": "%" }
  ]
}
```

**Response** `201 Created`
```json
{
  "data": { "id": "uuid", "title": "...", "key_results": [...] }
}
```

---

### GET /api/okrs/[id]
Returns a single OKR including key results.

---

### PATCH /api/okrs/[id]
Updates an OKR. Accepts partial updates including `progress` and `status`.

---

### DELETE /api/okrs/[id]
Deletes an OKR and its key results (cascade).

---

## Performance Reviews

### GET /api/reviews
Returns performance reviews. Managers see all reviews for their team; employees see their own.

**Query Parameters**
| Param | Type | Description |
|---|---|---|
| `reviewee_id` | uuid | Filter by reviewee |
| `cycle` | string | e.g. `Q4 2024` |

```bash
curl "https://talentpulse.vercel.app/api/reviews?cycle=Q4+2024" \
  -H "Authorization: Bearer <token>"
```

---

### POST /api/reviews
Submits a performance review. AI bias detection runs automatically.

**Request Body**
```json
{
  "reviewee_id": "uuid",
  "cycle": "Q4 2024",
  "overall_score": 4,
  "strengths": "Excellent communicator and consistent delivery.",
  "improvements": "Could take more ownership of cross-team initiatives.",
  "comments": "Strong quarter overall."
}
```

**Response** `201 Created`
```json
{
  "data": { "id": "uuid", ... },
  "bias": {
    "bias_free": true,
    "flags": [],
    "overall_assessment": "No bias detected."
  }
}
```

```bash
curl -X POST "https://talentpulse.vercel.app/api/reviews" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reviewee_id":"uuid","cycle":"Q4 2024","overall_score":4,"strengths":"...","improvements":"..."}'
```

---

### GET /api/reviews/[id]
Returns a single review including bias flags.

---

### PATCH /api/reviews/[id]
Updates a review (only before submission).

---

## Peer Feedback

### GET /api/feedback
Returns peer feedback for the authenticated user or by `recipient_id`.

**Query Parameters**
| Param | Type | Description |
|---|---|---|
| `recipient_id` | uuid | Filter feedback for a specific recipient |

```bash
curl "https://talentpulse.vercel.app/api/feedback?recipient_id=uuid" \
  -H "Authorization: Bearer <token>"
```

---

### POST /api/feedback
Submits peer feedback. Sentiment analysis runs automatically.

**Request Body**
```json
{
  "recipient_id": "uuid",
  "content": "John consistently helps unblock the team and shares knowledge generously.",
  "is_anonymous": false
}
```

**Response** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "sentiment_score": 0.92,
    "sentiment_label": "positive"
  }
}
```

---

## Coaching

### GET /api/coaching
Returns existing coaching suggestions for the authenticated user or a specified employee.

```bash
curl "https://talentpulse.vercel.app/api/coaching?employee_id=uuid" \
  -H "Authorization: Bearer <token>"
```

---

### POST /api/coaching
Generates new AI coaching suggestions for an employee based on their reviews, OKRs, and feedback.

**Request Body**
```json
{
  "employee_id": "uuid"
}
```

**Response** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "suggestions": [
      "Schedule weekly 1:1s to review OKR progress.",
      "Pair with a senior engineer on architectural decisions.",
      "Consider leading a cross-functional project next quarter."
    ]
  }
}
```

```bash
curl -X POST "https://talentpulse.vercel.app/api/coaching" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"uuid"}'
```

---

## Team Health

### GET /api/team-health
Returns the latest team health score for the authenticated user's organization.

```bash
curl "https://talentpulse.vercel.app/api/team-health" \
  -H "Authorization: Bearer <token>"
```

**Response**
```json
{
  "data": {
    "score": 74,
    "engagement_score": 80,
    "okr_attainment": 68,
    "feedback_sentiment": 75,
    "calculated_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### POST /api/team-health
Triggers a recalculation of the team health score.

```bash
curl -X POST "https://talentpulse.vercel.app/api/team-health" \
  -H "Authorization: Bearer <token>"
```

---

## Billing

### POST /api/billing/create-checkout
Creates a Stripe Checkout session.

**Request Body**
```json
{
  "priceId": "price_xxx",
  "billingPeriod": "monthly"
}
```

**Response**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

```bash
curl -X POST "https://talentpulse.vercel.app/api/billing/create-checkout" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_starter_monthly","billingPeriod":"monthly"}'
```

---

### POST /api/billing/portal
Creates a Stripe Customer Portal session for managing subscriptions.

**Response**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

### POST /api/billing/webhook
Stripe webhook endpoint. Requires `Stripe-Signature` header. Not called directly by clients.

---

## Error Codes

| HTTP Status | Error | Description |
|---|---|---|
| `400` | Bad Request | Invalid or missing request parameters |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | Insufficient permissions for this resource |
| `404` | Not Found | Resource does not exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |

---

## Notes
- All timestamps are returned in ISO 8601 UTC format.
- UUIDs are v4.
- The `bias` field in review responses is computed server-side using OpenAI GPT-4o and is never cached.