export type UserRole = 'admin' | 'manager' | 'employee';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  profile_id: string;
  org_id: string;
  department: string;
  job_title: string;
  manager_id: string | null;
  hire_date: string;
  status: 'active' | 'inactive';
  created_at: string;
  profile?: Profile;
  manager?: Profile;
}

export interface KeyResult {
  id: string;
  title: string;
  progress: number;
  target: number;
  current: number;
  unit: string;
}

export interface OKR {
  id: string;
  employee_id: string;
  org_id: string;
  title: string;
  description: string | null;
  key_results: KeyResult[];
  progress: number;
  status: 'on_track' | 'at_risk' | 'completed' | 'cancelled';
  due_date: string;
  created_at: string;
  updated_at: string;
  employee?: Profile;
}

export interface BiasFlag {
  type: string;
  text: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PerformanceReview {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  org_id: string;
  cycle: string;
  overall_score: number;
  strengths: string;
  improvements: string;
  goals: string;
  bias_flags: BiasFlag[];
  submitted_at: string | null;
  created_at: string;
  reviewer?: Profile;
  reviewee?: Profile;
}

export interface PeerFeedback {
  id: string;
  giver_id: string;
  receiver_id: string;
  org_id: string;
  content: string;
  sentiment_score: number | null;
  sentiment_label: 'positive' | 'neutral' | 'negative' | null;
  created_at: string;
  giver?: Profile;
  receiver?: Profile;
}

export interface CoachingSuggestion {
  id: string;
  manager_id: string;
  employee_id: string;
  org_id: string;
  week_start: string;
  suggestions: string[];
  context_summary: string;
  created_at: string;
  employee?: Profile;
}

export interface TeamHealthScore {
  id: string;
  org_id: string;
  manager_id: string | null;
  score: number;
  engagement_score: number;
  okr_attainment: number;
  feedback_sentiment: number;
  calculated_at: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan_tier: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}