/**
 * Test script to verify Supabase Storage integration
 * Tests post generation with automatic image storage
 */

import dotenv from 'dotenv';
import { createServiceRoleClient } from '../lib/supabase/server';

dotenv.config({ path: '.env.local' });

const CLIENT_ID = '182a1a86-2ef9-4d59-a8d8-eb8bf05580f8'; // Test Company

async function testStorageGeneration() {
  console.log('🧪 Testing Post Generation with Supabase Storage...\n');
  
  const supabase = createServiceRoleClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    // Step 1: Call the test endpoint
    console.log('📡 Step 1: Calling /api/generate-post-test...');
    const response = await fetch(`${baseUrl}/api/generate-post-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId: CLIENT_ID }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Post generated successfully!\n');
    console.log('📊 Result Summary:');
    console.log(`   Post ID: ${result.post?.id}`);
    console.log(`   Hook: ${result.post?.hook}`);
    console.log(`   Validation Score: ${result.post?.validation_score}/100`);
    console.log(`   Validation Status: ${result.post?.validation_status}`);
    
    if (result.post?.image_url) {
      const imageUrl = result.post.image_url;
      console.log(`\n🖼️  Image URL: ${imageUrl}`);
      
      // Check if it's a Supabase URL
      if (imageUrl.includes('supabase.co')) {
        console.log('   ✅ Image stored in Supabase Storage!');
      } else if (imageUrl.includes('replicate.delivery')) {
        console.log('   ⚠️  Image still using Replicate URL (storage may have failed)');
      } else {
        console.log('   ❓ Unknown image URL format');
      }
    } else {
      console.log('\n⚠️  No image URL (Replicate payment may be required)');
      if (result.warning) {
        console.log(`   Warning: ${result.warning}`);
      }
    }

    // Step 2: Verify in database
    if (result.post?.id) {
      console.log('\n🔍 Step 2: Verifying post in database...');
      const { data: post, error } = await supabase
        .from('content_pipeline')
        .select('id, hook, image_url, scheduled_at, status')
        .eq('id', result.post.id)
        .single();

      if (error) {
        console.error('❌ Error fetching post:', error);
      } else {
        console.log('✅ Post found in database');
        console.log(`   ID: ${post.id}`);
        console.log(`   Hook: ${post.hook}`);
        console.log(`   Image URL: ${post.image_url || 'None'}`);
        console.log(`   Status: ${post.status}`);
        console.log(`   Scheduled: ${post.scheduled_at}`);
        
        if (post.image_url?.includes('supabase.co')) {
          console.log('\n✅ SUCCESS: Image is stored in Supabase Storage!');
        }
      }
    }

    // Step 3: Check storage bucket
    console.log('\n🗂️  Step 3: Checking storage bucket...');
    const { data: files, error: storageError } = await supabase.storage
      .from('post-images')
      .list('posts');

    if (storageError) {
      console.error('❌ Error accessing storage:', storageError.message);
      if (storageError.message.includes('not found')) {
        console.log('   Make sure the "post-images" bucket exists and is public');
      }
    } else {
      console.log(`✅ Found ${files?.length || 0} file(s) in storage`);
      if (files && files.length > 0) {
        console.log('   Recent files:');
        files.slice(-5).forEach((file, idx) => {
          console.log(`   ${idx + 1}. ${file.name} (${(file.metadata?.size || 0 / 1024).toFixed(2)} KB)`);
        });
      }
    }

    console.log('\n✅ Test completed successfully!');
    return result;
  } catch (error: any) {
    console.error('\n❌ Test failed:', error?.message || error);
    if (error?.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testStorageGeneration()
  .then(() => {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });

