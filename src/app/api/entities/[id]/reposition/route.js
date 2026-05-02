import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/entities/:id/reposition — Di chuyển trong cùng parent (spatial drag)
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

    if (body.x === undefined || body.y === undefined) {
      return NextResponse.json(
        { data: null, error: { message: 'x and y are required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // UPDATE x, y
    const { data: updated, error: updateError } = await supabase
      .from('entities')
      .update({
        x: body.x,
        y: body.y,
        updated_at: new Date().toISOString()
      })
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

    if (!updated) {
       return NextResponse.json(
        { data: null, error: { message: 'Entity not found', code: 'ENTITY_NOT_FOUND' } },
        { status: 404 }
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
