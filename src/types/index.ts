export type Plan = 'starter' | 'pro' | 'enterprise';
export type UserRole = 'admin' | 'manager' | 'employee';
export type OKRStatus = 'on_track' | 'at_risk' | 'missed' | 'achieved';

export interface Org {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Employee {
  id: string;
  org_id: string;
  user_id: string | null;
  name: string;
  department: string;
  manager_id: string | null;
  start_date: string;
  created_at: string;
}

export interface OKR {
  id: string;
  org_id: string;
  employee_id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  due_date: string;
  status: OKRStatus;
  created_at: string;
}

export interface Review {
  id: string;
  org_id: string;
  employee_id: string;
  reviewer_id: string;
  period: string;
  score: number;
  strengths: string;
  improvements: string;
  ai_bias_flag: boolean;
  created_at: string;
}

export interface Feedback360 {
  id: string;
  org_id: string;
  employee_id: string;
  from_user_id: string;
  content: string;
  sentiment: number;
  created_at: string;
}

export interface CoachingLog {
  id: string;
  org_id: string;
  employee_id: string;
  manager_id: string;
  suggestion_md: string;
  ai_generated: boolean;
  acknowledged: boolean;
  created_at: string;
}

export interface TeamHealth {
  id: string;
  org_id: string;
  team_id: string;
  score: number;
  factors: Record<string, number>;
  measured_at: string;
}

export interface Department {
  id: string;
  org_id: string;
  name: string;
  head_id: string | null;
  created_at: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface BiasAnalysis {
  hasBias: boolean;
  biasTypes: string[];
  confidence: number;
  explanation: string;
  suggestedRevision: string | null;
}

export interface SentimentResult {
  score: number;
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
}