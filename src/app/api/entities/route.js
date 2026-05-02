import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateEntityData, validateTypeHierarchy, validateParentOwnership } from '@/lib/validation';
import { computePath } from '@/lib/path';

// POST /api/entities — Tạo entity mới
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate dữ liệu đầu vào
    const validation = validateEntityData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: validation.error },
        { status: 400 }
      );
    }

    let parentPath = null;

    // Nếu có parent, kiểm tra ownership + type hierarchy
    if (body.parent_id) {
      const { data: parent, error: parentError } = await supabase
        .from('entities')
        .select('id, user_id, type, path')
        .eq('id', body.parent_id)
        .single();

      if (parentError || !parent) {
        return NextResponse.json(
          { data: null, error: { message: 'Parent not found', code: 'INVALID_PARENT' } },
          { status: 400 }
        );
      }

      // Cross-user guard (Section 3)
      if (!validateParentOwnership(parent, user.id)) {
        return NextResponse.json(
          { data: null, error: { message: 'Parent belongs to another user', code: 'INVALID_PARENT' } },
          { status: 403 }
        );
      }

      // Type hierarchy check (Section 6)
      if (!validateTypeHierarchy(parent.type, body.type)) {
        return NextResponse.json(
          { data: null, error: {
            message: `Cannot place ${body.type} inside ${parent.type}`,
            code: 'INVALID_TYPE_HIERARCHY'
          }},
          { status: 400 }
        );
      }

      parentPath = parent.path;
    } else if (body.type !== 'house') {
      return NextResponse.json(
        { data: null, error: { message: 'Only house can be a root entity', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Tính order_index = max sibling + 1
    const { data: maxOrder } = await supabase
      .from('entities')
      .select('order_index')
      .eq('user_id', user.id)
      .eq('parent_id', body.parent_id || null)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const orderIndex = (maxOrder?.order_index ?? -1) + 1;

    // Tạo entity (path sẽ được tính sau khi có ID)
    const entityData = {
      user_id: user.id,
      name: body.name.trim(),
      type: body.type,
      subtype: body.subtype || null,
      parent_id: body.parent_id || null,
      x: body.x ?? 0,
      y: body.y ?? 0,
      z: body.z ?? 0,
      width: body.width ?? 1,
      height: body.height ?? 1,
      depth: body.depth ?? 0,
      rotation: body.rotation ?? 0,
      
      // Structural flags
      is_structural: body.is_structural ?? false,
      is_passable: body.is_passable ?? false,
      is_fixed: body.is_fixed ?? true,
      mount_type: body.mount_type ?? 'floor',
      wall_side: body.wall_side || null,
      
      // Door/Window geometry
      swing_direction: body.swing_direction || null,
      hinge_side: body.hinge_side || null,
      swing_angle: body.swing_angle ?? 90,

      // Stacking/ordering
      level: body.level ?? 0,
      order_index: orderIndex,

      // Visual
      color: body.color || null,
      icon: body.icon || null,
      thumbnail_url: body.thumbnail_url || null,

      // Semantic
      tags: body.tags || [],
      description: body.description || null,
      updated_at: new Date().toISOString(),
    };

    const { data: created, error: insertError } = await supabase
      .from('entities')
      .insert(entityData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { data: null, error: { message: insertError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    // Tính và cập nhật path
    const path = computePath(parentPath, created.id);
    const { data: updated, error: pathError } = await supabase
      .from('entities')
      .update({ path, updated_at: new Date().toISOString() })
      .eq('id', created.id)
      .select()
      .single();

    if (pathError) {
      // Rollback: xóa entity vừa tạo nếu không cập nhật được path
      await supabase.from('entities').delete().eq('id', created.id);
      return NextResponse.json(
        { data: null, error: { message: 'Failed to set path', code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updated, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}
