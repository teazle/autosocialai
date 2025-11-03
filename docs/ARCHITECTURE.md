# System Architecture

Technical overview of AutoSocial AI architecture.

## Overview

AutoSocial AI consists of three main components:
1. **Frontend** (Next.js 14) - Admin dashboard and client interface
2. **Backend** (Next.js API Routes) - OAuth, content management, admin APIs
3. **Worker** (Node.js + PM2) - Background jobs for content generation and posting

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Dashboard                       │
│   (Next.js 14 + TypeScript + Tailwind + shadcn/ui)    │
│                                                          │
│  • Client Management                                    │
│  • Content Pipeline                                     │
│  • Brand Configuration                                   │
│  • Schedule Setup                                       │
│  • Publishing Control                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTP/REST API
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   API Layer                              │
│            (Next.js API Routes)                         │
│                                                          │
│  • /api/admin/*        Admin operations                │
│  • /api/clients/*      Client CRUD                     │
│  • /api/auth/*         OAuth flows                     │
│  • /api/pipeline/*     Content management              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Supabase Client
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   Database                               │
│              (Supabase PostgreSQL)                     │
│                                                          │
│  • clients              Client data                     │
│  • social_accounts      OAuth tokens (encrypted)       │
│  • brand_assets         Brand configuration            │
│  • content_rules        Schedule rules                 │
│  • content_pipeline     Generated posts                │
│  • post_logs            Publish history                │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│   AI APIs    │   │ Worker Jobs  │
│              │   │              │
│  • Groq      │   │ • Generate   │
│  • Replicate │   │ • Publish    │
└──────────────┘   │ • Refresh    │
                   └──────┬───────┘
                          │
                          ▼
              ┌──────────────────────┐
              │   Social Platforms   │
              │                      │
              │  • Facebook          │
              │  • Instagram         │
              │  • TikTok            │
              └──────────────────────┘
```

## Component Details

### Frontend (Admin Dashboard)

**Technology:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui

**Key Features:**
- Server-side rendering (SSR)
- Client-side navigation
- Form validation (react-hook-form + zod)
- Real-time updates
- Optimistic UI

**Pages:**
- `/admin` - Main dashboard
- `/clients/[id]` - Client detail with tabs
- `/onboard/[token]` - Client onboarding

**Components:**
- UI components (shadcn/ui)
- Custom components (Composer, badges, forms)
- Tab navigation
- Modal dialogs

### Backend (API Routes)

**Technology:** Next.js API Routes, Supabase

**Authentication:**
- Service role key for admin operations
- OAuth flows for client connections

**Key Endpoints:**
- Admin operations (CRUD, stats)
- OAuth callbacks
- Content pipeline management
- Kill switch control
- Publishing operations

**Security:**
- AES-256 encryption for tokens
- Environment variable protection
- Secure OAuth flows

### Worker Service

**Technology:** Node.js, PM2, TypeScript

**Jobs:**
1. **Check Due Posts** (every 30s)
   - Finds posts ready to publish
   - Calls publishing logic
   - Updates post status

2. **Generate Content** (every 10m)
   - Gets active clients
   - Calls AI for content generation
   - Saves to pipeline

3. **Refresh Tokens** (every 6h)
   - Checks token expiry
   - Refreshes expired tokens
   - Updates database

**Error Handling:**
- Logs all errors
- Retries failed operations
- Updates post status on failure

### Database Schema

**Tables:**

1. **clients**
   - Client information
   - Status, timezone, brand voice

2. **social_accounts**
   - OAuth tokens (encrypted)
   - Platform credentials
   - Token expiry tracking

3. **brand_assets**
   - Brand colors
   - Banned terms
   - CTAs

4. **content_rules**
   - Posting frequency
   - Posting days
   - Posting time

5. **content_pipeline**
   - Generated posts
   - Captions, images
   - Post status

6. **post_logs**
   - Publish history
   - Platform IDs
   - Timestamps

## Data Flow

### Client Onboarding Flow

```
1. Admin creates client
   ↓
2. System generates onboarding link
   ↓
3. Client receives link
   ↓
4. Client connects social accounts (OAuth)
   ↓
5. Tokens encrypted and stored
   ↓
6. Client configured and active
```

### Content Generation Flow

```
1. Worker checks active clients
   ↓
2. Determines posts needed for next 7 days
   ↓
3. Calls Groq API for captions
   ↓
4. Calls Replicate API for images
   ↓
5. Saves to content_pipeline
   ↓
6. Admin reviews in dashboard
```

### Publishing Flow

```
1. Worker finds due posts
   ↓
2. Gets social accounts for client
   ↓
3. Decrypts OAuth tokens
   ↓
4. Posts to each platform (FB/IG/TT)
   ↓
5. Logs results to post_logs
   ↓
6. Updates post status
```

## Security

### Token Storage
- All tokens encrypted with AES-256
- Encryption key stored in environment
- Service role key for database access

### OAuth Security
- Secure state parameters
- HTTPS enforced in production
- Callback URL validation
- Token encryption before storage

### Data Protection
- No plaintext tokens in database
- Environment variables for secrets
- Supabase RLS policies (future)

## Scalability

### Horizontal Scaling
- Multiple worker instances possible
- Stateless API routes
- Database connection pooling

### Vertical Scaling
- Increase VPS resources for worker
- Optimize database queries
- Add caching layer

### Future Enhancements
- Redis for distributed locks
- Queue system for jobs
- CDN for static assets
- Database read replicas

## Monitoring

### Application Logs
- Worker logs via PM2
- API route logging
- Error tracking

### Database Monitoring
- Supabase dashboard
- Query performance
- Storage usage

### External Services
- Groq API usage
- Replicate API usage
- Social platform limits

## Error Handling

### Levels
1. **User-Level** - Friendly error messages
2. **Application-Level** - Logged and handled
3. **System-Level** - Alerting and monitoring

### Recovery
- Automatic retries for transient errors
- Manual intervention for critical failures
- Fallback mechanisms where possible

## Testing

### Current Coverage
- Linter checks (TypeScript)
- No test suite yet (future)

### Future Testing
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows

## Deployment

### Frontend
- Vercel (recommended)
- Automatic builds from Git
- Environment variable configuration

### Worker
- VPS with PM2
- Auto-start on boot
- Log rotation
- Process monitoring

### Database
- Supabase hosting
- Automated backups
- Point-in-time recovery

## Performance

### Optimization Strategies
- Database indexing
- Query optimization
- Image CDN usage
- Caching (future)
- API rate limiting (future)

### Bottlenecks
- AI API latency
- Image generation time
- Social platform rate limits
- Database connection limits

## Maintainability

### Code Organization
- Clear file structure
- TypeScript for type safety
- Component-based architecture
- Separation of concerns

### Documentation
- README for overview
- API documentation
- Deployment guide
- Architecture docs

## Future Enhancements

### Planned Features
- Video generation
- Analytics dashboard
- Multi-language support
- Advanced scheduling
- A/B testing for content

### Technical Improvements
- Test suite
- CI/CD pipeline
- Performance monitoring
- Advanced caching
- Queue system

