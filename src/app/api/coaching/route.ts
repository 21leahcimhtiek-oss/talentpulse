import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { generateCoaching } from '@/lib/openai/generate-coaching';

const createCoachingSchema = z.object({
  employee_id: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = await rateLimit(`coaching:get:${ip}`);
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
    const employeeId = searchParams.get('employee_id');

    let query = supabase
      .from('coaching_logs')
      .select('*, employees(name, department)')
      .eq('org_id', userData.org_id)
      .order('created_at', { ascending: false });

    if (employeeId) query = query.eq('employee_id', employeeId);

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
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    // Strict 5/hour limit — configure coaching:post:strict:* in the rate-limit module
    const { success } = await rateLimit(`coaching:post:strict:${ip}`);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!['admin', 'manager'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as unknown;
    const validated = createCoachingSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten() }, { status: 400 });
    }

    const { employee_id } = validated.data;

    const [reviewsResult, feedbackResult, okrsResult] = await Promise.all([
      supabase
        .from('reviews')
        .select('score, strengths, improvements, period')
        .eq('employee_id', employee_id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('feedback')
        .select('content, sentiment_score, created_at')
        .eq('employee_id', employee_id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('okrs')
        .select('title, current, target, unit, status, due_date')
        .eq('employee_id', employee_id)
        .neq('status', 'achieved')
        .order('due_date'),
    ]);

    if (reviewsResult.error) throw reviewsResult.error;
    if (feedbackResult.error) throw feedbackResult.error;
    if (okrsResult.error) throw okrsResult.error;

    const coachingContent = await generateCoaching({
      reviews:  reviewsResult.data ?? [],
      feedback: feedbackResult.data ?? [],
      okrs:     okrsResult.data ?? [],
    });

    const { data: coachingLog, error: insertError } = await supabase
      .from('coaching_logs')
      .insert({
        employee_id,
        org_id:       userData.org_id,
        content:      coachingContent,
        generated_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ data: coachingLog }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}