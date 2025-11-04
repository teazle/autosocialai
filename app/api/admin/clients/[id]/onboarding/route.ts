import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const supabase = createServiceRoleClient();

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Generate secure token for onboarding
    const onboardingToken = crypto.randomBytes(32).toString('hex');

    // Update client with onboarding token
    const { error: updateError } = await supabase
      .from('clients')
      .update({ onboarding_token: onboardingToken })
      .eq('id', clientId);

    if (updateError) {
      throw updateError;
    }

    const onboardingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboard/${onboardingToken}`;

    return NextResponse.json({ 
      onboardingToken,
      onboardingLink,
      message: 'Onboarding token generated successfully'
    });
  } catch (error) {
    console.error('Error generating onboarding token:', error);
    return NextResponse.json(
      { error: 'Failed to generate onboarding token' },
      { status: 500 }
    );
  }
}

