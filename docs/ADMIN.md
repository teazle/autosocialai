# Admin Dashboard Guide

Complete guide to using the AutoSocial AI admin dashboard.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Client Management](#client-management)
4. [Brand Configuration](#brand-configuration)
5. [Schedule Setup](#schedule-setup)
6. [Content Pipeline](#content-pipeline)
7. [Publishing Posts](#publishing-posts)
8. [Settings](#settings)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Dashboard

1. Navigate to `/admin`
2. You'll see the admin dashboard with:
   - KPI tiles (Active Clients, Posts This Week, Success Rate)
   - Upcoming posts list
   - Kill switch
   - Client cards

### First Time Setup

1. Create your first client
2. Send onboarding link to client
3. Client connects social accounts
4. Configure brand and schedule
5. Content will be generated automatically

---

## Dashboard Overview

### KPI Tiles

**Active Clients**
- Shows number of clients with status "active"
- Updated in real-time

**Posts This Week**
- Counts posts scheduled for current week
- Includes all clients

**Success Rate**
- Percentage of successful posts
- Calculated from post logs

### Upcoming Posts

- Shows next 10 posts across all clients
- Displays client name and scheduled time
- Click "View" to open post editor

### Kill Switch

- **OFF (Green)** - Auto-posting is active
- **ON (Red)** - All auto-posting stopped
- Takes effect immediately

---

## Client Management

### Creating a Client

1. Click "Create Client" button
2. Fill in the form:
   - **Client Name** (required, min 3 chars)
   - **Brand Voice** (Friendly/Premium/Bold)
   - **Timezone** (default: Asia/Singapore)
   - **Industry** (optional)
   - **Target Audience** (optional)
3. Click "Create Client"
4. Copy the onboarding link
5. Send to client

### Viewing Client Details

1. Click on client name in the list
2. Opens client detail page with 7 tabs:
   - Connections
   - Brand & Rules
   - Schedule
   - Pipeline
   - Assets
   - Logs
   - Settings

### Client Statuses

- **Pending** - Not fully configured
- **Active** - Ready for posting
- **Paused** - Auto-posting stopped for this client
- **Suspended** - Client inactive

---

## Brand Configuration

### Accessing Brand Settings

1. Open client detail page
2. Go to "Brand & Rules" tab
3. Configure:
   - Brand voice
   - Industry and audience
   - Banned terms
   - CTAs
   - Colors
   - Auto-publish toggle

### Brand Voice

Select one of three styles:
- **Friendly** - Casual, approachable tone
- **Premium** - Professional, elegant tone
- **Bold** - Confident, energetic tone

### Banned Terms

Add words/phrases to avoid:
1. Type term in input field
2. Press Enter or click "+"
3. Click "X" to remove

### Brand Colors

Add up to 4 hex colors:
1. Click color picker
2. Select color
3. Or type hex code
4. Use for AI image generation

### CTAs (Call-to-Actions)

Create library of CTAs:
1. Click "Add CTA"
2. Type message
3. Drag to reorder
4. Click X to delete

### Auto-Publish

- **ON** - Posts publish automatically when ready
- **OFF** - Posts require manual approval
  - Status: "generated" → "approved" → "published"

---

## Schedule Setup

### Accessing Schedule

1. Open client detail page
2. Go to "Schedule" tab
3. Configure posting preferences

### Posting Frequency

Set posts per week (1-7):
- Type number or use arrows
- Determines how many posts to generate
- Worker fills gaps automatically

### Posting Days

Select preferred days:
- Click day buttons to toggle
- Selected days highlighted
- At least one day required

### Posting Time

Set preferred posting time:
- Format: HH:MM (e.g., 10:00)
- Timezone-aware
- Posts schedule at this time

### Generate Next 4 Weeks

- Click "Generate Next 4 Weeks"
- Creates posts for next month
- Uses schedule configuration
- Posts appear in Pipeline tab

---

## Content Pipeline

### Accessing Pipeline

1. Open client detail page
2. Go to "Pipeline" tab
3. See all scheduled posts

### Pipeline Statuses

- **Pending** - Awaiting approval
- **Generated** - AI content created
- **Published** - Posted to social media
- **Failed** - Publish error

### Filtering Posts

Click status buttons:
- All - Show all posts
- Pending - Unapproved posts
- Generated - Approved posts
- Published - Successfully posted
- Failed - Error posts

### Editing Posts

1. Click "Edit" icon on any post
2. Composer modal opens
3. Edit content:
   - Hook (max 12 words)
   - Captions (platform-specific)
   - Image
   - Scheduled time
4. Click action:
   - "Save as Draft" - Updates database
   - "Approve" - Changes to pending status
   - "Publish Now" - Posts immediately

### Post Actions

**Edit** - Opens Composer
**Refresh** - Regenerates AI content
**Delete** - Removes post

---

## Publishing Posts

### Automatic Publishing

Posts publish automatically when:
- Status is "pending"
- Scheduled time arrives
- At least one platform connected
- Kill switch is OFF

### Manual Publishing

From Composer modal:
1. Edit post content
2. Click "Publish Now"
3. System posts to all connected platforms
4. Updates status to "published"

### Kill Switch

Emergency stop for all posts:
1. Click "Kill Switch" on dashboard
2. Turns red when ON
3. All publish attempts blocked
4. Existing posts unaffected

---

## Settings

### Accessing Settings

1. Open client detail page
2. Go to "Settings" tab
3. Configure client details

### Client Profile

- **Name** - Update client name
- **Timezone** - Change timezone
- **Email** - Contact email (optional)

### Auto-Posting Control

- **Paused** - Stop auto-posting for this client
- **Active** - Resume auto-posting
- Global kill switch still applies

### Model Preferences

Future feature for:
- Content model selection
- Image model selection

### Delete Client

Danger zone operation:
1. Click "Delete Client"
2. Confirm deletion
3. Removes:
   - Client data
   - Content pipeline
   - Social accounts
   - Brand assets
   - Activity logs

⚠️ **Cannot be undone**

---

## Troubleshooting

### Posts Not Publishing

**Check:**
1. Is kill switch ON?
2. Are social accounts connected?
3. Are tokens valid (not expired)?
4. Is post status "pending"?
5. Check error log in post

### Content Not Generating

**Check:**
1. Is client status "active"?
2. Is schedule configured?
3. Are AI API keys valid?
4. Worker logs for errors

### Connection Issues

**Platform Not Connecting:**
1. Check OAuth app credentials
2. Verify callback URLs
3. Check app permissions
4. Reconnect in Connections tab

### Error Messages

**"Failed to save"**
- Check database connection
- Verify Supabase credentials
- Check RLS policies

**"Failed to publish"**
- Verify platform tokens
- Check platform API status
- Review error log details

---

## Best Practices

### Client Onboarding

1. Send onboarding link immediately
2. Guide client through OAuth
3. Configure brand before scheduling
4. Test with one post before bulk

### Brand Configuration

1. Set clear brand voice
2. Add relevant banned terms
3. Include brand colors for consistency
4. Create CTA library upfront

### Schedule Setup

1. Set realistic posting frequency
2. Choose appropriate posting times
3. Consider target audience timezone
4. Start with 2-3 posts per week

### Content Management

1. Review generated content
2. Edit before approving
3. Check preview before publishing
4. Monitor activity logs regularly

### Monitoring

1. Check dashboard daily
2. Review success rate
3. Monitor upcoming posts
4. Address errors promptly

---

## Support

For additional help:
- Review [API.md](API.md) for API documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment issues
- Review error logs for specifics
- Contact support team

