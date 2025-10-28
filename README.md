# AutoSocial AI - Automatic Content & Posting System

Automated social media content creation and posting system for Facebook, Instagram, and TikTok.

## Features

- 🤖 **AI-Powered Content Generation**
  - Hooks and captions generated via Groq (Llama 3.1 8B)
  - Premium visuals via fal.ai Flux Pro 1.1
  - Automatic brand voice customization

- 📅 **Automated Scheduling**
  - Configurable posting frequency
  - Timezone-aware scheduling
  - Automatic content pipeline management

- 🌐 **Multi-Platform Support**
  - Facebook page posting
  - Instagram Business posting
  - TikTok video publishing

- 🔒 **Enterprise-Grade Security**
  - AES-256 encrypted tokens
  - Automatic token refresh
  - Secure OAuth flows

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Worker**: Node.js + PM2
- **AI**: Groq (Llama 3.1 8B Instant), fal.ai (Flux Pro 1.1)
- **Social APIs**: Meta Graph API, TikTok Content Posting API

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Groq API key
- fal.ai API key
- Meta App credentials
- TikTok Developer credentials

### 1. Clone and Install

```bash
git clone <repository-url>
cd AutoSocialAi
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GROQ_API_KEY` - Groq API key
- `FAL_API_KEY` - fal.ai API key
- `META_APP_ID` - Meta App ID
- `META_APP_SECRET` - Meta App Secret
- `TIKTOK_CLIENT_KEY` - TikTok client key
- `TIKTOK_CLIENT_SECRET` - TikTok client secret
- `ENCRYPTION_KEY` - 32-character encryption key
- `NEXT_PUBLIC_APP_URL` - Your application URL

### 3. Database Setup

Run the migration to create tables:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in supabase/migrations/001_initial_schema.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Setup Worker

In a separate terminal:

```bash
cd worker
npm install
npm run dev
```

## Deployment

### Next.js (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Worker (VPS with PM2)

```bash
# On your VPS
git clone <repository-url>
cd AutoSocialAi/worker
npm install

# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ../ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 startup
pm2 startup
```

## Project Structure

```
AutoSocialAi/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   └── onboard/           # Client onboarding
├── worker/                # Background worker service
│   ├── jobs/              # Scheduled jobs
│   └── utils/             # Helper functions
├── lib/                    # Shared libraries
│   ├── ai/                # AI integrations
│   ├── social/            # Social media APIs
│   ├── supabase/          # Database clients
│   └── crypto/            # Encryption utilities
├── supabase/              # Database migrations
└── components/            # React components
```

## Architecture

### Components

1. **Next.js Frontend** - Admin dashboard and client onboarding
2. **API Routes** - OAuth callbacks, content generation, admin actions
3. **Worker Service** - Scheduled tasks for content generation and posting
4. **Supabase Database** - Storage for clients, accounts, content pipeline

### Workflow

1. **Onboarding**: Client connects social accounts via OAuth
2. **Scheduling**: System generates content based on posting rules
3. **Generation**: AI creates hooks, captions, and images
4. **Publishing**: Worker automatically posts content at scheduled times

## API Endpoints

- `POST /api/admin/clients/invite` - Generate client onboarding link
- `GET /api/auth/meta` - Initiate Meta OAuth
- `GET /api/auth/meta/callback` - Meta OAuth callback
- `GET /api/auth/tiktok` - Initiate TikTok OAuth
- `GET /api/auth/tiktok/callback` - TikTok OAuth callback

## Worker Jobs

- **Check Due Posts** (every 30s) - Publishes scheduled content
- **Generate Content** (every 10m) - Creates new content for clients
- **Refresh Tokens** (every 6h) - Maintains OAuth tokens

## License

Proprietary - All rights reserved
