-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================
-- TABLES
-- =====================

CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  head_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE departments ADD CONSTRAINT departments_head_id_fkey
  FOREIGN KEY (head_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE TABLE okrs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target NUMERIC(10,2) NOT NULL,
  current NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '%',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'missed', 'achieved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  score NUMERIC(3,1) NOT NULL CHECK (score >= 1 AND score <= 5),
  strengths TEXT NOT NULL DEFAULT '',
  improvements TEXT NOT NULL DEFAULT '',
  ai_bias_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback_360 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sentiment NUMERIC(4,3) NOT NULL DEFAULT 0 CHECK (sentiment >= -1 AND sentiment <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coaching_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suggestion_md TEXT NOT NULL,
  ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  factors JSONB NOT NULL DEFAULT '{}',
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_employees_org_id ON employees(org_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_okrs_employee_id ON okrs(employee_id);
CREATE INDEX idx_okrs_org_id ON okrs(org_id);
CREATE INDEX idx_okrs_status ON okrs(status);
CREATE INDEX idx_okrs_due_date ON okrs(due_date);
CREATE INDEX idx_reviews_employee_id ON reviews(employee_id);
CREATE INDEX idx_reviews_org_id ON reviews(org_id);
CREATE INDEX idx_reviews_period ON reviews(period);
CREATE INDEX idx_feedback_employee_id ON feedback_360(employee_id);
CREATE INDEX idx_feedback_org_id ON feedback_360(org_id);
CREATE INDEX idx_coaching_employee_id ON coaching_logs(employee_id);
CREATE INDEX idx_coaching_manager_id ON coaching_logs(manager_id);
CREATE INDEX idx_team_health_org_id ON team_health(org_id);
CREATE INDEX idx_team_health_measured_at ON team_health(measured_at);
CREATE INDEX idx_employees_name_trgm ON employees USING gin(name gin_trgm_ops);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_360 ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_health ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Orgs: users can see and update their own org
CREATE POLICY "users_view_own_org" ON orgs FOR SELECT
  USING (id = get_user_org_id());
CREATE POLICY "admins_update_org" ON orgs FOR UPDATE
  USING (id = get_user_org_id() AND get_user_role() = 'admin');

-- Users: org isolation
CREATE POLICY "org_isolation_select" ON users FOR SELECT
  USING (org_id = get_user_org_id());
CREATE POLICY "org_isolation_insert" ON users FOR INSERT
  WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "org_isolation_update" ON users FOR UPDATE
  USING (org_id = get_user_org_id());
CREATE POLICY "org_isolation_delete" ON users FOR DELETE
  USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- Departments: org isolation
CREATE POLICY "org_isolation" ON departments FOR ALL
  USING (org_id = get_user_org_id());

-- Employees: org isolation
CREATE POLICY "org_isolation" ON employees FOR ALL
  USING (org_id = get_user_org_id());

-- OKRs: org isolation; employees can only see their own
CREATE POLICY "org_isolation" ON okrs FOR SELECT
  USING (org_id = get_user_org_id());
CREATE POLICY "managers_manage_okrs" ON okrs FOR INSERT
  WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "managers_update_okrs" ON okrs FOR UPDATE
  USING (org_id = get_user_org_id());
CREATE POLICY "admins_delete_okrs" ON okrs FOR DELETE
  USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager'));

-- Reviews: org isolation
CREATE POLICY "org_isolation" ON reviews FOR ALL
  USING (org_id = get_user_org_id());

-- Feedback 360: org isolation
CREATE POLICY "org_isolation" ON feedback_360 FOR ALL
  USING (org_id = get_user_org_id());

-- Coaching logs: org isolation
CREATE POLICY "org_isolation" ON coaching_logs FOR ALL
  USING (org_id = get_user_org_id());

-- Team health: org isolation
CREATE POLICY "org_isolation" ON team_health FOR ALL
  USING (org_id = get_user_org_id());

-- =====================
-- FUNCTIONS & TRIGGERS
-- =====================

-- Auto-update OKR status based on progress
CREATE OR REPLACE FUNCTION update_okr_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current >= NEW.target THEN
    NEW.status := 'achieved';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.current < NEW.target * 0.5 THEN
    NEW.status := 'missed';
  ELSIF NEW.current < NEW.target * 0.5 AND NEW.due_date < CURRENT_DATE + INTERVAL '14 days' THEN
    NEW.status := 'at_risk';
  ELSE
    NEW.status := COALESCE(NEW.status, 'on_track');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER okr_status_trigger
  BEFORE INSERT OR UPDATE ON okrs
  FOR EACH ROW EXECUTE FUNCTION update_okr_status();