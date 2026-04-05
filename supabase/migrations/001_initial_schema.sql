-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- organizations
CREATE TABLE organizations (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    slug       text UNIQUE,
    created_at timestamptz DEFAULT now()
);

-- profiles
CREATE TABLE profiles (
    id                 uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    org_id             uuid REFERENCES organizations,
    email              text UNIQUE,
    full_name          text,
    avatar_url         text,
    role               text DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
    stripe_customer_id text,
    created_at         timestamptz DEFAULT now(),
    updated_at         timestamptz DEFAULT now()
);

-- employees
CREATE TABLE employees (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES profiles ON DELETE CASCADE,
    org_id     uuid REFERENCES organizations,
    manager_id uuid REFERENCES profiles,
    job_title  text,
    department text,
    hire_date  date,
    status     text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz DEFAULT now()
);

-- okrs
CREATE TABLE okrs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES profiles ON DELETE CASCADE,
    title       text NOT NULL,
    description text,
    quarter     text,
    year        int,
    progress    int DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    status      text DEFAULT 'draft' CHECK (status IN ('draft', 'on_track', 'at_risk', 'completed')),
    created_by  uuid REFERENCES profiles,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- key_results
CREATE TABLE key_results (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    okr_id        uuid REFERENCES okrs ON DELETE CASCADE,
    title         text NOT NULL,
    target_value  numeric,
    current_value numeric DEFAULT 0,
    unit          text,
    created_at    timestamptz DEFAULT now()
);

-- performance_reviews
CREATE TABLE performance_reviews (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id   uuid REFERENCES profiles,
    reviewee_id   uuid REFERENCES profiles,
    cycle         text NOT NULL,
    overall_score numeric CHECK (overall_score BETWEEN 1 AND 5),
    strengths     text,
    improvements  text,
    comments      text,
    bias_flags    jsonb DEFAULT '[]',
    submitted_at  timestamptz,
    created_at    timestamptz DEFAULT now()
);

-- peer_feedback
CREATE TABLE peer_feedback (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    giver_id        uuid REFERENCES profiles,
    recipient_id    uuid REFERENCES profiles ON DELETE CASCADE,
    content         text NOT NULL,
    is_anonymous    boolean DEFAULT false,
    sentiment_score numeric,
    sentiment_label text,
    created_at      timestamptz DEFAULT now()
);

-- coaching_suggestions
CREATE TABLE coaching_suggestions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id  uuid REFERENCES profiles ON DELETE CASCADE,
    manager_id   uuid REFERENCES profiles,
    suggestions  jsonb DEFAULT '[]',
    generated_at timestamptz DEFAULT now(),
    created_at   timestamptz DEFAULT now()
);

-- team_health_scores
CREATE TABLE team_health_scores (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              uuid REFERENCES organizations,
    score               int DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    engagement_score    int,
    okr_attainment      int,
    feedback_sentiment  int,
    calculated_at       timestamptz DEFAULT now()
);

-- subscriptions
CREATE TABLE subscriptions (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                uuid REFERENCES profiles ON DELETE CASCADE,
    org_id                 uuid REFERENCES organizations,
    stripe_customer_id     text,
    stripe_subscription_id text UNIQUE,
    plan_tier              text DEFAULT 'free',
    billing_period         text DEFAULT 'monthly',
    status                 text DEFAULT 'trialing',
    current_period_end     timestamptz,
    created_at             timestamptz DEFAULT now(),
    updated_at             timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results          ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_feedback        ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_health_scores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;

-- RLS Policies: profiles
CREATE POLICY "Users can view profiles in their org"
    ON profiles FOR SELECT
    USING (
        auth.uid() = id
        OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies: employees
CREATE POLICY "Employees select same org"
    ON employees FOR SELECT
    TO authenticated
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Employees insert same org"
    ON employees FOR INSERT
    TO authenticated
    WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Employees update same org"
    ON employees FOR UPDATE
    TO authenticated
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Employees delete same org"
    ON employees FOR DELETE
    TO authenticated
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: okrs
CREATE POLICY "OKRs select authenticated"
    ON okrs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "OKRs insert authenticated"
    ON okrs FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "OKRs update authenticated"
    ON okrs FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "OKRs delete authenticated"
    ON okrs FOR DELETE
    TO authenticated
    USING (true);

-- RLS Policies: key_results
CREATE POLICY "Key results select authenticated"
    ON key_results FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Key results insert authenticated"
    ON key_results FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Key results update authenticated"
    ON key_results FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Key results delete authenticated"
    ON key_results FOR DELETE
    TO authenticated
    USING (true);

-- RLS Policies: performance_reviews
CREATE POLICY "Reviews select authenticated"
    ON performance_reviews FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Reviews insert authenticated"
    ON performance_reviews FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Reviews update authenticated"
    ON performance_reviews FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Reviews delete authenticated"
    ON performance_reviews FOR DELETE
    TO authenticated
    USING (true);

-- RLS Policies: peer_feedback
CREATE POLICY "Feedback select authenticated"
    ON peer_feedback FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Feedback insert authenticated"
    ON peer_feedback FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Feedback update authenticated"
    ON peer_feedback FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Feedback delete authenticated"
    ON peer_feedback FOR DELETE
    TO authenticated
    USING (true);

-- RLS Policies: coaching_suggestions
CREATE POLICY "Coaching select authenticated"
    ON coaching_suggestions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Coaching insert authenticated"
    ON coaching_suggestions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- RLS Policies: team_health_scores
CREATE POLICY "Team health select authenticated"
    ON team_health_scores FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies: subscriptions
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX ON employees            (org_id);
CREATE INDEX ON employees            (manager_id);
CREATE INDEX ON okrs                 (employee_id);
CREATE INDEX ON performance_reviews  (reviewee_id);
CREATE INDEX ON peer_feedback        (recipient_id);
CREATE INDEX ON coaching_suggestions (employee_id);
CREATE INDEX ON team_health_scores   (org_id, calculated_at DESC);

-- Trigger: auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_okrs_updated_at
    BEFORE UPDATE ON okrs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();