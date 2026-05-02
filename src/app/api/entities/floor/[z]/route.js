import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/entities/floor/:z — Lấy toàn bộ entities trên một tầng
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { z } = await params;
    const floorZ = parseFloat(z);

    if (isNaN(floorZ)) {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid z parameter', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Lấy floor entity để lấy path (trường hợp có nhiều floor cùng z thì lấy floor đầu tiên)
    const { data: floorEntity, error: floorError } = await supabase
      .from('entities')
      .select('path')
      .eq('user_id', user.id)
      .eq('type', 'floor')
      .eq('z', floorZ)
      .single();

    if (floorError || !floorEntity) {
      return NextResponse.json(
        { data: [], error: null } // Return empty array instead of 404
      );
    }

    // Lấy tất cả entities thuộc floor này dựa vào path
    const { data: entities, error: fetchError } = await supabase
      .from('entities')
      .select('*')
      .eq('user_id', user.id)
      .like('path', `${floorEntity.path}%`)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { data: null, error: { message: fetchError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: entities || [], error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}
