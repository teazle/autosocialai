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

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.get(
      'https://graph.facebook.com/v20.0/oauth/access_token',
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
      }
    );

    const { access_token: accessToken } = tokenResponse.data;

    // Get user's pages (Facebook)
    const pagesResponse = await axios.get(
      'https://graph.facebook.com/v20.0/me/accounts',
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    const pages = pagesResponse.data.data;
    if (!pages || pages.length === 0) {
      return NextResponse.redirect(
        new URL(`/onboard/${state}?error=no_pages`, request.url)
      );
    }

    const page = pages[0]; // Use first page for now
    const pageId = page.id;
    const pageAccessToken = page.access_token;

    // Get IG Business Account
    let igBusinessId = null;
    try {
      const igResponse = await axios.get(
        `https://graph.facebook.com/v20.0/${pageId}`,
        {
          params: {
            access_token: accessToken,
            fields: 'instagram_business_account',
          },
        }
      );
      if (igResponse.data.instagram_business_account) {
        igBusinessId = igResponse.data.instagram_business_account.id;
      }
    } catch (error) {
      console.warn('Instagram Business Account not found:', error);
    }

    // Save to database
    const supabase = createServiceRoleClient();
    const [clientId] = state.split('_');

    // Save Facebook account
    await supabase
      .from('social_accounts')
      .insert({
        client_id: clientId,
        platform: 'facebook',
        page_id: pageId,
        token_encrypted: encrypt(pageAccessToken),
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      });

    if (igBusinessId) {
      // Save Instagram account
      await supabase
        .from('social_accounts')
        .insert({
          client_id: clientId,
          platform: 'instagram',
          business_id: igBusinessId,
          page_id: pageId,
          token_encrypted: encrypt(pageAccessToken),
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        });
    }

    return NextResponse.redirect(
      new URL(`/onboard/${state}?success=meta`, request.url)
    );
  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/onboard/${state}?error=oauth_failed`, request.url)
    );
  }
}

