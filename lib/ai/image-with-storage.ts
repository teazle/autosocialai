import { generateImage as generateReplicateImage } from './replicate';
import { uploadImageToStorage } from '@/lib/storage/image-storage';
import type { ImageGenerationInput } from './replicate';

/**
 * Generate an image using Replicate and automatically store it in Supabase Storage
 * Returns the Supabase Storage URL (permanent) instead of Replicate URL (temporary)
 */
export async function generateImageWithStorage(
  input: ImageGenerationInput,
  postId: string,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<string> {
  // Step 1: Generate image using Replicate (get temporary URL)
  const replicateUrl = await generateReplicateImage(input, retryCount, maxRetries);
  
  // Step 2: Upload to Supabase Storage and get permanent URL
  const supabaseUrl = await uploadImageToStorage(replicateUrl, postId);
  
  if (!supabaseUrl) {
    console.warn('⚠️  Failed to upload to Supabase Storage, falling back to Replicate URL');
    return replicateUrl; // Fallback to Replicate URL if storage fails
  }
  
  return supabaseUrl;
}

/**
 * Upload an existing image URL to Supabase Storage
 * Useful for migrating existing Replicate URLs
 */
export async function migrateImageToStorage(
  replicateUrl: string,
  postId: string
): Promise<string | null> {
  return await uploadImageToStorage(replicateUrl, postId);
}

