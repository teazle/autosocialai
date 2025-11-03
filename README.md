# AutoSocial AI - Automated Social Media Management

Automated content creation and multi-platform posting system for Facebook, Instagram, and TikTok.

## 🎯 Overview

AutoSocial AI is a complete social media automation platform that:
- Generates AI-powered content (hooks, captions, images)
- Schedules and posts automatically to Facebook, Instagram, and TikTok
- Manages multiple clients with brand customization
- Provides admin dashboard for content management

## ✨ Features

### For Administrators
- **Dashboard** - Overview of all clients and upcoming posts
- **Client Management** - Create, configure, and manage clients
- **Content Pipeline** - Edit, approve, and publish posts
- **Kill Switch** - Emergency stop for all auto-posting
- **Brand Configuration** - Set voice, colors, banned terms, CTAs
- **Schedule Management** - Configure posting frequency and times
- **Activity Logs** - Track posting history and errors

### For Clients
- **Self-Service Onboarding** - Secure invitation links
- **OAuth Connection** - Connect Facebook, Instagram, TikTok accounts
- **Brand Customization** - Set brand voice and guidelines
- **Content Preview** - See generated content before posting

### For System
- **AI Content Generation** - Groq (Llama 3.1 8B) for captions
- **Image Generation** - Replicate (FLUX Schnell) for visuals
- **Automatic Scheduling** - Timezone-aware posting
- **Multi-Platform Posting** - FB/IG/TikTok in one system
- **Token Management** - Automatic refresh and encryption

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard                           │
│  (Next.js 14 - Client Management & Content Pipeline)       │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌─────────────┐  ┌──────────┐  ┌──────────────┐
│   Supabase  │  │   AI     │  │   OAuth     │
│   Database  │  │ Services │  │   Flows     │
└──────┬──────┘  └────┬─────┘  └────┬─────────┘
       │              │              │
       └──────────────┼──────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  Worker Service │
            │  (Background    │
            │   Processing)   │
            └─────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    Facebook      Instagram      TikTok
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Groq API key
- Replicate API token
- Meta Developer account
- TikTok Developer account

### Installation

```bash
# Clone repository
git clone <repository-url>
cd AutoSocialAi

# Install dependencies
npm install

# Install worker dependencies
cd worker
npm install
cd ..
```

### Configuration

1. Copy `.env.example` to `.env`
2. Fill in all environment variables (see [docs/SETUP.md](docs/SETUP.md))
3. Set up Supabase database (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

### Run Development

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Worker
cd worker
npm run dev
```

Visit `http://localhost:3000/admin`

## 📚 Documentation

- **[EC2_DEPLOYMENT_QUICKSTART.md](docs/EC2_DEPLOYMENT_QUICKSTART.md)** - Single EC2 deployment guide ⭐
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment guide (Vercel)
- **[ARCHITECTURE_EXPLAINED.md](docs/ARCHITECTURE_EXPLAINED.md)** - Why frontend and worker are split ⭐
- **[DEPLOYMENT_COMPARISON.md](docs/DEPLOYMENT_COMPARISON.md)** - AWS vs Cloudflare comparison
- **[AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md)** - AWS deployment guide
- **[CLOUDFLARE_DEPLOYMENT.md](docs/CLOUDFLARE_DEPLOYMENT.md)** - Cloudflare deployment guide
- **[AWS_MCP_SETUP.md](docs/AWS_MCP_SETUP.md)** - AWS MCP Server setup guide ⭐
- **[ADMIN.md](docs/ADMIN.md)** - Admin dashboard usage guide
- **[API.md](docs/API.md)** - API endpoint documentation
- **[SETUP.md](docs/SETUP.md)** - Platform setup (OAuth, APIs)
- **[META_SETUP.md](docs/META_SETUP.md)** - Facebook/Instagram setup
- **[TIKTOK_SETUP.md](docs/TIKTOK_SETUP.md)** - TikTok setup

## 🏛️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Custom
- **Forms**: react-hook-form + zod
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Worker**: Node.js + PM2
- **Encryption**: AES-256 (crypto-js)

### AI Services
- **Content**: Groq (Llama 3.1 8B Instant)
- **Images**: Replicate (FLUX Schnell)

### Social Platforms
- Facebook Graph API
- Instagram Graph API
- TikTok Content Posting API

## 📂 Project Structure

```
AutoSocialAi/
├── app/
│   ├── admin/              # Admin dashboard
│   ├── clients/            # Client detail pages
│   ├── api/                # API routes
│   │   ├── admin/         # Admin endpoints
│   │   ├── auth/          # OAuth flows
│   │   └── clients/       # Client CRUD
│   └── onboard/            # Client onboarding
├── components/
│   ├── ui/                # shadcn/ui components
│   └── ...                # Custom components
├── lib/
│   ├── ai/                # AI integrations
│   ├── social/            # Social media APIs
│   ├── supabase/          # Database clients
│   ├── crypto/            # Encryption
│   └── utils/             # Utilities
├── worker/
│   ├── jobs/              # Scheduled jobs
│   └── utils/             # Helper functions
└── supabase/
    └── migrations/        # Database migrations
```

## 🎯 Usage

### Creating a Client
1. Go to Admin Dashboard
2. Click "Create Client"
3. Fill in brand voice, timezone, industry
4. Copy onboarding link
5. Send to client

### Configuring Brand
1. Open client detail page
2. Go to "Brand & Rules" tab
3. Set brand voice, colors, banned terms
4. Add CTAs and hashtags
5. Save changes

### Setting Schedule
1. Go to "Schedule" tab
2. Set posts per week
3. Select posting days
4. Set posting time
5. Save schedule

### Publishing Content
1. Go to "Pipeline" tab
2. Click "Edit" on a post
3. Review and modify content
4. Click "Save as Draft" or "Approve"
5. Click "Publish Now" for immediate posting

### Kill Switch
- Click "Kill Switch" on admin dashboard
- Red = ON (stopping all auto-posting)
- Green = OFF (auto-posting active)
- Takes effect immediately

## 🔧 Development

### Adding New Components
- Use shadcn/ui for UI components
- Place in `components/ui/`
- Follow existing patterns

### Adding API Routes
- Place in `app/api/`
- Use Next.js 14 App Router
- Handle errors properly
- Return JSON responses

### Adding Worker Jobs
- Place in `worker/jobs/`
- Use PM2 ecosystem config
- Log properly for monitoring

## 📊 Database Schema

- `clients` - Client information
- `social_accounts` - OAuth tokens (encrypted)
- `brand_assets` - Brand configuration
- `content_rules` - Posting schedule
- `content_pipeline` - Generated posts
- `post_logs` - Publishing history

## 🔒 Security

- AES-256 token encryption
- Automatic token refresh
- Secure OAuth flows
- Environment variable protection
- Service role key for database admin operations

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions:
- Check logs first
- Review documentation
- Open an issue
