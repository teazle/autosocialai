import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const supabase = createServiceRoleClient();

    const { data: client, error } = await supabase
      .from('clients')
      .select('onboarding_token')
      .eq('id', clientId)
      .single();

    if (error || !client?.onboarding_token) {
      return NextResponse.json(
        { error: 'Client or onboarding token not found' },
        { status: 404 }
      );
    }

    const onboardingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboard/${client.onboarding_token}`;

    return NextResponse.json({ onboardingLink });
  } catch (error) {
    console.error('Error fetching onboarding link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding link' },
      { status: 500 }
    );
  }
}

