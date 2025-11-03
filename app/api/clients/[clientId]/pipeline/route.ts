import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabase = createServiceRoleClient();

    const { data: posts, error } = await supabase
      .from('content_pipeline')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    // Ensure scheduled_at is set (required field)
    const scheduledAt = body.scheduled_at || new Date().toISOString();

    const { data, error } = await supabase
      .from('content_pipeline')
      .insert({
        client_id: clientId,
        ...body,
        scheduled_at: scheduledAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

