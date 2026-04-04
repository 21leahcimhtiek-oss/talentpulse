import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = await checkRateLimit(req, 'team-health', 50);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('team_health_scores')
    .select('*')
    .order('calculated_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'team-health-recalc', 5);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', authUser?.id ?? '').single();
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  }

  const [
    { data: okrs },
    { data: feedback },
    { data: reviews },
  ] = await Promise.all([
    supabase.from('okrs').select('progress, status'),
    supabase.from('peer_feedback').select('sentiment_score'),
    supabase.from('performance_reviews').select('overall_score'),
  ]);

  const okrAttainment = okrs?.length
    ? Math.round(okrs.reduce((s, o) => s + (o.progress ?? 0), 0) / okrs.length)
    : 50;

  const feedbackSentiment = feedback?.length
    ? Math.round(
        (feedback.reduce((s, f) => s + (f.sentiment_score ?? 0.5), 0) / feedback.length) * 100
      )
    : 50;

  const engagementScore = reviews?.length
    ? Math.round(
        (reviews.reduce((s, r) => s + (r.overall_score ?? 3), 0) / reviews.length / 5) * 100
      )
    : 50;

  const score = Math.round((okrAttainment + feedbackSentiment + engagementScore) / 3);

  const { data, error } = await supabase
    .from('team_health_scores')
    .insert({ score, okr_attainment: okrAttainment, feedback_sentiment: feedbackSentiment, engagement_score: engagementScore, calculated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}