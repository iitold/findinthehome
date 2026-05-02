import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateTypeHierarchy } from '@/lib/validation';

// PATCH /api/entities/:id — Cập nhật entity (rename, move, edit fields)
export async function PATCH(request, { params }) {
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

    // Kiểm tra entity tồn tại và thuộc user
    const { data: entity, error: fetchError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !entity) {
      return NextResponse.json(
        { data: null, error: { message: 'Entity not found', code: 'ENTITY_NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Nếu đang thay đổi parent_id → MOVE operation (dùng RPC transaction)
    if (body.parent_id !== undefined && body.parent_id !== entity.parent_id) {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('move_entity', {
        entity_id: id,
        new_parent_id: body.parent_id,
        new_x: body.x ?? null,
        new_y: body.y ?? null,
        new_z: body.z ?? null,
        owner_id: user.id,
      });

      if (rpcError) {
        return NextResponse.json(
          { data: null, error: { message: rpcError.message, code: 'TRANSACTION_FAILED' } },
          { status: 500 }
        );
      }

      // RPC trả về JSONB — kiểm tra lỗi bên trong
      if (rpcResult?.error) {
        return NextResponse.json(
          { data: null, error: rpcResult.error },
          { status: 400 }
        );
      }

      // Lấy entity đã cập nhật
      const { data: movedEntity } = await supabase
        .from('entities')
        .select('*')
        .eq('id', id)
        .single();

      return NextResponse.json({ data: movedEntity, error: null });
    }

    // UPDATE thường (rename, edit fields) — không phải MOVE
    const allowedFields = [
      'name', 'x', 'y', 'z', 'width', 'height', 'depth', 'rotation',
      'level', 'order_index', 'color', 'icon', 'tags', 'description',
      'is_structural', 'is_passable', 'is_fixed', 'mount_type', 'wall_side',
      'swing_direction', 'hinge_side', 'swing_angle', 'subtype', 'thumbnail_url'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Luôn cập nhật updated_at
    updateData.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('entities')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { data: null, error: { message: updateError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    // Nếu có thay đổi tọa độ (x, y) => Dời tất cả con cháu đi một đoạn Delta
    // TUY NHIÊN, nếu đây là thao tác Resize (có gửi lên width/height), đồ vật con phải giữ nguyên toạ độ tuyệt đối
    const isResize = body.width !== undefined || body.height !== undefined;
    
    if (!isResize && ((body.x !== undefined && body.x !== entity.x) || (body.y !== undefined && body.y !== entity.y))) {
      const dx = (body.x ?? entity.x) - entity.x;
      const dy = (body.y ?? entity.y) - entity.y;

      if ((dx !== 0 || dy !== 0) && entity.path) {
        const { data: descendants } = await supabase
          .from('entities')
          .select('id, x, y')
          .like('path', `${entity.path}%`)
          .neq('id', entity.id);

        if (descendants && descendants.length > 0) {
          await Promise.all(descendants.map(child => 
            supabase.from('entities').update({
              x: child.x + dx,
              y: child.y + dy,
              updated_at: new Date().toISOString()
            }).eq('id', child.id)
          ));
        }
      }
    }

    return NextResponse.json({ data: updated, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}

// DELETE /api/entities/:id — Xóa entity (cascade xóa con cháu)
export async function DELETE(request, { params }) {
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

    // Kiểm tra entity tồn tại và thuộc user
    const { data: entity, error: fetchError } = await supabase
      .from('entities')
      .select('id, name, type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !entity) {
      return NextResponse.json(
        { data: null, error: { message: 'Entity not found', code: 'ENTITY_NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Xóa — ON DELETE CASCADE sẽ xóa con cháu
    const { error: deleteError } = await supabase
      .from('entities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { data: null, error: { message: deleteError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { id, name: entity.name, deleted: true },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}
