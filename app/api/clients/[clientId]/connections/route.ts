import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabase = createServiceRoleClient();

    // Fetch all social accounts for this client
    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
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
    const { platform, token, refreshToken, expiresAt, pageId, businessId } = body;

    const supabase = createServiceRoleClient();

    // Check if account already exists
    const { data: existing } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('client_id', clientId)
      .eq('platform', platform)
      .single();

    const accountData: any = {
      client_id: clientId,
      platform,
      token_encrypted: token,
      token_expires_at: expiresAt,
    };

    if (refreshToken) {
      accountData.refresh_token_encrypted = refreshToken;
    }
    if (pageId) {
      accountData.page_id = pageId;
    }
    if (businessId) {
      accountData.business_id = businessId;
    }

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('social_accounts')
        .update(accountData)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('social_accounts')
        .insert(accountData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ account: result });
  } catch (error) {
    console.error('Error saving connection:', error);
    return NextResponse.json(
      { error: 'Failed to save connection' },
      { status: 500 }
    );
  }
}

