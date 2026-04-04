import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limited = await checkRateLimit(req, 'okrs', 100);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employee_id');

  let query = supabase.from('okrs').select('*, key_results(*), employee:profiles(*)');
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'okrs-create', 20);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, employee_id, quarter, year, key_results = [] } = await req.json();
  if (!title || !employee_id) return NextResponse.json({ error: 'title and employee_id required' }, { status: 400 });

  const { data: okr, error: okrErr } = await supabase
    .from('okrs')
    .insert({ title, description, employee_id, quarter, year, created_by: user.id })
    .select()
    .single();

  if (okrErr) return NextResponse.json({ error: okrErr.message }, { status: 400 });

  if (key_results.length > 0) {
    await supabase.from('key_results').insert(
      key_results.map((kr: { title: string; target_value: number; unit: string }) => ({
        ...kr,
        okr_id: okr.id,
      }))
    );
  }

  return NextResponse.json({ data: okr }, { status: 201 });
}