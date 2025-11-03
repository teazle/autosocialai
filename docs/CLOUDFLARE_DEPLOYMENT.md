# Cloudflare Deployment Guide

Complete guide for deploying AutoSocial AI to Cloudflare.

## Overview

Cloudflare offers two excellent options for deploying Next.js applications:
1. **Cloudflare Pages** - Best for static/hybrid Next.js apps
2. **Cloudflare Workers** - For full Next.js with server-side rendering using OpenNext adapter

## Cloudflare MCP

Cloudflare may have MCP (Model Context Protocol) support available. If you have Cloudflare MCP configured, you can use it for automated deployments and infrastructure management.

**Note:** Check your MCP configuration or Cloudflare dashboard for MCP integration options.

## Deployment Options

### Option 1: Cloudflare Pages (Recommended for Static/Hybrid Next.js)

Cloudflare Pages provides free hosting with excellent global CDN and automatic deployments from Git.

#### Prerequisites
- Cloudflare account (free tier works)
- GitHub/GitLab/Bitbucket repository
- Wrangler CLI (optional, for advanced features)

#### Steps

1. **Connect Repository to Cloudflare Pages:**

   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Pages** → **Create a project**
   - Connect your Git repository
   - Select your repository and branch

2. **Configure Build Settings:**

   **Build command:**
   ```bash
   npm run build
   ```

   **Build output directory:**
   ```
   .next
   ```

   **Root directory:** (if your Next.js app is in a subdirectory)
   ```
   /
   ```

3. **Environment Variables:**

   Add these in Cloudflare Pages → Your Project → Settings → Environment Variables:

   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GROQ_API_KEY=your-groq-key
   REPLICATE_API_TOKEN=your-replicate-token
   META_APP_ID=your-meta-app-id
   META_APP_SECRET=your-meta-app-secret
   TIKTOK_CLIENT_KEY=your-tiktok-key
   TIKTOK_CLIENT_SECRET=your-tiktok-secret
   ENCRYPTION_KEY=your-32-char-key
   NEXT_PUBLIC_APP_URL=https://your-app.pages.dev
   ```

   **Note:** For production, add these under the "Production" environment tab.

4. **Deploy:**
   - Cloudflare Pages will automatically build and deploy on every push to your connected branch
   - Manual deployments can be triggered from the dashboard

#### Custom Domain
- Go to **Custom domains** in your Pages project
- Add your domain
- Update DNS records as instructed

---

### Option 2: Cloudflare Workers with OpenNext (Full Next.js SSR)

For full Next.js features including server-side rendering and API routes, use Cloudflare Workers with the OpenNext adapter.

#### Prerequisites
- Cloudflare account
- Node.js 18+
- Wrangler CLI

#### Installation

1. **Install OpenNext Cloudflare Adapter:**

```bash
npm install @opennextjs/cloudflare
```

2. **Install Wrangler CLI:**

```bash
npm install -D wrangler
# or globally
npm install -g wrangler
```

#### Configuration

1. **Create `opennext.config.ts`:**

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Optional: Customize caching behavior
  // cache: {
  //   handler: ".open-next/cache",
  //   path: ".open-next/cache",
  // },
});
```

2. **Create `wrangler.toml`:**

```toml
name = "autosocial-ai"
main = ".open-next/worker.js"
compatibility_date = "2025-01-15"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

# Environment variables (also set via Wrangler secrets for production)
[vars]
NEXT_PUBLIC_APP_URL = "https://your-app.workers.dev"
```

3. **Update `package.json` scripts:**

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "build:cloudflare": "opennextjs-cloudflare build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
  }
}
```

#### Build and Deploy

1. **Authenticate with Cloudflare:**

```bash
npx wrangler login
```

2. **Build for Cloudflare:**

```bash
npm run build:cloudflare
```

3. **Preview locally:**

```bash
npm run preview
# or
npx wrangler dev
```

4. **Deploy to production:**

```bash
npm run deploy
# or
npx wrangler deploy
```

#### Set Environment Variables (Secrets)

Use Wrangler to set secrets (they won't appear in `wrangler.toml`):

```bash
# Set individual secrets
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put REPLICATE_API_TOKEN
npx wrangler secret put META_APP_ID
npx wrangler secret put META_APP_SECRET
npx wrangler secret put TIKTOK_CLIENT_KEY
npx wrangler secret put TIKTOK_CLIENT_SECRET
npx wrangler secret put ENCRYPTION_KEY
```

Or set multiple at once:

```bash
npx wrangler secret put SUPABASE_URL <value> --env production
```

#### Accessing Secrets in Code

Secrets are available in Workers via the `env` parameter:

```typescript
// In API routes or server components
export async function GET(request: Request, { env }: { env: Env }) {
  const supabaseUrl = env.SUPABASE_URL;
  // Use secret...
}
```

---

### Option 3: Hybrid Setup (Pages + Workers)

Deploy frontend on Cloudflare Pages and run worker as a Cloudflare Worker with scheduled triggers.

#### Frontend on Pages

Follow **Option 1** above for the Next.js frontend.

#### Worker as Cloudflare Worker

1. **Convert Worker to Cloudflare Worker:**

Create `worker-cloudflare/index.ts`:

```typescript
// Cloudflare Worker for scheduled jobs
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Run your worker jobs here
    // Import functions from your existing worker
    ctx.waitUntil(processJobs(env));
  },
  
  async fetch(request: Request, env: Env): Promise<Response> {
    // For manual triggers via HTTP
    if (request.url.includes('/trigger-jobs')) {
      await processJobs(env);
      return new Response('Jobs triggered', { status: 200 });
    }
    return new Response('Worker running', { status: 200 });
  }
};

async function processJobs(env: Env) {
  // Your existing worker job logic
  // Check due posts, generate content, refresh tokens
}
```

2. **Configure `wrangler.toml` for Worker:**

```toml
name = "autosocial-ai-worker"
main = "worker-cloudflare/index.ts"
compatibility_date = "2025-01-15"
compatibility_flags = ["nodejs_compat"]

# Schedule triggers
[triggers]
crons = [
  "*/30 * * * * *",  # Every 30 seconds - check due posts
  "*/10 * * * *",    # Every 10 minutes - generate content
  "0 */6 * * *"      # Every 6 hours - refresh tokens
]
```

3. **Deploy Worker:**

```bash
cd worker-cloudflare
npm install
npx wrangler deploy
```

---

## Required Files

### For Cloudflare Pages

No additional files needed if using standard Next.js build.

### For Cloudflare Workers (OpenNext)

1. **`opennext.config.ts`** (already created above)
2. **`wrangler.toml`** (already created above)

---

## Post-Deployment Checklist

1. ✅ Update OAuth callback URLs:
   - Meta: `https://your-app.pages.dev/api/auth/meta/callback` or `https://your-app.workers.dev/api/auth/meta/callback`
   - TikTok: `https://your-app.pages.dev/api/auth/tiktok/callback` or `https://your-app.workers.dev/api/auth/tiktok/callback`

2. ✅ Test admin dashboard access
3. ✅ Test client onboarding flow
4. ✅ Verify worker is running (if using scheduled Workers)
5. ✅ Test content generation
6. ✅ Monitor Cloudflare dashboard for usage and errors

---

## Environment Variables Reference

### Required for Frontend

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GROQ_API_KEY
REPLICATE_API_TOKEN
META_APP_ID
META_APP_SECRET
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
ENCRYPTION_KEY
NEXT_PUBLIC_APP_URL
```

### Setting Secrets for Workers

```bash
# Interactive mode (recommended)
npx wrangler secret put VARIABLE_NAME

# Or set directly (not recommended for secrets)
# Use wrangler.toml [vars] for non-sensitive values
```

---

## Cost Estimates

### Cloudflare Pages
- **Free tier:** Unlimited requests, 500 builds/month
- **Pro tier ($20/month):** Unlimited builds, better analytics
- **Estimated:** **$0/month** for small-medium traffic on free tier

### Cloudflare Workers
- **Free tier:** 100,000 requests/day, 10ms CPU time per request
- **Paid tier ($5/month):** 10M requests/month included
- **Estimated:** **$0-5/month** depending on usage

**Total estimated cost: $0-25/month** (much cheaper than AWS!)

---

## Troubleshooting

### Build Fails on Pages

```bash
# Check build logs in Cloudflare dashboard
# Common issues:
# - Missing environment variables
# - Build command incorrect
# - Node version mismatch
```

### Worker Not Running

```bash
# Check Worker logs
npx wrangler tail

# View Worker analytics
npx wrangler deployments list
```

### Environment Variables Not Available

For Workers, ensure you're using `wrangler secret put` and accessing via `env` parameter.

For Pages, check that variables are set for the correct environment (Production/Preview).

### Next.js API Routes Not Working

- Ensure using OpenNext adapter for full SSR support
- Or use Cloudflare Pages Functions for API routes
- Check `wrangler.toml` configuration

---

## Performance Optimization

### Cloudflare CDN
- Automatic global CDN caching
- Smart routing for lowest latency

### Caching
- Configure caching headers in Next.js
- Use Cloudflare Cache Rules (optional)

### Image Optimization
- Use Cloudflare Images (optional)
- Configure `next/image` with Cloudflare domains

---

## Advantages of Cloudflare

✅ **Free tier is very generous**
✅ **Global CDN automatically**
✅ **Fast deployments**
✅ **Excellent performance**
✅ **Built-in DDoS protection**
✅ **SSL certificates included**
✅ **Easy Git integration**
✅ **Workers for serverless functions**

---

## Migration from Vercel/AWS

1. Export environment variables from current provider
2. Create Cloudflare account and project
3. Import environment variables
4. Connect repository
5. Update OAuth callback URLs
6. Deploy and test
7. Update DNS if using custom domain

---

## Next Steps

Once you provide:
1. **Which option do you prefer?** (Pages, Workers with OpenNext, or Hybrid)
2. **Git repository URL**
3. **Cloudflare account email** (if you want me to help set it up)
4. **Environment variables** (confirm you have them ready)

I can:
- Generate the exact configuration files
- Help with step-by-step deployment
- Troubleshoot any issues
- Set up scheduled Workers for your background jobs



