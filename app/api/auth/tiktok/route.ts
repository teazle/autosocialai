import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state');
  const clientId = searchParams.get('client_id');

  if (!state || !clientId) {
    return NextResponse.json(
      { error: 'Missing state or client_id' },
      { status: 400 }
    );
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;

  if (!clientKey) {
    return NextResponse.json(
      { error: 'TIKTOK_CLIENT_KEY not configured' },
      { status: 500 }
    );
  }

  // Build the TikTok OAuth URL
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic,video.publish,video.upload&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(authUrl);
}

