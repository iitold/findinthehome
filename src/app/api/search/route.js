import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_SEARCH_LIMIT } from '@/lib/constants';

// GET /api/search?q=&limit=&offset= — Tìm kiếm entities
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
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit')) || DEFAULT_SEARCH_LIMIT, 100);
    const offset = parseInt(searchParams.get('offset')) || 0;

    if (!query) {
      return NextResponse.json({
        data: [],
        total_count: 0,
        error: { message: 'No search query provided', code: 'EMPTY_SEARCH' },
      });
    }

    // Gọi RPC function search_entities (FTS → ILIKE fallback)
    const { data: searchResult, error: searchError } = await supabase.rpc('search_entities', {
      query_text: query,
      owner_id: user.id,
      result_limit: limit,
      result_offset: offset,
    });

    if (searchError) {
      return NextResponse.json(
        { data: null, error: { message: searchError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    const results = searchResult?.data || [];
    const totalCount = searchResult?.total_count || 0;

    if (results.length === 0) {
      return NextResponse.json({
        data: [],
        total_count: 0,
        search_type: searchResult?.search_type || 'none',
        error: null,
      });
    }

    // Resolve path names cho mỗi kết quả (Section 8.3-8.4)
    const enrichedResults = await Promise.all(
      results.map(async (entity) => {
        const { data: pathData } = await supabase.rpc('resolve_path_names', {
          entity_path: entity.path,
          owner_id: user.id,
        });

        const ancestors = pathData || [];

        return {
          entity_id: entity.id,
          name: entity.name,
          type: entity.type,
          icon: entity.icon,
          color: entity.color,
          path_ids: ancestors.map(a => a.id),
          path_names: ancestors.map(a => a.name),
          path_types: ancestors.map(a => a.type),
          position: { x: entity.x, y: entity.y, z: entity.z },
          level: entity.level,
          rank: entity.rank || 0,
        };
      })
    );

    return NextResponse.json({
      data: enrichedResults,
      total_count: totalCount,
      search_type: searchResult?.search_type,
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}
