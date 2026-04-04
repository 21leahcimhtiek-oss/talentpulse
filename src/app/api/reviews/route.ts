import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { detectBias } from '@/lib/openai/detect-bias';

const createReviewSchema = z.object({
  employee_id: z.string().uuid(),
  period: z.string().min(1),
  score: z.number().min(1).max(5),
  strengths: z.string().min(1),
  improvements: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = await rateLimit(`reviews:get:${ip}`);
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
    const period = searchParams.get('period');

    let query = supabase
      .from('reviews')
      .select('*, employees(name, department)')
      .eq('org_id', userData.org_id)
      .order('created_at', { ascending: false });

    if (employeeId) query = query.eq('employee_id', employeeId);
    if (period) query = query.eq('period', period);

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
    const { success } = await rateLimit(`reviews:post:${ip}`);
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
    const validated = createReviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten() }, { status: 400 });
    }

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        ...validated.data,
        org_id: userData.org_id,
        reviewer_id: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const reviewText = `${validated.data.strengths} ${validated.data.improvements}`;
    detectBias(reviewText)
      .then(async (biasFlag) => {
        await supabase
          .from('reviews')
          .update({ ai_bias_flag: biasFlag })
          .eq('id', review.id);
      })
      .catch((err: unknown) => Sentry.captureException(err));

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}