import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) {
      throw clientsError;
    }

    // Calculate stats
    const activeClients = clients?.filter((c) => c.status === 'active').length || 0;

    // Count posts this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const { data: recentPosts, error: postsError } = await supabase
      .from('content_pipeline')
      .select('id, status, created_at')
      .gte('created_at', startOfWeek.toISOString());

    const postsThisWeek = recentPosts?.length || 0;

    // Calculate success rate
    const publishedPosts = recentPosts?.filter((p) => p.status === 'published').length || 0;
    const successRate = postsThisWeek > 0 
      ? Math.round((publishedPosts / postsThisWeek) * 100)
      : 0;

    return NextResponse.json({
      clients,
      stats: {
        activeClients,
        postsThisWeek,
        successRate,
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

