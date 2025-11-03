import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state');
  const clientId = searchParams.get('client_id');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing client_id' },
      { status: 400 }
    );
  }

  const appId = process.env.META_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/meta/callback`;

  if (!appId) {
    console.error('META_APP_ID not configured');
    return NextResponse.json(
      { 
        error: 'Meta OAuth is not configured. Please set META_APP_ID and META_APP_SECRET in your .env file. See docs/META_SETUP.md for setup instructions.',
        hint: 'Add META_APP_ID and META_APP_SECRET to your environment variables'
      },
      { status: 500 }
    );
  }

  // Use provided state or generate new one
  const oauthState = state || `${clientId}_${Date.now()}`;

  // Build the Meta OAuth URL with Instagram permissions
  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${oauthState}&scope=pages_manage_posts,pages_read_engagement,business_management,instagram_basic&response_type=code`;

  return NextResponse.redirect(authUrl);
}

