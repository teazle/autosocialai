# 🚀 Supabase Storage Setup - Quick Start Guide

## ✅ Step 1: Create Storage Bucket (REQUIRED)

**You need to create the bucket manually before using storage:**

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard/project/bdlkvwotgeppljeovcjd
2. Click **"Storage"** in the left sidebar
3. Click **"New bucket"**
4. Configure:
   - **Name**: `post-images` (exactly this name - case sensitive!)
   - **Public bucket**: ✅ **Check this box** (required for social media)
   - Click **"Create bucket"**

**Why public?** Facebook, Instagram, and TikTok need to access images, so they must be publicly accessible.

---

## ✅ Step 2: Test the Setup

After creating the bucket, test it:

1. **Go to Pipeline tab**
2. **Click "Auto Generate Post"**
3. **Check console logs** - you should see:
   - `💾 Uploading image to Supabase Storage...`
   - `✅ Image stored in Supabase: https://...supabase.co/...`
4. **Verify in Assets tab** - image should appear

---

## ✅ Step 3: Migrate Existing Images (Optional)

To migrate your existing 6 images from Replicate URLs to Supabase Storage:

```bash
# Run the migration script
npx tsx scripts/migrate-images-to-storage.ts
```

This will:
- Find all posts with Replicate URLs
- Download each image
- Upload to Supabase Storage
- Update database with new URLs

**Time estimate:** ~30 seconds for 6 images

---

## 📊 What Changed

### ✅ Automatic Image Storage
- **New images** are automatically stored in Supabase Storage
- **Existing images** still use Replicate URLs (until migrated)
- **Fallback**: If storage fails, keeps Replicate URL

### ✅ Updated Endpoints
- `/api/generate-posts` - Stores images automatically
- `/api/generate-post-test` - Stores images automatically
- `/api/pipeline/[postId]/regenerate` - Stores images automatically
- `/api/pipeline/[postId]/regenerate-image` - Stores images automatically
- Worker jobs - Store images automatically

### ✅ Benefits
- ✅ **Permanent URLs** - Won't expire like Replicate
- ✅ **Free tier** - 1 GB storage included
- ✅ **Fast CDN** - Global delivery
- ✅ **Reliable** - Your own storage

---

## 🔍 Verify It's Working

### Check 1: Bucket Created
- Go to Supabase Dashboard → Storage
- You should see `post-images` bucket

### Check 2: Image Stored
- Generate a new post
- Check console logs for: `✅ Image stored in Supabase`
- Check Assets tab - image should appear

### Check 3: Database Updated
- Go to Pipeline tab
- New posts should have URLs like: `https://xxx.supabase.co/storage/v1/object/public/post-images/...`
- (Instead of: `https://replicate.delivery/...`)

---

## 🐛 Troubleshooting

### "Storage bucket 'post-images' does not exist"
**Fix:** Create the bucket in Supabase Dashboard (Step 1 above)

### "Permission denied" errors
**Fix:** 
1. Make sure bucket is **public** ✅
2. Check RLS policies allow public read
3. Verify service role key is correct

### Images not showing
**Fix:**
1. Check browser console for errors
2. Verify image URL starts with `https://xxx.supabase.co`
3. Check Next.js config allows Supabase domains (already done)

### Migration fails
**Fix:**
1. Make sure bucket exists and is public
2. Check service role key in `.env.local`
3. Run migration with debug: Check console output

---

## 💰 Cost Monitoring

**Free tier limits:**
- ✅ **1 GB storage** - Can store ~1,000 images
- ✅ **2 GB bandwidth/month** - Can serve ~2,000 image views

**Current usage:** ~7 MB (plenty of room!)

**When to upgrade:**
- Storage exceeds 1 GB
- Bandwidth exceeds 2 GB/month
- Upgrade to Pro: $25/month (100 GB storage + 250 GB bandwidth)

---

## 🎉 You're All Set!

Once the bucket is created, everything works automatically. New images will be stored in Supabase Storage, and you'll never lose an image again!

**Next:** Create the bucket and test by generating a new post! 🚀

