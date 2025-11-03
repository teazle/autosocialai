# Instagram Business Connection Fix

## Problem
Users were unable to connect Instagram Business accounts because:
1. The OAuth flow was not requesting the `instagram_basic` permission
2. There was no clear error messaging to help users understand what was wrong
3. The app silently failed when no Instagram account was found

## Solution
I've made the following changes to fix the Instagram connection issue:

### Changes Made

#### 1. Added Instagram Permissions to OAuth Scope
**File**: `app/api/auth/meta/route.ts`

Added `instagram_basic` to the OAuth scope request:
```
scope=pages_manage_posts,pages_read_engagement,business_management,instagram_basic
```

This ensures Meta will request permission to access Instagram Business accounts during the authorization flow.

#### 2. Improved Error Handling
**File**: `app/api/auth/meta/callback/route.ts`

- Added detailed error logging for Instagram connection failures
- Added error message tracking to help identify the specific issue
- Added `ig_error` parameter to redirect URL to indicate Instagram connection failed
- Better console logging to help debug connection issues

#### 3. Updated Documentation
**File**: `docs/META_SETUP.md`

Added comprehensive troubleshooting section for Instagram Business connection issues:
- Step-by-step instructions to connect Instagram to Facebook Page
- Common issues and their solutions
- Clear requirements for Instagram Business accounts

## How to Fix Your Instagram Connection

Follow these steps **in order**:

### Step 1: Convert Instagram to Business Account
1. Open Instagram mobile app
2. Go to **Settings** → **Account** → **Switch to Professional Account**
3. Select **Business Account**
4. Complete the setup

### Step 2: Connect Instagram to Facebook Page
Choose one of these methods:

**Method A (Instagram App):**
1. Go to **Settings** → **Business** → **Facebook Page**
2. Select your Facebook Page
3. Confirm connection

**Method B (Facebook Page Settings):**
1. Go to your Facebook Page on Facebook.com
2. Go to **Page Settings** → **Instagram**
3. Click **Connect Instagram Account**
4. Select your Instagram Business account

### Step 3: Verify Connection
1. Go to your Facebook Page
2. In Page Settings → Instagram section
3. Verify the Instagram account shows as "Connected" or "Active"

### Step 4: Re-authorize the App
1. Once Instagram is connected to the Facebook Page
2. Try connecting again through the app
3. This time it should successfully find the Instagram Business account

## Common Error Messages

### "Instagram Business Account not found"
**Cause**: Instagram account not connected to Facebook Page
**Solution**: Follow Step 2 above to connect your Instagram account

### "No Instagram account linked to this Facebook page"
**Cause**: The Facebook Page you authorized doesn't have an Instagram account linked
**Solution**: Connect Instagram to the Page (Step 2), then re-authorize

### "Missing instagram_basic permission"
**Cause**: Old authorization before we added Instagram permission
**Solution**: Re-authorize the Meta connection (the app now requests this permission)

## Testing

After making these changes:
1. Connect your Instagram Business account to your Facebook Page
2. Try the OAuth flow again
3. Instagram should now connect successfully
4. Check the console logs for detailed error messages if it still fails

## Verification

To verify Instagram is connected:
1. Check your database for a social_accounts entry with `platform='instagram'`
2. The entry should have a `business_id` field populated
3. It should be linked to the same `page_id` as your Facebook account

## Additional Notes

- Instagram MUST be connected BEFORE you authorize the app
- The Instagram account MUST be a Business or Creator account (not personal)
- The connection must be through a Facebook Page (not direct)
- You may need to disconnect and re-connect if the connection was made after authorization

