import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { analyzeSentiment } from '@/lib/openai/analyze-sentiment';

export async function GET(req: NextRequest) {
  const limited = await checkRateLimit(req, 'feedback', 100);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const recipientId = searchParams.get('recipient_id') ?? user.id;

  const { data, error } = await supabase
    .from('peer_feedback')
    .select('*, giver:profiles!giver_id(full_name, avatar_url)')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'feedback-create', 20);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { recipient_id, content, is_anonymous = false } = await req.json();
  if (!recipient_id || !content) return NextResponse.json({ error: 'recipient_id and content required' }, { status: 400 });

  let sentiment = null;
  try {
    sentiment = await analyzeSentiment(content);
  } catch {
    // non-blocking
  }

  const { data, error } = await supabase
    .from('peer_feedback')
    .insert({
      giver_id: is_anonymous ? null : user.id,
      recipient_id,
      content,
      is_anonymous,
      sentiment_score: sentiment?.score ?? null,
      sentiment_label: sentiment?.label ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}