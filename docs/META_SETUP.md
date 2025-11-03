# Meta App Setup Guide

This guide will walk you through creating a Meta (Facebook) app to obtain your App ID and App Secret for social media posting.

## Prerequisites

- A Facebook account
- A Facebook Business Manager account (recommended)
- Access to at least one Facebook Page
- An Instagram Business Account connected to your Facebook Page (for Instagram posting)

## Step 1: Create a Meta App

1. **Go to Meta for Developers**
   - Visit: https://developers.facebook.com/
   - Log in with your Facebook account

2. **Create New App**
   - Click on "My Apps" in the top right
   - Select "Create App"
   - Choose "Business" as the app type
   - Click "Next"

3. **Fill in App Details**
   - **App Display Name**: Enter your app name (e.g., "AutoSocial AI")
   - **Contact Email**: Your business email
   - **App Purpose**: Select "Business Management"
   - Click "Create App"

## Step 2: Configure Your App

### Basic Settings

1. Go to **Settings** → **Basic** in the left sidebar
2. Here you'll find:
   - **App ID**: Copy this value → This is your `META_APP_ID`
   - **App Secret**: Click "Show" and copy the value → This is your `META_APP_SECRET`

### Add Products

1. Go to **Dashboard**
2. Add the following products by clicking "Set Up":
   - **Facebook Login** (required for OAuth)
   - **Instagram Basic Display** (for Instagram posting)
   - **Page Management** (for Facebook posting)

### Configure OAuth Redirect URI

1. Go to **Facebook Login** → **Settings** (in left sidebar under Products)
2. Add your callback URL to **Valid OAuth Redirect URIs**:
   ```
   https://yourdomain.com/api/auth/meta/callback
   ```
   For local development:
   ```
   http://localhost:3000/api/auth/meta/callback
   ```

3. Click "Save Changes"

## Step 3: Configure App Permissions

### Facebook Login Settings

1. Go to **Facebook Login** → **Settings**
2. Under **Client OAuth Settings**:
   - Enable "Web OAuth Login"
   - Valid OAuth Redirect URIs: Add your callback URL (see above)

### Request Permissions

Your app needs specific permissions to post content. Your OAuth flow requests these automatically:
- `pages_manage_posts` - Post to Facebook Pages
- `pages_read_engagement` - Read Page engagement data
- `business_management` - Manage business assets
- `instagram_basic` - Access Instagram Business accounts (required for Instagram posting)

## Step 4: App Review (Important!)

⚠️ **For Testing**: Your app can work in "Development Mode" for testing with:
- App developers
- Test users
- Test Instagram accounts

⚠️ **For Production**: To post to real pages and Instagram accounts:
1. Complete App Review for these permissions:
   - `pages_manage_posts`
   - `instagram_basic` 
   - `pages_show_list`
   - `business_management`

2. **App Review Process**:
   - Go to **App Review** → **Permissions and Features**
   - Request each permission
   - Provide detailed use cases
   - Submit test credentials
   - Wait for approval (can take several days)

## Step 5: Configure Business Manager (Recommended)

1. **Go to Business Settings**
   - Visit: https://business.facebook.com/
   - Create or access your Business Manager account

2. **Create a Meta Business System User** (for server-side posting):
   - Go to Business Settings → System Users
   - Click "Add" → "Create New System User"
   - Give it a name (e.g., "AutoSocial AI Service")
   - Click "Create System User"
   - Go to System Users → Assign Assets
   - Select your system user
   - Assign pages and Instagram accounts

3. **Generate System User Token**:
   - Click "Generate New Token"
   - Select your app
   - Grant permissions:
     - `pages_show_list`
     - `pages_manage_posts`
     - `instagram_basic`
     - `business_management`
   - Copy the token (you can use this as a long-lived token)

## Step 6: Connect Instagram Business Account

⚠️ **CRITICAL - META REQUIREMENT**: This is **NOT** optional. Instagram posting **REQUIRES** connecting Instagram to a Facebook Page. This is a Meta/Instagram API requirement that cannot be bypassed.

Meta's Instagram Graph API works through Facebook Pages, not direct Instagram connections. Your app must access Instagram through its connected Facebook Page.

### Why This Is Required

**Meta's Architecture**: The Instagram Graph API requires:
1. Instagram Business account (required by Meta)
2. Facebook Page (required by Meta)
3. Page → Instagram connection (required by Meta)

**You cannot post to Instagram via API without this connection.** There is no workaround. This is how Meta's API works.

### Why You Might See "Cannot Connect with Instagram Business"

If you're getting an error when trying to connect Instagram, it's likely because:

1. **Your Instagram account is not linked to your Facebook Page** ⚠️ REQUIRED BY META
2. **Your Instagram account is not a Business account**
3. **Your Meta app doesn't have the `instagram_basic` permission**

### Step-by-Step Fix:

1. **Convert to Instagram Business Account** (required):
   - Open Instagram mobile app on your phone
   - Go to **Settings** → **Account** → **Switch to Professional Account**
   - Select **Business Account**
   - Follow the prompts to complete setup

2. **Connect Instagram to Facebook Page** (required):
   - In Instagram mobile app: **Settings** → **Business** → **Facebook Page**
   - Select your Facebook Page (the same one you'll authorize in the app)
   - Confirm the connection
   
   **OR via Facebook:**
   - Go to your Facebook Page settings
   - Navigate to **Instagram** section
   - Click **Connect Instagram Account**
   - Select your Instagram Business account

3. **Verify Connection**:
   - Go to your Facebook Page on Facebook.com
   - Check that the Instagram account is listed in the Page's Instagram section
   - The connection must show as "Active" or "Connected"

### Important Notes

**For Your Clients**: Each client must:
1. Have a Facebook Page (or create one)
2. Have an Instagram Business/Creator account
3. Connect their Instagram to their Facebook Page
4. THEN authorize your app with that Facebook Page

**You cannot automatically create this connection for them.** They must do it themselves through Instagram settings.

### Common Issues

**"Instagram Business Account not found"**
- Make sure the Instagram account is actually a Business or Creator account
- Verify the Instagram account is connected to your Facebook Page in Facebook Page settings
- The account MUST be linked BEFORE authorizing the app

**"No Instagram account linked to this Facebook page"**
- Go to Page Settings → Instagram on Facebook
- Connect your Instagram Business account
- Re-authorize the app after connecting

## Step 7: Update Your Environment Variables

Add these values to your `.env` file:

```env
# Meta OAuth (Facebook & Instagram)
META_APP_ID=your-app-id-here
META_APP_SECRET=your-app-secret-here
```

## Testing the Integration

1. **Test OAuth Flow**:
   - Visit your app's onboarding URL
   - Click "Connect Meta Account"
   - Authorize the app
   - Check that pages/Instagram accounts are connected

2. **Test Facebook Posting**:
   - Use the admin dashboard to generate content
   - Verify posts appear on your Facebook Page

3. **Test Instagram Posting**:
   - Use the admin dashboard to generate content
   - Verify posts appear on your Instagram account

## Troubleshooting

### Common Issues

**"Redirect URI mismatch"**
- Ensure your callback URL in Facebook Login settings matches exactly
- Include the full URL with protocol (http:// or https://)

**"Invalid OAuth access token"**
- Tokens expire after 60 days
- Use the refresh token endpoint to get new tokens

**"Page not found"**
- User must grant `pages_manage_posts` permission
- Page must have admin role assigned to your app

**"Instagram Business Account not found" or "Cannot connect with Instagram Business"**
- Your Instagram account MUST be a Business or Creator account
- Your Instagram account MUST be connected to the Facebook Page you're authorizing
- The connection must happen BEFORE you try to authorize the app
- Go to your Facebook Page → Settings → Instagram to verify the connection
- If not connected: Go to Instagram app → Settings → Business → Facebook Page and connect it

**"App not in Live Mode"**
- App must be in "Live" mode to post to production pages
- Or app must be in "Development" mode with test pages/accounts

### Development vs Production

- **Development Mode**: Only works with test users and test pages
- **Live Mode**: Works with real users and pages (requires App Review)
- Switch between modes in App Dashboard → Settings

## Additional Resources

- [Meta for Developers](https://developers.facebook.com/)
- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [OAuth Flow Documentation](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)

## Security Notes

⚠️ **Keep Your App Secret Secure**:
- Never commit App Secret to version control
- Store it in environment variables only
- Never expose it in client-side code
- Regenerate if compromised

⚠️ **Token Security**:
- Access tokens are encrypted in the database
- Tokens are auto-refreshed every 60 days
- Store tokens securely (your app handles this with encryption)

## Next Steps

After setting up Meta:
1. Follow similar steps for [TikTok Setup](./TIKTOK_SETUP.md)
2. Configure your [Supabase Database](../SETUP_SUPABASE_MCP.md)
3. Set up [Groq AI](https://groq.com/) for content generation
4. Set up [fal.ai](https://fal.ai/) for image generation

