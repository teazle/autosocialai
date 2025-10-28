# TikTok Developer Setup Guide

This guide will walk you through creating a TikTok app to obtain your Client Key and Client Secret for social media posting.

## Prerequisites

- A TikTok account
- A TikTok for Developers account (free)
- At least 100 followers on your TikTok account (for API access approval)
- Compliance with TikTok's API Terms of Service

## Step 1: Create a TikTok Developer Account

1. **Go to TikTok for Developers**
   - Visit: https://developers.tiktok.com/
   - Click "Login" in the top right
   - Use your TikTok credentials to log in

2. **Complete Your Profile** (First-time setup)
   - Fill in your developer information
   - Verify your email
   - Accept the Developer Terms

## Step 2: Create a TikTok App

1. **Navigate to Apps**
   - Click "My Apps" in the top navigation
   - Click "Create" to create a new app

2. **Fill in App Details**
   - **App Name**: Enter your app name (e.g., "AutoSocial AI")
   - **App Description**: Describe your app's purpose
   - **Category**: Select "Marketing Automation" or appropriate category
   - **Logo**: Upload an app icon (at least 256x256px)

3. **Submit Application**
   - Click "Create"
   - You may need to wait for initial approval (usually instant for basic apps)

## Step 3: Get Your Credentials

1. **Go to App Dashboard**
   - Once your app is created, you'll see the app dashboard

2. **Find Your Credentials**
   - Click on your app in "My Apps"
   - Navigate to **Basic Information** section
   - You'll find:
     - **Client Key** → Copy this as `TIKTOK_CLIENT_KEY`
     - **Client Secret** → Click "Show" and copy as `TIKTOK_CLIENT_SECRET`

## Step 4: Configure App Settings

### Add Redirect URI

1. Go to **Platform Settings** or **Basic Information**
2. Under **Redirect URI**, add:
   ```
   https://yourdomain.com/api/auth/tiktok/callback
   ```
   For local development:
   ```
   http://localhost:3000/api/auth/tiktok/callback
   ```
3. Click "Save"

### Request Scopes/Permissions

1. Go to **Scopes** or **Permissions** section
2. Request the following scopes:
   - `user.info.basic` - Basic user information
   - `video.upload` - Upload videos to TikTok
   - `video.publish` - Publish videos to TikTok
3. Save changes

## Step 5: Submit for Review (Important!)

⚠️ **Your app MUST be approved before you can use it in production**

1. **Check Requirements**
   - Your TikTok account needs at least 100 followers
   - Complete profile with bio and profile picture
   - Have at least one published video

2. **Prepare Application Materials**
   - App name and description
   - Use case description: "Automated social media content posting"
   - Demo video showing your app in action
   - Screenshots of your application

3. **Submit for Review**
   - Go to **App Review** or **Permissions**
   - For each scope you need, click "Request Access"
   - Fill out the review form:
     - Describe how you'll use the permission
     - Upload demo video
     - Provide test credentials if needed
   - Submit for review

4. **Wait for Approval**
   - Review typically takes 1-3 business days
   - You'll receive an email when approved/rejected

## Step 6: Testing Without Approval (Sandbox Mode)

**For Development Only**: TikTok may offer sandbox mode for testing
- Limited to your own TikTok account only
- Use this for development and testing
- Cannot post to production before approval

## Step 7: Update Your Environment Variables

Add these values to your `.env` file:

```env
# TikTok OAuth
TIKTOK_CLIENT_KEY=your-client-key-here
TIKTOK_CLIENT_SECRET=your-client-secret-here

# App URL (must match redirect URI in TikTok dashboard)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # for development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # for production
```

## Testing the Integration

1. **Test OAuth Flow**:
   - Visit your app's onboarding URL
   - Click "Connect TikTok Account"
   - Authorize the app on TikTok
   - Check that the redirect works correctly

2. **Test Video Posting**:
   - Use your app to post a test video
   - Verify video appears on your TikTok account
   - Check video privacy settings (PUBLIC/PRIVATE)

## Troubleshooting

### Common Issues

**"Redirect URI mismatch"**
- Ensure your callback URL in TikTok app settings matches exactly
- Include the full URL with protocol (http:// or https://)
- No trailing slashes

**"Invalid scope"**
- Your app must be approved for the requested scopes
- Wait for app review if not approved yet
- Check that scopes are correctly configured in TikTok dashboard

**"Insufficient permissions"**
- Ensure your TikTok app has proper permissions granted
- Re-authenticate if permissions were revoked
- Check if app is still approved

**"App not approved"**
- Your app must pass TikTok's review process
- Cannot post to production without approval
- Use sandbox mode for development

**"Token expired"**
- TikTok tokens expire after a certain period
- Implement token refresh using the refresh token
- Your app handles this automatically

### Development vs Production

- **Sandbox Mode**: Only works with your own account
- **Approved Mode**: Works with any authorized user
- Switch between modes in App Dashboard → Settings

## TikTok API Documentation

- **TikTok for Developers**: https://developers.tiktok.com/
- **OAuth Documentation**: https://developers.tiktok.com/doc/oauth-sync-pixel/
- **Content Posting API**: https://developers.tiktok.com/doc/upload-videos/
- **API Reference**: https://developers.tiktok.com/doc/webhooks-reference/

## Security Notes

⚠️ **Keep Your Credentials Secure**:
- Never commit Client Key or Client Secret to version control
- Store them in environment variables only
- Never expose them in client-side code
- Regenerate if compromised

⚠️ **Token Security**:
- Tokens are encrypted in your database
- Tokens auto-refresh when they expire
- Refresh tokens should be stored securely (your app handles this with encryption)

## Video Requirements

When posting videos to TikTok, ensure:
- **Format**: MP4
- **Duration**: Minimum 3 seconds
- **Aspect Ratio**: Vertical (9:16) or square (1:1)
- **Max File Size**: 287 MB
- **Resolution**: 1080x1920 recommended

## Rate Limits

Be aware of TikTok API rate limits:
- Video upload: Limited per day
- API calls: Rate limited per minute/hour
- Check current limits in TikTok dashboard

## Next Steps

After setting up TikTok:
1. ✅ Set up [Meta](./META_SETUP.md) for Facebook/Instagram
2. ✅ Configure your [Supabase Database](../SETUP_SUPABASE_MCP.md)
3. ✅ Set up [Groq AI](https://groq.com/) for content generation
4. ✅ Set up [fal.ai](https://fal.ai/) for image generation
5. ✅ Configure your worker service for automated posting

