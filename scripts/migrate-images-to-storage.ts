/**
 * Migration script to upload existing Replicate URLs to Supabase Storage
 * Run this once to backfill all existing images
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { uploadImageToStorage } from '@/lib/storage/image-storage';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrateImages() {
  console.log('🚀 Starting image migration to Supabase Storage...\n');
  
  const supabase = createServiceRoleClient();
  
  // Get all posts with Replicate URLs (not already in Supabase)
  const { data: posts, error } = await supabase
    .from('content_pipeline')
    .select('id, image_url, hook')
    .not('image_url', 'is', null)
    .like('image_url', '%replicate.delivery%');
  
  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }
  
  if (!posts || posts.length === 0) {
    console.log('✅ No images to migrate (all images already migrated or no images found)');
    return;
  }
  
  console.log(`Found ${posts.length} posts with Replicate URLs to migrate\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const post of posts) {
    try {
      console.log(`📤 Migrating post ${post.id}...`);
      console.log(`   Hook: ${post.hook?.substring(0, 50)}...`);
      console.log(`   Source: ${post.image_url}`);
      
      const supabaseUrl = await uploadImageToStorage(post.image_url!, post.id);
      
      if (supabaseUrl) {
        // Update post with Supabase URL
        const { error: updateError } = await supabase
          .from('content_pipeline')
          .update({ image_url: supabaseUrl })
          .eq('id', post.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ Migrated: ${supabaseUrl}\n`);
        successCount++;
      } else {
        console.log(`   ❌ Failed to upload\n`);
        failCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`   ❌ Error migrating post ${post.id}:`, error?.message || error);
      failCount++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successfully migrated: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📦 Total: ${posts.length}`);
}

// Run migration
migrateImages()
  .then(() => {
    console.log('\n✅ Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

