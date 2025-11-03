# Setup Guide

Complete setup instructions for AutoSocial AI.

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Groq API key
- Replicate API token
- Meta Developer account
- TikTok Developer account

---

## Step 1: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd AutoSocialAi

# Install frontend dependencies
npm install

# Install worker dependencies
cd worker
npm install
cd ..
```

---

## Step 2: Environment Variables

Create `.env` file in project root:

```bash
cp .env.example .env
```

Fill in the following variables:

### Required Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
GROQ_API_KEY=your-groq-api-key
REPLICATE_API_TOKEN=your-replicate-token

# Meta (Facebook & Instagram)
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# TikTok
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting API Keys

**Supabase:**
1. Go to https://supabase.com
2. Create a project
3. Get keys from Settings → API

**Groq:**
1. Go to https://console.groq.com
2. Create account
3. Get API key from API Keys section

**Replicate:**
1. Go to https://replicate.com
2. Create account
3. Get API token from Account → API Tokens

**Meta:**
1. Go to https://developers.facebook.com
2. Create an app
3. Add Facebook Login and Instagram Basic Display products
4. Get App ID and App Secret from Settings → Basic

**TikTok:**
1. Go to https://developers.tiktok.com
2. Create an app
3. Get Client Key and Client Secret from App Details

**Encryption Key:**
Generate a 32-character random string:
```bash
# Using OpenSSL
openssl rand -base64 32

# Or use online generator
# Must be exactly 32 characters
```

---

## Step 3: Database Setup

### Option A: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Initialize Supabase
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Push migration
supabase db push
```

### Option B: Manual Setup

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Open `supabase/migrations/001_initial_schema.sql`
4. Copy and paste into SQL Editor
5. Run the migration

### Verify Tables

Check that these tables exist:
- `clients`
- `social_accounts`
- `brand_assets`
- `content_rules`
- `content_pipeline`
- `post_logs`

---

## Step 4: OAuth Setup

### Meta (Facebook & Instagram)

1. **Create Meta App**
   - Go to https://developers.facebook.com
   - Create new app
   - Add "Facebook Login" and "Instagram Basic Display"

2. **Configure OAuth**
   - Settings → Basic
   - Add authorized redirect URI:
     ```
     http://localhost:3000/api/auth/meta/callback
     ```
   - For production:
     ```
     https://your-app.vercel.app/api/auth/meta/callback
     ```

3. **Set Permissions**
   - Facebook: `pages_manage_posts`, `pages_read_engagement`
   - Instagram: `instagram_basic`, `instagram_content_publish`

4. **Get Credentials**
   - App ID
   - App Secret

See [META_SETUP.md](META_SETUP.md) for detailed instructions.

### TikTok

1. **Create TikTok App**
   - Go to https://developers.tiktok.com
   - Create new app

2. **Configure OAuth**
   - Add redirect URI:
     ```
     http://localhost:3000/api/auth/tiktok/callback
     ```
   - For production:
     ```
     https://your-app.vercel.app/api/auth/tiktok/callback
     ```

3. **Set Permissions**
   - `user.info.basic`
   - `video.upload`

4. **Get Credentials**
   - Client Key
   - Client Secret

See [TIKTOK_SETUP.md](TIKTOK_SETUP.md) for detailed instructions.

---

## Step 5: Run Development Server

### Frontend

```bash
npm run dev
```

Visit `http://localhost:3000`

### Worker (Separate Terminal)

```bash
cd worker
npm run dev
```

Worker will:
- Check for due posts every 30 seconds
- Generate content every 10 minutes
- Refresh tokens every 6 hours

---

## Step 6: Test Setup

### Create Test Client

1. Visit `http://localhost:3000/admin`
2. Click "Create Client"
3. Fill in details
4. Copy onboarding link

### Test OAuth

1. Click onboarding link
2. Connect Facebook account
3. Verify token saved in database

### Test Content Generation

1. Go to client detail page
2. Set schedule and brand
3. Wait for worker to generate content
4. Verify post in Pipeline tab

---

## Troubleshooting

### Environment Variables

**Issue:** `undefined` values
```bash
# Check .env file exists
ls -la .env

# Verify variables are set
node -e "console.log(process.env.SUPABASE_URL)"
```

### Database Connection

**Issue:** Cannot connect to Supabase
```bash
# Check Supabase URL
echo $SUPABASE_URL

# Test connection
curl $SUPABASE_URL/rest/v1/
```

### OAuth Redirect Errors

**Issue:** OAuth callback fails
- Verify redirect URIs match exactly
- Check URLs don't have trailing slashes
- Ensure OAuth apps are configured

### Worker Not Running

**Issue:** Content not generating
```bash
# Check worker logs
cd worker
npm run dev

# Check PM2 (if using)
pm2 status
pm2 logs autosocial-ai-worker
```

### Port Already in Use

**Issue:** Port 3000 occupied
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

---

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Vercel deployment
- Worker deployment
- Environment variables
- OAuth configuration

---

## Next Steps

1. ✅ Complete setup
2. ✅ Test with one client
3. ✅ Verify OAuth flows
4. ✅ Test content generation
5. ✅ Deploy to production

---

## Support

For setup issues:
- Check this guide
- Review error messages
- Check logs
- Contact support

