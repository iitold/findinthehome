import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_TREE_DEPTH, MAX_TREE_DEPTH } from '@/lib/constants';

// GET /api/entities/tree — Lấy cây entities (lazy, phân cấp)
// Query params: ?depth=2&parent_id=<uuid>
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const depth = Math.min(
      parseInt(searchParams.get('depth')) || DEFAULT_TREE_DEPTH,
      MAX_TREE_DEPTH
    );
    const parentId = searchParams.get('parent_id') || null;

    // Lấy tất cả entities của user, sắp xếp theo order_index
    let query = supabase
      .from('entities')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (parentId) {
      // Lazy load: lấy subtree từ parent_id
      // Lấy parent trước để biết path prefix
      const { data: parent } = await supabase
        .from('entities')
        .select('path')
        .eq('id', parentId)
        .eq('user_id', user.id)
        .single();

      if (!parent) {
        return NextResponse.json(
          { data: null, error: { message: 'Parent not found', code: 'ENTITY_NOT_FOUND' } },
          { status: 404 }
        );
      }

      // Lấy tất cả descendants trong phạm vi depth
      query = query.like('path', `${parent.path}%`);
    }

    const { data: entities, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { data: null, error: { message: fetchError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    // Build nested tree từ flat list
    const tree = buildTree(entities, parentId, depth);

    return NextResponse.json({ data: tree, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}

/**
 * Build nested tree từ flat entity list
 * @param {Array} entities - Flat list of entities
 * @param {string|null} rootParentId - ID của parent gốc (null = tất cả houses)
 * @param {number} maxDepth - Độ sâu tối đa
 * @returns {Array} Nested tree structure
 */
function buildTree(entities, rootParentId, maxDepth) {
  // Tạo map id → entity
  const entityMap = new Map();
  entities.forEach(e => {
    entityMap.set(e.id, { ...e, children: [] });
  });

  const roots = [];

  // Gắn children vào parent
  entities.forEach(e => {
    const node = entityMap.get(e.id);
    if (e.parent_id && entityMap.has(e.parent_id)) {
      entityMap.get(e.parent_id).children.push(node);
    } else if (
      (rootParentId === null && e.parent_id === null) ||
      (rootParentId && e.id === rootParentId)
    ) {
      roots.push(node);
    }
  });

  // Nếu đang lazy load subtree, trả về children của parent
  if (rootParentId && entityMap.has(rootParentId)) {
    const parent = entityMap.get(rootParentId);
    // Cắt depth
    return [trimDepth(parent, maxDepth, 0)];
  }

  // Cắt depth cho roots
  return roots.map(r => trimDepth(r, maxDepth, 0));
}

/**
 * Cắt cây theo độ sâu tối đa
 */
function trimDepth(node, maxDepth, currentDepth) {
  if (currentDepth >= maxDepth) {
    // Đánh dấu có children nhưng không load
    return {
      ...node,
      children: [],
      has_children: node.children.length > 0,
    };
  }

  return {
    ...node,
    has_children: node.children.length > 0,
    children: node.children.map(c => trimDepth(c, maxDepth, currentDepth + 1)),
  };
}
