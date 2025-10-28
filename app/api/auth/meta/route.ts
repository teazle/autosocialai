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

  const appId = process.env.META_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;

  if (!appId) {
    return NextResponse.json(
      { error: 'META_APP_ID not configured' },
      { status: 500 }
    );
  }

  // Build the Meta OAuth URL
  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=pages_manage_posts,pages_read_engagement,business_management&response_type=code`;

  return NextResponse.redirect(authUrl);
}

