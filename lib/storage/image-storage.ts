import { createServiceRoleClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'post-images';
const STORAGE_FOLDER = 'posts';

/**
 * Initialize the storage bucket if it doesn't exist
 * Note: This requires manual bucket creation in Supabase Dashboard
 * Bucket name: 'post-images'
 * Public: true (for public URLs)
 */
export async function initializeStorageBucket() {
  const supabase = createServiceRoleClient();
  
  // Check if bucket exists by trying to list it
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error listing buckets:', error);
    return false;
  }
  
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  
  if (!bucketExists) {
    console.log(`⚠️  Storage bucket '${BUCKET_NAME}' not found. Please create it in Supabase Dashboard.`);
    console.log(`   Go to: Storage → New Bucket → Name: ${BUCKET_NAME} → Public: true`);
    return false;
  }
  
  return true;
}

/**
 * Upload an image to Supabase Storage from a URL
 * Downloads the image from the source URL and uploads to Supabase
 * Uses unique filenames with timestamp to prevent caching issues
 */
export async function uploadImageToStorage(
  imageUrl: string,
  postId: string,
  format: 'webp' | 'png' | 'jpg' = 'webp'
): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();
    
    // Initialize bucket check
    const bucketExists = await initializeStorageBucket();
    if (!bucketExists) {
      console.error(`Storage bucket '${BUCKET_NAME}' does not exist`);
      return null;
    }

    console.log(`📥 Downloading image from: ${imageUrl}`);
    
    // Download image from source URL (Replicate)
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || `image/${format}`;
    
    console.log(`📤 Uploading image to Supabase Storage (${(imageBuffer.byteLength / 1024).toFixed(2)} KB)`);
    
    // Use unique filename with timestamp to prevent browser caching issues
    // Format: posts/{postId}-{timestamp}.webp
    const timestamp = Date.now();
    const fileName = `${STORAGE_FOLDER}/${postId}-${timestamp}.${format}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: false, // Don't overwrite - each regeneration gets a new file
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log(`✅ Image uploaded successfully: ${publicUrl}`);
    
    return publicUrl;
  } catch (error: any) {
    console.error('Error in uploadImageToStorage:', error?.message || error);
    return null;
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImageFromStorage(postId: string, format: 'webp' | 'png' | 'jpg' = 'webp'): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();
    const fileName = `${STORAGE_FOLDER}/${postId}.${format}`;
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImageFromStorage:', error);
    return false;
  }
}

/**
 * Get public URL for an image stored in Supabase Storage
 */
export function getStorageImageUrl(postId: string, format: 'webp' | 'png' | 'jpg' = 'webp'): string {
  const supabase = createServiceRoleClient();
  const fileName = `${STORAGE_FOLDER}/${postId}.${format}`;
  
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);
  
  return data.publicUrl;
}

