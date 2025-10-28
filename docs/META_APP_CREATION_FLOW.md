# Meta App Creation - Step-by-Step Guide

## Step-by-Step Instructions for Creating Your Meta App

Follow these exact steps to create your Meta app for social media posting.

### Step 1: Initial App Creation

1. Go to https://developers.facebook.com/
2. Click **"My Apps"** (top right)
3. Click **"Create App"**

### Step 2: Choose App Type

**IMPORTANT:** Select the correct option:

- ✅ **Select: "Business"**
- ❌ Don't select: Consumer, None, etc.

**Why "Business"?**
- Required for managing pages and posting
- Only business apps get access to page management
- Required for Instagram posting
- Supports OAuth flows for client permissions

### Step 3: App Details

Fill in the form:

**App Display Name**: `AutoSocial AI` (or your app name)  
**Contact Email**: Your business email

**App Purpose**: This is where you choose your use case:
- ✅ Select **"Manage clients' social media presence"** or
- ✅ Select **"Automate content publishing"** or
- ✅ Select **"Build a social media management tool"**

(Any of these work - they all enable the same permissions)

### Step 4: Configure Products

After creating the app, you need to add these products:

1. **Facebook Login** (Required for OAuth)
   - Go to your app Dashboard
   - In the left sidebar, find "Products" section
   - Click **"Add Product"** button (or find "Facebook Login" in the products list)
   - If it's not visible, go to: Dashboard → **Products** → **Facebook Login** → Click **"Set Up"**
   
2. **Instagram Basic Display** (For Instagram posting)
   - Go to Dashboard → **Products**
   - Look for **"Instagram"** in the products list
   - Click **"Set Up"** if it appears
   
   **Note**: If you can't find "Instagram Basic Display" as a separate product, that's OK. You can still access Instagram features through Facebook Login and the Graph API.

**Important**: In newer Meta apps, you don't need to add "Page Management" as a separate product. Those permissions are granted through Facebook Login and the OAuth scopes you request.

### Step 5: Set Up Facebook Login

1. Go to **Products** → **Facebook Login** → **Settings**

2. **Valid OAuth Redirect URIs**: Add:
   ```
   http://localhost:3000/api/auth/meta/callback
   https://yourdomain.com/api/auth/meta/callback
   ```
   (Replace `yourdomain.com` with your actual domain)

3. **Client OAuth Settings**:
   - ✅ Enable "Web OAuth Login"
   - ✅ Enable "Embedded Browser OAuth Login"

4. Click **Save Changes**

### Step 6: Get Your Credentials

1. Go to **Settings** → **Basic**

2. Copy these values:
   - **App ID** → This is your `META_APP_ID`
   - **App Secret** → Click "Show" and copy → This is your `META_APP_SECRET`

3. Add these to your `.env` file:
   ```env
   META_APP_ID=your-app-id-here
   META_APP_SECRET=your-app-secret-here
   ```

### Step 7: Configure Permissions (Development Mode)

For **Development Mode** (testing), you can test with:
- Your own Facebook pages
- Your own Instagram accounts
- Test users

**Permissions you'll request** (these are set in your code):
- `pages_manage_posts` - Post to Facebook Pages
- `pages_read_engagement` - Read engagement metrics
- `business_management` - Manage business assets

These are already in your OAuth flow - no additional setup needed for development.

### Step 8: Development vs Production

#### Development Mode (Now)
- App Review: **NOT REQUIRED**
- Works with: Your own accounts and test users
- Good for: Development and testing
- Time to start: **Immediate**

#### Production Mode (Later)
- App Review: **REQUIRED**
- Works with: All client accounts
- Good for: Real production use
- Time to start: After App Review approval (1-2 days)

### Step 9: App Review (For Production Use)

**When you're ready to go live:**

1. Go to **App Review** → **Permissions and Features**

2. Request these permissions:
   - `pages_manage_posts`
   - `instagram_basic` (for Instagram posting)
   - `pages_read_engagement`

3. **Use Case Description**: 
   ```
   Our application helps businesses automate their social media content 
   publishing by scheduling and posting content to their Facebook Pages 
   and Instagram Business accounts on their behalf. Users grant permission 
   through OAuth to allow our system to post content according to their 
   approved schedules.
   ```

4. **Screencast Requirements**:
   - Record a video showing:
     1. User visiting onboarding URL
     2. Clicking "Connect Facebook"
     3. Logging in and granting permissions
     4. Content being posted to their page

5. Submit and wait 1-2 days for approval

## Checklist

After creating the app, verify you have:

- [ ] Created Meta App with type "Business"
- [ ] Added "Facebook Login" product (required - this enables OAuth)
- [ ] Set OAuth redirect URIs in Facebook Login settings
- [ ] Copied App ID to `.env`
- [ ] Copied App Secret to `.env`
- [ ] Tested with your own accounts
- [ ] (Optional) Added Instagram product if available
- [ ] (Optional) Submitted for App Review for production

## Configuration Summary

Your code requests these permissions automatically when clients authorize:

```26:26:app/api/auth/meta/route.ts
  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=pages_manage_posts,pages_read_engagement,business_management&response_type=code`;
```

- `pages_manage_posts` - Post content to pages
- `pages_read_engagement` - Read metrics
- `business_management` - Manage business assets

## Common Mistakes to Avoid

❌ **Don't**: Select "Consumer" app type  
✅ **Do**: Select "Business" app type

❌ **Don't**: Forget to add callback URL  
✅ **Do**: Add both `localhost` and production URLs

❌ **Don't**: Skip OAuth redirect URI setup  
✅ **Do**: Configure redirect URIs in Facebook Login settings

❌ **Don't**: Share your App Secret publicly  
✅ **Do**: Keep it in `.env` and never commit to git

## Next Steps

1. ✅ Create the app (this guide)
2. ✅ Add credentials to `.env`
3. ✅ Test with your own pages
4. ✅ Test OAuth flow with a test account
5. ✅ Build and deploy your app
6. ⏳ Submit for App Review (when ready for production)

## Testing Your Setup

Once configured, test the flow:

1. Run your app: `npm run dev`
2. Visit: `http://localhost:3000/api/admin/clients/invite` (or your invite endpoint)
3. Get an onboarding token
4. Visit: `http://localhost:3000/onboard/[token]`
5. Click "Connect Facebook & Instagram"
6. Log in with your Facebook account
7. Grant permissions
8. Verify pages are saved in database

If this works, your setup is correct! 🎉

