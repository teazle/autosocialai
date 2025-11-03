import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { uploadImageToStorage } from '@/lib/storage/image-storage';

/**
 * Migrate existing Replicate URLs to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    console.log('🚀 Starting image migration to Supabase Storage...\n');
    
    // Get all posts with Replicate URLs
    const { data: posts, error } = await supabase
      .from('content_pipeline')
      .select('id, image_url, hook')
      .not('image_url', 'is', null)
      .like('image_url', '%replicate.delivery%');
    
    if (error) {
      throw error;
    }
    
    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images to migrate',
        migrated: 0,
      });
    }
    
    console.log(`Found ${posts.length} post(s) with Replicate URLs to migrate\n`);
    
    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];
    
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
          results.push({
            postId: post.id,
            success: true,
            newUrl: supabaseUrl,
          });
        } else {
          console.log(`   ❌ Failed to upload\n`);
          failCount++;
          results.push({
            postId: post.id,
            success: false,
            error: 'Upload failed',
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`   ❌ Error migrating post ${post.id}:`, error?.message || error);
        failCount++;
        results.push({
          postId: post.id,
          success: false,
          error: error?.message || 'Unknown error',
        });
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📦 Total: ${posts.length}`);
    
    return NextResponse.json({
      success: true,
      message: `Migration completed: ${successCount} succeeded, ${failCount} failed`,
      migrated: successCount,
      failed: failCount,
      total: posts.length,
      results,
    });
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

