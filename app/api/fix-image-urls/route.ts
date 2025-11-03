import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Fix posts with invalid image URLs (function strings instead of actual URLs)
 * This cleans up posts that have the Replicate FileOutput url() function stringified
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    // Find all posts with invalid image URLs (containing function code)
    const { data: posts, error: fetchError } = await supabase
      .from('content_pipeline')
      .select('id, image_url, hook, client_id')
      .not('image_url', 'is', null)
      .not('image_url', 'eq', '');

    if (fetchError) {
      throw fetchError;
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts found',
        fixed: 0,
        total: 0
      });
    }

    let fixed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const post of posts) {
      const imageUrl = post.image_url;
      
      // Check if the image_url contains function code (invalid)
      if (typeof imageUrl === 'string' && 
          (imageUrl.includes('url() {') || 
           imageUrl.includes('function') ||
           imageUrl.includes('return new URL'))) {
        
        console.log(`⚠️  Found invalid image URL in post ${post.id}: ${imageUrl.substring(0, 50)}...`);
        
        // Clear the invalid image URL - user can regenerate
        const { error: updateError } = await supabase
          .from('content_pipeline')
          .update({ image_url: null })
          .eq('id', post.id);

        if (updateError) {
          console.error(`❌ Failed to fix post ${post.id}:`, updateError);
          errors.push(`Post ${post.id}: ${updateError.message}`);
          failed++;
        } else {
          console.log(`✅ Fixed post ${post.id} - cleared invalid image URL`);
          fixed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed} posts with invalid image URLs`,
      fixed,
      failed,
      total: posts.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('❌ Error fixing image URLs:', error);
    return NextResponse.json(
      { 
        error: `Failed to fix image URLs: ${error?.message || String(error)}`,
      },
      { status: 500 }
    );
  }
}

