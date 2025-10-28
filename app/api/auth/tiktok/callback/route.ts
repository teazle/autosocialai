import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto/encryption';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state') || 'unknown';
  const error = searchParams.get('error');

  try {
    if (error) {
      return NextResponse.redirect(
        new URL(`/onboard/${state}?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state || state === 'unknown') {
      return NextResponse.json(
        { error: 'Missing code or state' },
        { status: 400 }
      );
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: clientKey!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token: accessToken, refresh_token: refreshToken, expires_in } = tokenResponse.data;

    // Save to database
    const supabase = createServiceRoleClient();
    const [clientId] = state.split('_');

    await supabase
      .from('social_accounts')
      .insert({
        client_id: clientId,
        platform: 'tiktok',
        token_encrypted: encrypt(accessToken),
        refresh_token_encrypted: encrypt(refreshToken),
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      });

    return NextResponse.redirect(
      new URL(`/onboard/${state}?success=tiktok`, request.url)
    );
  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/onboard/${state}?error=oauth_failed`, request.url)
    );
  }
}

