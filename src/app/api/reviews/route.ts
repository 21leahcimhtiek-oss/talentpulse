import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { detectBias } from '@/lib/openai/detect-bias';

export async function GET(req: NextRequest) {
  const limited = await checkRateLimit(req, 'reviews', 100);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('performance_reviews')
    .select('*, reviewer:profiles!reviewer_id(*), reviewee:profiles!reviewee_id(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'reviews-create', 10);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reviewee_id, cycle, overall_score, strengths, improvements, comments } = await req.json();
  if (!reviewee_id || !cycle) return NextResponse.json({ error: 'reviewee_id and cycle required' }, { status: 400 });

  const reviewText = [strengths, improvements, comments].filter(Boolean).join('\n\n');
  let biasResult = null;
  if (reviewText) {
    try {
      biasResult = await detectBias({ reviewText, revieweeName: reviewee_id, reviewerName: user.id });
    } catch {
      // non-blocking: bias check failure should not block review submission
    }
  }

  const { data, error } = await supabase
    .from('performance_reviews')
    .insert({
      reviewer_id: user.id,
      reviewee_id,
      cycle,
      overall_score,
      strengths,
      improvements,
      comments,
      bias_flags: biasResult?.flags ?? [],
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, bias: biasResult }, { status: 201 });
}