# Testing the Worker Locally

## ✅ What's Fixed

### 1. Supabase - FULLY WORKING
- ✅ Database migrations applied
- ✅ All 6 tables created
- ✅ MCP server installed and configured
- ✅ Connection verified

### 2. Worker - Running Locally RIGHT NOW
The worker is already running on your machine and can be tested **right now** without any VPS deployment.

## 🧪 How to Test Locally

### Current Status
- Worker is checking for due posts every **30 seconds**
- Worker checks for content generation every **10 minutes**
- Worker refreshes tokens every **6 hours**

### Per-Client Configuration

The worker respects EACH client's settings:
- ✅ `posts_per_week` - How many posts a client needs
- ✅ `posting_days` - Which days (e.g., Mon, Wed, Fri)
- ✅ `posting_time` - What time (e.g., "09:00")

**The worker only generates content when a client needs more posts** - it won't generate unnecessary content!

## 🎯 Test Steps

### Step 1: Create a Test Client
```sql
-- Insert a test client
INSERT INTO clients (name, brand_voice, status) 
VALUES ('Test Brand', 'Friendly', 'active');

-- Get the client ID
SELECT id FROM clients WHERE name = 'Test Brand';
```

### Step 2: Add Content Rules
```sql
-- Replace CLIENT_ID with the ID from above
INSERT INTO content_rules (client_id, posts_per_week, posting_days, posting_time)
VALUES ('CLIENT_ID', 3, ARRAY[1,3,5], '09:00');
```

### Step 3: Watch the Worker
The worker will:
1. Check the database every 10 minutes
2. See the client needs 3 posts for the week
3. Generate 3 posts at times matching the posting_days
4. Schedule them in the database

### Step 4: View Generated Content
```sql
SELECT * FROM content_pipeline 
WHERE client_id = 'CLIENT_ID' 
ORDER BY scheduled_at;
```

## 📊 Worker Behavior

### When it generates content:
- Client is `active` status
- Client needs more posts (posts_needed > 0)
- Every 10 minutes it checks all clients

### When it skips:
- Client already has enough posts scheduled
- Client is `pending`, `paused`, or `suspended`
- No active clients exist

## 🚀 Running the Worker

### Start locally:
```bash
cd worker
npm run start
```

### Watch in real-time:
```bash
cd worker
npm run dev  # Auto-restarts on file changes
```

### Stop the worker:
Press `Ctrl+C` in the terminal

## 🏠 VPS Deployment (Future)

- **NOT needed for testing** - you can test everything locally!
- VPS is only for **production** when you want it running 24/7
- Can deploy later using PM2

## 🎯 Current Worker Output

The worker logs will show:
```
🚀 AutoSocial AI Worker Started
Running initial tasks...
✅ Initial tasks completed
Client Test Brand: Needs 3 post(s), Has 0 scheduled
✓ Generated and scheduled post for Test Brand on 12/30/2024
✓ Generated and scheduled post for Test Brand on 12/31/2024
✓ Generated and scheduled post for Test Brand on 1/1/2025
Generated 3 post(s) for client Test Brand
```

## 💡 Quick Test

Want to test immediately? Run this SQL:

```sql
-- Insert test client
WITH new_client AS (
  INSERT INTO clients (name, brand_voice, status)
  VALUES ('My Test Brand', 'Friendly', 'active')
  RETURNING id
)
INSERT INTO content_rules (client_id, posts_per_week, posting_days, posting_time)
SELECT id, 2, ARRAY[1,3,5], '09:00' FROM new_client;
```

The worker (if running) will generate content on the next check (within 10 minutes).

