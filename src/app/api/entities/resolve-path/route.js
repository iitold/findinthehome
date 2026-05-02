import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/entities/resolve-path?path=/111/222/333/
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
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { data: null, error: { message: 'path parameter is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Gọi RPC function resolve_path_names
    const { data: pathData, error: pathError } = await supabase.rpc('resolve_path_names', {
      entity_path: path,
      owner_id: user.id,
    });

    if (pathError) {
      return NextResponse.json(
        { data: null, error: { message: pathError.message, code: 'TRANSACTION_FAILED' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: pathData || [], error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { message: err.message, code: 'TRANSACTION_FAILED' } },
      { status: 500 }
    );
  }
}
