import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateTypeHierarchy } from '@/lib/validation';

// POST /api/entities/:id/move — Reparent drag
export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (body.new_parent_id === undefined) {
      return NextResponse.json(
        { data: null, error: { message: 'new_parent_id is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Type hierarchy check
    // Cần biết type của entity hiện tại và parent mới
    const { data: entity } = await supabase.from('entities').select('type').eq('id', id).eq('user_id', user.id).single();
    const { data: parent } = await supabase.from('entities').select('type').eq('id', body.new_parent_id).eq('user_id', user.id).single();

    if (!entity || !parent) {
      return NextResponse.json(
        { data: null, error: { message: 'Entity or parent not found', code: 'ENTITY_NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (!validateTypeHierarchy(parent.type, entity.type)) {
      return NextResponse.json(
        { data: null, error: { message: `Cannot place ${entity.type} inside ${parent.type}`, code: 'INVALID_TYPE_HIERARCHY' } },
        { status: 400 }
      );
    }

    // Thực thi transaction RPC (sẽ check circular ref + owner bên trong RPC)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('move_entity', {
      entity_id: id,
      new_parent_id: body.new_parent_id,
      new_x: body.x ?? null,
      new_y: body.y ?? null,
      new_z: body.level ?? null, // Map level to new_z in RPC
      owner_id: user.id,
    });

    if (rpcError) {
      return NextResponse.json(
        { data: null, error: { message: rpcError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    if (rpcResult?.error) {
      return NextResponse.json(
        { data: null, error: rpcResult.error },
        { status: 400 }
      );
    }

    // Lấy lại entity sau khi move
    const { data: movedEntity } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single();

    // Nếu truyền level, ta cũng cập nhật level
    if (body.level !== undefined) {
      await supabase.from('entities').update({ level: body.level }).eq('id', id);
      movedEntity.level = body.level;
    }

    return NextResponse.json({ data: movedEntity, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}
