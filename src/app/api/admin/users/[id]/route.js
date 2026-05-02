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

// PATCH /api/admin/users/:id — Sửa user (role, full_name)
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await checkAdmin(supabase);
    if (authError) {
      return NextResponse.json(
        { data: null, error: { message: authError, code: authError } },
        { status: authError === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const adminClient = createAdminClient();

    // Cập nhật profile
    const updateData = {};
    if (body.role !== undefined) updateData.role = body.role;
    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    updateData.updated_at = new Date().toISOString();

    // Không cho phép hạ quyền chính mình
    if (id === user.id && body.role && body.role !== 'admin') {
      return NextResponse.json(
        { data: null, error: { message: 'Cannot demote yourself', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { data: null, error: { message: updateError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updated, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/:id — Xóa user
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await checkAdmin(supabase);
    if (authError) {
      return NextResponse.json(
        { data: null, error: { message: authError, code: authError } },
        { status: authError === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const { id } = await params;

    // Không cho xóa chính mình
    if (id === user.id) {
      return NextResponse.json(
        { data: null, error: { message: 'Cannot delete yourself', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Xóa toàn bộ entities của user này trước (để tránh lỗi Foreign Key)
    await adminClient.from('entities').delete().eq('user_id', id);

    // 2. Xóa profile
    await adminClient.from('profiles').delete().eq('id', id);

    // Xóa auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);
    if (deleteError) {
      return NextResponse.json(
        { data: null, error: { message: deleteError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { id, deleted: true }, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}
