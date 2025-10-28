# How Client Permission Works

## Understanding the Flow

You're building a **white-label social media posting service** where clients grant YOU permission to post on THEIR behalf. Here's how it works:

## The Two-Party OAuth Flow

### Party 1: YOU (Developer) - One-Time Setup
**What you do:**
1. Create a Meta App at developers.facebook.com (10 minutes, one-time)
2. Get your App ID and App Secret
3. Add callback URL: `https://yourdomain.com/api/auth/meta/callback`
4. That's it! You're done forever.

**Cost:** Free  
**Time:** 10 minutes total  
**Frequency:** Once, ever

### Party 2: YOUR CLIENT - One-Time Permission Grant
**What your client does:**
1. Visits your onboarding URL (e.g., `yourdomain.com/onboard/abc123`)
2. Fills out brand details
3. Clicks "Connect Facebook & Instagram" button
4. Gets redirected to Facebook login
5. Logs in with THEIR Facebook account
6. Sees permission request: "Allow [Your App] to manage posts?"
7. Clicks "Allow"
8. Gets redirected back to your app
9. Done! You now have permission to post

**What this gives YOU:**
- Access token (stored encrypted in your database)
- Permission to post to their Facebook Page
- Permission to post to their Instagram Business Account
- This token lasts 60 days before needing refresh

## Your Current Implementation

Looking at your code, you already have this EXACT flow working:

```43:49:app/onboard/[token]/page.tsx
  const connectSocial = async (platform: 'meta' | 'tiktok') => {
    const clientId = token.split('_')[0];
    const state = token;
    
    const url = `/api/auth/${platform}?state=${state}&client_id=${clientId}`;
    window.location.href = url;
  };
```

This redirects the client to YOUR Meta OAuth endpoint:

```15:28:app/api/auth/meta/route.ts
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
```

Then Meta redirects the client back to YOUR callback:

```6:123:app/api/auth/meta/callback/route.ts
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
```

## What Happens After Permission is Granted

Once a client grants permission:

1. ✅ Token is saved (encrypted) in your database
2. ✅ Your worker service can now post to their pages
3. ✅ Automatic content generation and posting begins
4. ✅ Tokens auto-refresh every 60 days

**You NEVER need to ask the client again** unless they revoke permission.

## Is There an Alternative?

**Short answer: No.**

If you want to post to Facebook/Instagram via API, Meta OAuth is THE ONLY WAY. There is literally no other official method.

**Why?**
- This is how Facebook ensures security
- This is how clients can revoke access if needed
- This is the industry standard (every tool uses this)

**The good news:** Your implementation already handles the hard part! You just need:
1. Meta App ID/Secret (10 min setup, one-time)
2. Clients click one button (they love it - it's professional)

## Common Misconceptions

### "Can't I just use their username/password?"
❌ No - This violates Meta's Terms of Service and risks account bans  
✅ OAuth is the only safe, official way

### "Can't I use some library or API wrapper?"
❌ Those libraries still require Meta OAuth - they just wrap it  
✅ You might as well use your own (free vs paid third-party)

### "Can clients just send me content and I post manually?"
✅ YES! This is totally valid
- Your AI generates content
- Export to a platform like Meta Business Suite
- Client uploads bulk content
- No API needed

**But:** This requires manual work and isn't automated

## Recommended Setup

For your use case (posting to client pages), here's what I recommend:

### Development/Testing (No App Review Needed)
1. Create Meta App in "Development Mode"
2. Test with YOUR OWN pages/accounts
3. Get comfortable with the flow
4. **No App Review required** for testing

### Production (One-Time App Review)
1. Submit your app for review
2. Explain: "We help businesses automate social media posting"
3. Request permissions: `pages_manage_posts`, `instagram_basic`
4. Wait 1-2 days for approval
5. Done forever - all clients can now grant permission

### The Client Experience (Super Simple)

**What your client sees:**
1. You send them: "Setup your account: yourdomain.com/onboard/abc123"
2. Client visits onboarding page
3. Client fills out brand info (1 minute)
4. Client clicks "Connect Facebook" (big blue button)
5. Client logs into Facebook (30 seconds)
6. Client sees: "Allow AutoSocial AI to manage your posts?" → Clicks "Allow"
7. Done! Content starts posting automatically

**Client thinks:** "Wow, this is so professional and easy!"  
**Reality:** It's Meta OAuth, the industry standard

## Summary

| Step | Who Does It | Time | How Often |
|------|-------------|------|-----------|
| Create Meta App | YOU | 10 min | Once |
| Get App ID/Secret | YOU | 2 min | Once |
| Client visits onboarding | CLIENT | 1 min | Once per client |
| Client clicks "Connect" | CLIENT | 30 sec | Once per client |
| Client grants permission | CLIENT | 10 sec | Once per client |
| Your system posts | AUTOMATED | Ongoing | Forever |

**Total work for YOU:** 12 minutes, one-time  
**Total work for CLIENT:** 2 minutes, one-time  
**Ongoing:** Fully automated

This is literally the simplest and most professional approach available. Every social media management tool (Hootsuite, Buffer, Later) uses this exact same flow.

