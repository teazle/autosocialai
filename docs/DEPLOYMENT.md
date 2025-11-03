# Deployment Guide

Complete guide for deploying AutoSocial AI to production.

**📊 [See detailed comparison: DEPLOYMENT_COMPARISON.md](DEPLOYMENT_COMPARISON.md)** - Compare AWS vs Cloudflare for your specific system

**For AWS deployment, see [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md)**  
**For Cloudflare deployment, see [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)**

## Prerequisites

- GitHub account
- Vercel account (for frontend) OR AWS account (see AWS_DEPLOYMENT.md)
- VPS/Server (for worker) OR AWS EC2/Elastic Beanstalk (see AWS_DEPLOYMENT.md)
- Domain name (optional)

## Part 1: Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com
2. Note your project URL and service role key
3. Run the migration:

```bash
# Using Supabase CLI
supabase init
supabase link --project-ref <your-project-ref>
supabase db push

# Or run manually in Supabase SQL Editor
# Copy contents from supabase/migrations/001_initial_schema.sql
```

## Part 2: Frontend Deployment (Vercel)

### Step 1: Connect Repository

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository

### Step 2: Configure Environment Variables

Add these in Vercel dashboard → Settings → Environment Variables:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-key
FAL_API_KEY=your-fal-key
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
TIKTOK_CLIENT_KEY=your-tiktok-key
TIKTOK_CLIENT_SECRET=your-tiktok-secret
ENCRYPTION_KEY=your-32-char-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 3: Deploy

Click "Deploy" and wait for build to complete.

## Part 3: Worker Deployment (VPS)

### Step 1: Server Setup

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <your-repo-url>
cd AutoSocialAi/worker
npm install
```

### Step 2: Create Environment File

Create `.env` in worker directory:

```bash
cd worker
nano .env
```

Add all environment variables (same as Vercel).

### Step 3: Start Worker

```bash
# From worker directory
pm2 start ../ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs autosocial-ai-worker

# Save PM2 config
pm2 save

# Enable auto-start on reboot
pm2 startup
# Run the command it outputs
```

### Step 4: Set Up Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:retain 30
```

## Part 4: OAuth Callback URLs

### Meta (Facebook & Instagram)

1. Go to https://developers.facebook.com
2. Open your app → Settings → Basic
3. Add authorized redirect URI: `https://your-app.vercel.app/api/auth/meta/callback`

### TikTok

1. Go to https://developers.tiktok.com
2. Open your app → Manage
3. Add redirect URI: `https://your-app.vercel.app/api/auth/tiktok/callback`

## Part 5: Verification

### Test Onboarding

1. Visit admin dashboard
2. Create a client invite
3. Complete onboarding flow
4. Verify tokens saved in database

### Test Posting

1. Wait for worker to generate content
2. Check `content_pipeline` table
3. Verify posts appear on social media

## Monitoring

### Worker Health

```bash
pm2 monit  # Real-time monitoring
pm2 status # Quick status check
```

### Database Monitoring

- Use Supabase dashboard → Logs
- Monitor table sizes
- Check query performance

### Application Monitoring

- Vercel dashboard for frontend metrics
- Enable Vercel Analytics (optional)

## Troubleshooting

### Worker Not Starting

```bash
# Check logs
pm2 logs autosocial-ai-worker --lines 50

# Restart worker
pm2 restart autosocial-ai-worker
```

### OAuth Errors

- Verify callback URLs are correct
- Check app credentials
- Review Meta/TikTok app permissions

### Content Not Generating

- Check Groq API key is valid
- Verify fal.ai API key
- Review worker logs for errors

### Database Connection Issues

- Verify Supabase credentials
- Check network connectivity
- Review RLS policies if enabled

## Scaling

### Horizontal Scaling

- Deploy multiple worker instances
- Use load balancer for API routes
- Implement Redis for distributed locks

### Vertical Scaling

- Increase VPS resources
- Optimize database queries
- Add caching layer

## Security Checklist

- [ ] All environment variables secured
- [ ] Encryption key is strong (32+ chars)
- [ ] Database backups enabled
- [ ] HTTPS enforced
- [ ] OAuth credentials rotated regularly
- [ ] Worker logs cleaned up
- [ ] Monitoring alerts configured

## Backup Strategy

### Database

```bash
# Automated backups in Supabase
# Settings → Database → Backup
# Enable daily backups
```

### Worker Configuration

```bash
# Backup ecosystem.config.js
cp ecosystem.config.js ~/backups/

# Backup .env (encrypted)
gpg -c .env
mv .env.gpg ~/backups/
```

## Support

For issues or questions:
- Check logs first
- Review error messages
- Search GitHub issues
- Contact support team

