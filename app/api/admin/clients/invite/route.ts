import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName } = body;

    if (!clientName) {
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
        name: clientName,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Store the onboarding token (you could use a separate table for this)
    // For simplicity, we'll return it here
    // In production, you might want to hash it or store it separately

    const onboardingLink = `${process.env.NEXT_PUBLIC_APP_URL}/onboard/${onboardingToken}`;

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

