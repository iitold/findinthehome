import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Middleware kiểm tra admin
async function checkAdmin(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, error: 'UNAUTHORIZED' };

  const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
  if (!isAdmin) return { user, error: 'FORBIDDEN' };

  return { user, error: null };
}

// GET /api/admin/users — Liệt kê tất cả users
export async function GET() {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await checkAdmin(supabase);

    if (authError) {
      return NextResponse.json(
        { data: null, error: { message: authError, code: authError } },
        { status: authError === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const adminClient = createAdminClient();

    // Lấy danh sách users từ auth
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { data: null, error: { message: listError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    // Lấy profiles để biết role
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, role, full_name, created_at');

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Kết hợp auth users + profiles
    const enrichedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      role: profileMap.get(u.id)?.role || 'user',
      full_name: profileMap.get(u.id)?.full_name || null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
    }));

    return NextResponse.json({ data: enrichedUsers, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}

// POST /api/admin/users — Tạo user mới (admin only)
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { error: authError } = await checkAdmin(supabase);

    if (authError) {
      return NextResponse.json(
        { data: null, error: { message: authError, code: authError } },
        { status: authError === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const { email, password, role = 'user', full_name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { data: null, error: { message: 'Email and password required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Tạo user qua Admin API
    const { data: { user: newUser }, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm email
    });

    if (createError) {
      return NextResponse.json(
        { data: null, error: { message: createError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    // Tạo profile
    await adminClient.from('profiles').insert({
      id: newUser.id,
      email,
      role,
      full_name: full_name || null,
    });

    return NextResponse.json({
      data: { id: newUser.id, email, role, full_name },
      error: null,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}
