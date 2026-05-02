import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function checkAdmin(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, error: 'UNAUTHORIZED' };
  const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
  if (!isAdmin) return { user, error: 'FORBIDDEN' };
  return { user, error: null };
}

// POST /api/admin/users/:id/reset-password — Reset mật khẩu user
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { error: authError } = await checkAdmin(supabase);
    if (authError) {
      return NextResponse.json(
        { data: null, error: { message: authError, code: authError } },
        { status: authError === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const { id } = await params;
    const { new_password } = await request.json();

    if (!new_password || new_password.length < 6) {
      return NextResponse.json(
        { data: null, error: { message: 'Password must be at least 6 characters', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { error: updateError } = await adminClient.auth.admin.updateUserById(id, {
      password: new_password,
    });

    if (updateError) {
      return NextResponse.json(
        { data: null, error: { message: updateError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { id, message: 'Password reset successfully' },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}
