import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = await rateLimit(`team-health:get:${ip}`);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');

    let query = supabase
      .from('team_health')
      .select('*')
      .eq('org_id', userData.org_id)
      .order('calculated_at', { ascending: false });

    if (teamId) query = query.eq('team_id', teamId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret');
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgs, error: orgsError } = await serviceClient
      .from('orgs')
      .select('id');

    if (orgsError) throw orgsError;
    if (!orgs || orgs.length === 0) return NextResponse.json({ processed: 0 });

    const results: Array<{ org_id: string; departments: number }> = [];

    for (const org of orgs) {
      const { data: employees } = await serviceClient
        .from('employees')
        .select('id, department')
        .eq('org_id', org.id);

      if (!employees || employees.length === 0) continue;

      const departmentMap: Record<string, string[]> = {};
      for (const emp of employees) {
        if (!departmentMap[emp.department]) departmentMap[emp.department] = [];
        departmentMap[emp.department].push(emp.id);
      }

      const upserts: Array<Record<string, unknown>> = [];

      for (const [department, empIds] of Object.entries(departmentMap)) {
        const [okrsRes, feedbackRes, reviewsRes] = await Promise.all([
          serviceClient
            .from('okrs')
            .select('current, target')
            .in('employee_id', empIds),
          serviceClient
            .from('feedback')
            .select('sentiment_score')
            .in('employee_id', empIds)
            .not('sentiment_score', 'is', null),
          serviceClient
            .from('reviews')
            .select('score')
            .in('employee_id', empIds),
        ]);

        const okrs         = okrsRes.data ?? [];
        const feedbackItems = feedbackRes.data ?? [];
        const reviewItems  = reviewsRes.data ?? [];

        const okrScore =
          okrs.length > 0
            ? (okrs.reduce((sum, o) => sum + (o.target > 0 ? Math.min(o.current / o.target, 1) : 0), 0) /
                okrs.length) * 100
            : 0;

        const feedbackScore =
          feedbackItems.length > 0
            ? (feedbackItems.reduce((sum, f) => sum + (f.sentiment_score as number), 0) /
                feedbackItems.length) * 100
            : 0;

        const reviewScore =
          reviewItems.length > 0
            ? (reviewItems.reduce((sum, r) => sum + (r.score as number), 0) /
                reviewItems.length / 5) * 100
            : 0;

        const composite = okrScore * 0.4 + feedbackScore * 0.3 + reviewScore * 0.3;

        upserts.push({
          org_id:         org.id,
          team_id:        department,
          okr_score:      Math.round(okrScore      * 100) / 100,
          feedback_score: Math.round(feedbackScore * 100) / 100,
          review_score:   Math.round(reviewScore   * 100) / 100,
          composite:      Math.round(composite     * 100) / 100,
          calculated_at:  new Date().toISOString(),
        });
      }

      if (upserts.length > 0) {
        await serviceClient
          .from('team_health')
          .upsert(upserts, { onConflict: 'org_id,team_id' });
      }

      results.push({ org_id: org.id, departments: upserts.length });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}