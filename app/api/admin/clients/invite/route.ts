import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brand_voice, timezone, industry, target_audience } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Generate secure token for onboarding
    const onboardingToken = crypto.randomBytes(32).toString('hex');

    // Create client with pending status
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name,
        brand_voice: brand_voice || 'Friendly',
        timezone: timezone || 'Asia/Singapore',
        status: 'pending',
        onboarding_token: onboardingToken,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // TODO: Store brand assets if industry/audience provided
    if (industry || target_audience) {
      // Save to brand_assets table
    }

    const onboardingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboard/${onboardingToken}`;

    return NextResponse.json({
      clientId: client.id,
      onboardingToken,
      onboardingLink,
    });
  } catch (error) {
    console.error('Error creating client invite:', error);
    return NextResponse.json(
      { error: 'Failed to create client invite' },
      { status: 500 }
    );
  }
}

