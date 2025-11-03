# Supabase Storage Setup Guide

## Step 1: Create Storage Bucket

You need to create the storage bucket manually in Supabase Dashboard:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `autosocialai@gmail.com's Project`
3. **Navigate to Storage**: Click "Storage" in the left sidebar
4. **Create New Bucket**:
   - Click "New bucket"
   - **Name**: `post-images` (exactly this name)
   - **Public bucket**: ✅ Enable (check the box)
   - Click "Create bucket"

**Why public?** Social media platforms need to access images, so they must be publicly accessible.

## Step 2: Configure Bucket Policies (Optional)

The default public bucket policy should work, but you can verify:

1. Go to your `post-images` bucket
2. Click "Policies"
3. Ensure there's a policy allowing public read access

## Step 3: Verify Setup

After creating the bucket, the code will automatically:
- ✅ Download images from Replicate
- ✅ Upload to Supabase Storage
- ✅ Store permanent URLs in database
- ✅ Use Supabase URLs going forward

## Step 4: Migrate Existing Images

To migrate existing Replicate URLs to Supabase Storage:

```bash
# Run the migration script
npx tsx scripts/migrate-images-to-storage.ts
```

This will:
- Find all posts with Replicate URLs
- Download each image
- Upload to Supabase Storage
- Update database with new URLs

## Step 5: Monitor Usage

Check your storage usage in Supabase Dashboard:
- **Storage** → Overview
- See total storage used
- See bandwidth usage

**Free tier limits:**
- 1 GB storage
- 2 GB bandwidth/month

## Troubleshooting

### "Storage bucket 'post-images' does not exist"
- Make sure you created the bucket in Supabase Dashboard
- Check the bucket name is exactly `post-images` (case-sensitive)
- Verify the bucket is marked as public

### "Permission denied" errors
- Check RLS policies on the bucket
- Ensure bucket is set to public
- Verify service role key has correct permissions

### Images not showing up
- Check browser console for errors
- Verify image URLs point to `supabase.co` domain
- Check bucket policy allows public read

## What Happens Next

### New Images
- ✅ Automatically stored in Supabase Storage
- ✅ Permanent URLs (won't expire like Replicate)
- ✅ Fast global CDN delivery

### Existing Images
- ⚠️ Still use Replicate URLs (until migrated)
- ✅ Can be migrated using the script
- ✅ Or regenerate to get Supabase URLs

## Cost

**Current usage:** ~7 MB
**Free tier:** 1 GB storage
**Remaining:** ~993 MB

You're all set with the free tier! 🎉

