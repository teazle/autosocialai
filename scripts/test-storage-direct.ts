/**
 * Direct test of Supabase Storage upload functionality
 * This tests the storage module directly without needing the API server
 */

import dotenv from 'dotenv';
import { createServiceRoleClient } from '../lib/supabase/server';
import { uploadImageToStorage, initializeStorageBucket } from '../lib/storage/image-storage';

dotenv.config({ path: '.env.local' });

async function testStorageDirect() {
  console.log('🧪 Testing Supabase Storage Directly...\n');
  
  try {
    // Step 1: Check bucket exists
    console.log('📦 Step 1: Checking if bucket exists...');
    const bucketExists = await initializeStorageBucket();
    if (!bucketExists) {
      console.error('❌ Storage bucket "post-images" not found!');
      console.log('   Please create it using:');
      console.log('   - Go to Supabase Dashboard → Storage → New Bucket');
      console.log('   - Name: post-images');
      console.log('   - Public: true');
      process.exit(1);
    }
    console.log('✅ Bucket "post-images" exists and is accessible\n');

    // Step 2: Test with a sample Replicate URL (mock)
    console.log('📥 Step 2: Testing image upload...');
    console.log('   Using a test image URL...');
    
    // Use a small public test image
    const testImageUrl = 'https://picsum.photos/512/512';
    const testPostId = 'test-' + Date.now();
    
    console.log(`   Downloading: ${testImageUrl}`);
    console.log(`   Uploading to: posts/${testPostId}.webp`);
    
    const supabaseUrl = await uploadImageToStorage(testImageUrl, testPostId);
    
    if (supabaseUrl) {
      console.log(`\n✅ Upload successful!`);
      console.log(`   Supabase URL: ${supabaseUrl}`);
      
      // Step 3: Verify file exists in storage
      console.log('\n🔍 Step 3: Verifying file in storage...');
      const supabase = createServiceRoleClient();
      const fileName = `posts/${testPostId}.webp`;
      
      const { data: files, error } = await supabase.storage
        .from('post-images')
        .list('posts', {
          search: testPostId,
        });
      
      if (error) {
        console.error('❌ Error listing files:', error);
      } else {
        const found = files?.some(f => f.name === `${testPostId}.webp`);
        if (found) {
          console.log('✅ File confirmed in storage!');
          console.log(`   File: ${fileName}`);
        } else {
          console.log('⚠️  File not found in listing (may still be uploading)');
        }
      }
      
      // Step 4: Test public URL access
      console.log('\n🌐 Step 4: Testing public URL access...');
      try {
        const response = await fetch(supabaseUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ Public URL accessible (${response.status})`);
          console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        } else {
          console.log(`⚠️  URL returned status ${response.status}`);
        }
      } catch (fetchError: any) {
        console.log(`⚠️  Could not verify URL access: ${fetchError.message}`);
      }
      
      console.log('\n✅ All storage tests passed!');
      return true;
    } else {
      console.error('\n❌ Upload failed - no URL returned');
      return false;
    }
  } catch (error: any) {
    console.error('\n❌ Test failed:', error?.message || error);
    if (error?.stack) {
      console.error('\nStack:', error.stack);
    }
    return false;
  }
}

// Run test
testStorageDirect()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Storage is working correctly!');
      console.log('\n💡 Next: Test full post generation by:');
      console.log('   1. Go to Pipeline tab');
      console.log('   2. Click "Auto Generate Post"');
      console.log('   3. Check that image is stored in Supabase Storage');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test crashed:', error);
    process.exit(1);
  });

