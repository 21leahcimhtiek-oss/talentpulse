import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateCoaching } from '@/lib/openai/generate-coaching';

export async function GET(req: NextRequest) {
  const limited = await checkRateLimit(req, 'coaching', 50);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('coaching_suggestions')
    .select('*, employee:profiles!employee_id(*)')
    .eq('manager_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'coaching-generate', 5);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { employee_id } = await req.json();
  if (!employee_id) return NextResponse.json({ error: 'employee_id required' }, { status: 400 });

  const [
    { data: profile },
    { data: reviews },
    { data: okrs },
    { data: feedback },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', employee_id).single(),
    supabase.from('performance_reviews').select('*').eq('reviewee_id', employee_id).order('created_at', { ascending: false }).limit(3),
    supabase.from('okrs').select('*').eq('employee_id', employee_id).order('created_at', { ascending: false }).limit(5),
    supabase.from('peer_feedback').select('content, sentiment_label').eq('recipient_id', employee_id).order('created_at', { ascending: false }).limit(5),
  ]);

  const suggestions = await generateCoaching({
    employeeName: (profile as { full_name?: string } | null)?.full_name ?? 'Employee',
    recentReviews: (reviews ?? []) as never,
    okrs: (okrs ?? []) as never,
    peerFeedback: (feedback ?? []) as never,
  });

  const { data, error } = await supabase
    .from('coaching_suggestions')
    .insert({
      employee_id,
      manager_id: user.id,
      suggestions: suggestions.suggestions,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}