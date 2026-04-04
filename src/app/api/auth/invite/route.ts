import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'employee']),
});

const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = await rateLimit(`auth:invite:${ip}`);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const body = await request.json() as unknown;
    const validated = inviteSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten() }, { status: 400 });
    }

    const { email, role } = validated.data;

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        org_id: userData.org_id,
        role,
      },
    });

    if (inviteError) {
      if (inviteError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }
      throw inviteError;
    }

    return NextResponse.json({ success: true, message: 'Invitation sent' });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}