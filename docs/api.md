# TalentPulse API Reference

> Aurora Rayes LLC — Developer Documentation  
> Base URL: `https://your-app.vercel.app`  
> Version: 1.0

---

## Overview

The TalentPulse REST API provides programmatic access to all platform features. All endpoints return JSON and follow RESTful conventions.

## Authentication

All API routes require a valid Supabase session. You may authenticate using either:

**Option 1 — Session Cookie (recommended for browser clients)**
Supabase automatically sets a `sb-<project>-auth-token` httpOnly cookie upon login. Include cookies in all requests.

**Option 2 — Bearer Token (for server-to-server or API clients)**
```
Authorization: Bearer <access_token>
```
Obtain your access token via `supabase.auth.getSession()`.

**Unauthenticated requests** return:
```json
{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```
HTTP Status: `401 Unauthorized`

---

## Rate Limiting

| Limit | Window | Scope |
|-------|--------|-------|
| 100 requests | 60 seconds | Per IP + User ID |

When the rate limit is exceeded:
- HTTP Status: `429 Too Many Requests`
- Response header: `Retry-After: 60`
- Response body:
```json
{ "error": { "code": "RATE_LIMITED", "message": "Rate limit exceeded. Try again in 60 seconds." } }
```

---

## Standard Error Format

All errors follow this consistent schema:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "field": "fieldName",
    "request_id": "req_abc123xyz"
  }
}
```

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | `BAD_REQUEST` | Malformed request |
| 401 | `UNAUTHORIZED` | Missing or invalid auth |
| 403 | `FORBIDDEN` | Authenticated but insufficient role |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Resource already exists |
| 422 | `VALIDATION_ERROR` | Schema validation failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all resources in their org |
| `manager` | Read/write employees they manage, all reviews/OKRs/feedback |
| `member` | Read own data, submit self-reviews, give feedback |

---

## Endpoints

---

### Employees

#### `GET /api/employees`

List all active employees in the authenticated user's organization.

**Authentication:** Required  
**Role:** `admin`, `manager`, `member`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `department` | string | No | Filter by department name |
| `status` | string | No | `active` \| `inactive` \| `on_leave` (default: `active`) |
| `page` | integer | No | Page number (default: `1`) |
| `limit` | integer | No | Results per page (default: `20`, max: `100`) |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "emp_01abc123",
      "full_name": "Jordan Rivera",
      "email": "jordan@acme.com",
      "department": "Engineering",
      "role": "Senior Engineer",
      "manager_id": "emp_02def456",
      "hire_date": "2022-03-15",
      "status": "active",
      "created_at": "2022-03-15T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "total_pages": 3
  }
}
```

---

#### `POST /api/employees`

Create a new employee record.

**Authentication:** Required  
**Role:** `admin`

**Request Body:**
```json
{
  "full_name": "Alex Chen",
  "email": "alex.chen@acme.com",
  "department": "Product",
  "role": "Product Manager",
  "manager_id": "emp_01abc123",
  "hire_date": "2025-02-01"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `full_name` | string | Yes | 2–100 characters |
| `email` | string | Yes | Valid email format, unique within org |
| `department` | string | No | Max 100 characters |
| `role` | string | No | Max 100 characters |
| `manager_id` | UUID | No | Must reference existing employee in org |
| `hire_date` | date | No | ISO 8601 format (YYYY-MM-DD) |

**Response `201 Created`:**
```json
{
  "data": {
    "id": "emp_03ghi789",
    "full_name": "Alex Chen",
    "email": "alex.chen@acme.com",
    "department": "Product",
    "role": "Product Manager",
    "manager_id": "emp_01abc123",
    "hire_date": "2025-02-01",
    "status": "active",
    "created_at": "2025-01-15T14:30:00Z"
  }
}
```

**Error Codes:**
- `422` — Validation error (missing required fields or invalid formats)
- `409` — Employee with this email already exists in the org

---

#### `GET /api/employees/[id]`

Retrieve a single employee by ID.

**Authentication:** Required  
**Role:** `admin`, `manager`, `member` (members can only retrieve their own record)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Employee identifier |

**Response `200 OK`:**
```json
{
  "data": {
    "id": "emp_01abc123",
    "full_name": "Jordan Rivera",
    "email": "jordan@acme.com",
    "department": "Engineering",
    "role": "Senior Engineer",
    "manager_id": "emp_02def456",
    "manager": {
      "id": "emp_02def456",
      "full_name": "Sam Torres"
    },
    "hire_date": "2022-03-15",
    "status": "active",
    "okr_count": 5,
    "review_count": 8,
    "created_at": "2022-03-15T09:00:00Z",
    "updated_at": "2025-01-10T11:00:00Z"
  }
}
```

**Error Codes:**
- `404` — Employee not found or belongs to a different org

---

#### `PATCH /api/employees/[id]`

Update an employee's information.

**Authentication:** Required  
**Role:** `admin`

**Request Body** (all fields optional):
```json
{
  "department": "Platform Engineering",
  "role": "Staff Engineer",
  "manager_id": "emp_05jkl012",
  "status": "on_leave"
}
```

**Response `200 OK`:** Returns updated employee object (same schema as GET).

**Error Codes:**
- `403` — Insufficient role
- `404` — Employee not found

---

#### `DELETE /api/employees/[id]`

Soft-delete an employee (sets status to `inactive`).

**Authentication:** Required  
**Role:** `admin`

**Response `200 OK`:**
```json
{ "message": "Employee deactivated successfully" }
```

**Error Codes:**
- `403` — Insufficient role
- `404` — Employee not found

---

### OKRs

#### `GET /api/okrs`

List OKRs for the organization.

**Authentication:** Required  
**Role:** `admin`, `manager`, `member`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employee_id` | UUID | No | Filter by employee |
| `quarter` | string | No | e.g., `Q1 2025` |
| `status` | string | No | `active` \| `completed` \| `cancelled` |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "okr_01abc123",
      "employee_id": "emp_01abc123",
      "employee_name": "Jordan Rivera",
      "title": "Improve API response time by 40%",
      "description": "Optimize database queries and implement caching",
      "target_value": 40,
      "current_value": 28,
      "unit": "%",
      "progress_percentage": 70,
      "due_date": "2025-03-31",
      "status": "active",
      "quarter": "Q1 2025",
      "created_at": "2025-01-02T09:00:00Z"
    }
  ],
  "summary": {
    "total": 24,
    "on_track": 18,
    "at_risk": 4,
    "completed": 2
  }
}
```

---

#### `POST /api/okrs`

Create a new OKR.

**Authentication:** Required  
**Role:** `admin`, `manager`

**Request Body:**
```json
{
  "employee_id": "emp_01abc123",
  "title": "Launch new onboarding flow",
  "description": "Design and ship redesigned onboarding reducing drop-off by 20%",
  "target_value": 20,
  "current_value": 0,
  "unit": "%",
  "due_date": "2025-03-31",
  "quarter": "Q1 2025"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `employee_id` | UUID | Yes | Must exist in org |
| `title` | string | Yes | 5–200 characters |
| `target_value` | number | Yes | Positive number |
| `unit` | string | No | Max 20 characters |
| `due_date` | date | No | Future date |
| `quarter` | string | No | e.g., `Q1 2025` |

**Response `201 Created`:** Returns created OKR object.

---

#### `GET /api/okrs/[id]`

Retrieve a single OKR with full update history.

**Response `200 OK`:**
```json
{
  "data": {
    "id": "okr_01abc123",
    "title": "Improve API response time by 40%",
    "current_value": 28,
    "target_value": 40,
    "updates": [
      {
        "value": 10,
        "note": "Optimized N+1 queries in employee endpoint",
        "updated_at": "2025-01-10T14:00:00Z"
      },
      {
        "value": 28,
        "note": "Implemented Redis caching layer",
        "updated_at": "2025-01-20T10:30:00Z"
      }
    ]
  }
}
```

---

#### `PATCH /api/okrs/[id]`

Update an OKR's progress or metadata.

**Request Body:**
```json
{
  "current_value": 35,
  "update_note": "Completed query optimization sprint",
  "status": "active"
}
```

**Response `200 OK`:** Returns updated OKR object.

---

#### `DELETE /api/okrs/[id]`

Cancel an OKR (sets status to `cancelled`).

**Role:** `admin`  
**Response `200 OK`:** `{ "message": "OKR cancelled" }`

---

### Performance Reviews

#### `GET /api/reviews`

List performance reviews.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `employee_id` | UUID | Filter by subject employee |
| `status` | string | `draft` \| `submitted` \| `acknowledged` |
| `review_type` | string | `self` \| `peer` \| `manager` \| `360` |
| `period` | string | e.g., `Q1 2025` |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "rev_01abc123",
      "employee_id": "emp_01abc123",
      "employee_name": "Jordan Rivera",
      "reviewer_id": "prof_01abc123",
      "reviewer_name": "Sam Torres",
      "review_type": "manager",
      "period": "Q4 2024",
      "rating": 4.2,
      "bias_score": 0.12,
      "bias_flags": ["recency_bias"],
      "status": "submitted",
      "submitted_at": "2025-01-05T16:00:00Z"
    }
  ]
}
```

---

#### `POST /api/reviews`

Submit a performance review. Triggers AI bias detection automatically.

**Authentication:** Required  
**Role:** `admin`, `manager`, `member` (for self-reviews)

**Request Body:**
```json
{
  "employee_id": "emp_01abc123",
  "review_type": "manager",
  "period": "Q1 2025",
  "content": "Jordan consistently delivers high-quality work. He showed exceptional leadership during the platform migration...",
  "rating": 4.5
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `employee_id` | UUID | Yes | Subject of review |
| `review_type` | string | Yes | `self` \| `peer` \| `manager` \| `360` |
| `content` | string | Yes | Min 100 characters |
| `rating` | number | Yes | 1.0 to 5.0 |
| `period` | string | No | Defaults to current quarter |

**Response `201 Created`:**
```json
{
  "data": {
    "id": "rev_02def456",
    "status": "submitted",
    "bias_score": 0.08,
    "bias_flags": [],
    "bias_analysis": {
      "summary": "No significant bias patterns detected.",
      "suggestions": []
    }
  }
}
```

> **Note:** AI bias analysis runs synchronously for reviews under 2000 tokens. For longer reviews, the response returns immediately with `bias_score: null` and analysis is completed asynchronously within 30 seconds.

---

#### `GET /api/reviews/[id]`

Retrieve a single review with full bias analysis.

**Response `200 OK`:** Returns complete review object including `bias_flags` array and `bias_analysis` object.

---

#### `DELETE /api/reviews/[id]`

Delete a draft review. Submitted reviews cannot be deleted.

**Role:** `admin`  
**Error Codes:**
- `409` — Cannot delete a submitted review

---

### Feedback

#### `GET /api/feedback`

Retrieve feedback for an employee.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `employee_id` | UUID | Required — subject employee |
| `sentiment` | string | `positive` \| `neutral` \| `negative` |
| `from_date` | date | Start of date range |
| `to_date` | date | End of date range |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "fb_01abc123",
      "content": "Jordan's communication during the sprint was outstanding.",
      "sentiment": "positive",
      "sentiment_score": 0.87,
      "tags": ["communication", "collaboration"],
      "is_anonymous": false,
      "giver_name": "Alex Chen",
      "created_at": "2025-01-12T10:00:00Z"
    }
  ],
  "sentiment_summary": {
    "positive": 14,
    "neutral": 5,
    "negative": 2,
    "average_score": 0.63
  }
}
```

---

#### `POST /api/feedback`

Submit feedback for an employee. Triggers sentiment analysis automatically.

**Request Body:**
```json
{
  "employee_id": "emp_01abc123",
  "content": "Jordan's technical documentation has dramatically improved this quarter. The new API guides saved our team hours.",
  "is_anonymous": false,
  "tags": ["technical_skills", "documentation"]
}
```

**Response `201 Created`:**
```json
{
  "data": {
    "id": "fb_02def456",
    "sentiment": "positive",
    "sentiment_score": 0.91,
    "tags": ["technical_skills", "documentation"],
    "created_at": "2025-01-15T09:30:00Z"
  }
}
```

---

### Coaching

#### `GET /api/coaching`

Retrieve coaching sessions for an employee.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `employee_id` | UUID | Required |
| `week_of` | date | Filter by week start date |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "cs_01abc123",
      "week_of": "2025-01-13",
      "suggestions": [
        {
          "category": "leadership",
          "priority": "high",
          "suggestion": "Schedule 1-on-1s with direct reports to discuss Q1 goals alignment.",
          "action_item": "Block 30 minutes each Friday for team check-ins.",
          "resources": [
            "Manager Effectiveness Playbook",
            "OKR Alignment Workshop (Loom)"
          ]
        },
        {
          "category": "technical",
          "priority": "medium",
          "suggestion": "Consider pair programming sessions to share caching patterns with the team.",
          "action_item": "Schedule one knowledge-sharing session before end of January.",
          "resources": []
        }
      ],
      "acknowledged_at": null,
      "created_at": "2025-01-13T08:00:00Z"
    }
  ]
}
```

---

#### `POST /api/coaching`

Manually trigger a coaching session generation for an employee (admins/managers only).

**Authentication:** Required  
**Role:** `admin`, `manager`

**Request Body:**
```json
{
  "employee_id": "emp_01abc123"
}
```

**Response `201 Created`:** Returns newly generated coaching session object.

> **Note:** Coaching sessions are also auto-generated weekly via cron job every Monday at 8am UTC.

---

### Team Health

#### `GET /api/team-health`

Retrieve team health scores for the organization.

**Authentication:** Required  
**Role:** `admin`, `manager`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `department` | string | Filter by department |
| `from_date` | date | Start of date range |
| `to_date` | date | End of date range |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "ths_01abc123",
      "department": "Engineering",
      "score": 78.5,
      "components": {
        "okr_completion_rate": 82,
        "feedback_sentiment_avg": 0.71,
        "review_submission_rate": 90,
        "coaching_acknowledgment_rate": 65
      },
      "computed_at": "2025-01-20",
      "trend": "+4.2",
      "trend_direction": "up"
    },
    {
      "id": "ths_02def456",
      "department": "Product",
      "score": 71.2,
      "components": {
        "okr_completion_rate": 68,
        "feedback_sentiment_avg": 0.58,
        "review_submission_rate": 85,
        "coaching_acknowledgment_rate": 72
      },
      "computed_at": "2025-01-20",
      "trend": "-1.8",
      "trend_direction": "down"
    }
  ],
  "org_score": 74.8,
  "computed_at": "2025-01-20"
}
```

**Score Breakdown:**

| Component | Weight | Description |
|-----------|--------|-------------|
| OKR completion rate | 30% | % of OKRs hitting ≥80% target |
| Feedback sentiment | 30% | Average sentiment score normalized 0–100 |
| Review submission rate | 20% | % of scheduled reviews submitted on time |
| Coaching acknowledgment | 20% | % of coaching suggestions acknowledged |

---

### Billing

#### `POST /api/billing/create-checkout`

Create a Stripe Checkout session to upgrade the organization's plan.

**Authentication:** Required  
**Role:** `admin`

**Request Body:**
```json
{
  "plan": "pro",
  "success_url": "https://your-app.vercel.app/settings/billing?success=true",
  "cancel_url": "https://your-app.vercel.app/settings/billing"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `plan` | string | Yes | `pro` \| `enterprise` |
| `success_url` | string | Yes | Full URL |
| `cancel_url` | string | Yes | Full URL |

**Response `200 OK`:**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_live_abc123..."
}
```

**Error Codes:**
- `403` — Only admins can manage billing
- `409` — Organization already on requested plan

---

#### `POST /api/billing/portal`

Create a Stripe Customer Portal session for subscription management.

**Authentication:** Required  
**Role:** `admin`

**Request Body:**
```json
{
  "return_url": "https://your-app.vercel.app/settings/billing"
}
```

**Response `200 OK`:**
```json
{
  "portal_url": "https://billing.stripe.com/session/ses_live_abc123..."
}
```

---

#### `POST /api/billing/webhook`

Stripe webhook endpoint for processing subscription events.

> **⚠️ Internal endpoint** — This endpoint is called by Stripe, not by your application code. Do not call it directly.

**Authentication:** Stripe webhook signature verification (`Stripe-Signature` header)

**Handled Events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update subscription record, update org plan |
| `customer.subscription.updated` | Sync subscription status and period dates |
| `customer.subscription.deleted` | Mark subscription cancelled, downgrade org to `starter` |

**Response `200 OK`:**
```json
{ "received": true }
```

**Error Codes:**
- `400` — Invalid Stripe signature (potential webhook forgery)

---

### Authentication

#### `POST /api/auth/invite`

Send an email invitation for a new team member to join the organization.

**Authentication:** Required  
**Role:** `admin`

**Request Body:**
```json
{
  "email": "newmember@acme.com",
  "role": "member",
  "full_name": "Casey Williams"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `email` | string | Yes | Valid email |
| `role` | string | Yes | `admin` \| `manager` \| `member` |
| `full_name` | string | No | Pre-fill display name |

**Response `200 OK`:**
```json
{
  "message": "Invitation sent to newmember@acme.com",
  "invite_id": "inv_01abc123",
  "expires_at": "2025-02-15T00:00:00Z"
}
```

**Error Codes:**
- `409` — User with this email is already a member of the organization
- `422` — Invalid email format or role value

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-01 | Initial API release |

---

*API documentation maintained by the Aurora Rayes LLC engineering team.*