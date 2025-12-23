import Replicate from 'replicate';
import dotenv from 'dotenv';

dotenv.config();

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

/**
 * Replicate Model Options for Image-to-Video Conversion
 * 
 * Models ranked by use case:
 * 1. stability-ai/stable-video-diffusion-img2vid - Best quality, smooth motion
 * 2. anotherjesse/zeroscope-v2-xl - Good quality, fast
 * 3. zsxkib/animate-lcm - Fast, good for short clips
 */
export type VideoModel =
  | 'stability-ai/stable-video-diffusion'  // Best quality
  | 'anotherjesse/zeroscope-v2-xl'                 // Good quality, fast
  | 'zsxkib/animate-lcm';                         // Fast, short clips

const DEFAULT_VIDEO_MODEL: VideoModel = (process.env.REPLICATE_VIDEO_MODEL as VideoModel) || 'stability-ai/stable-video-diffusion';

export interface VideoGenerationResult {
  videoUrl: string;
  model: VideoModel;
}

/**
 * Generate a video from an image using Replicate
 * 
 * @param imageUrl - URL of the source image
 * @param options - Optional parameters for video generation
 * @returns Video URL and model used
 */
export async function generateVideoFromImage(
  imageUrl: string,
  options?: {
    model?: VideoModel;
    motionBucketId?: number; // 1-255, higher = more motion
    condAug?: number; // 0-1, conditioning augmentation
    decodingT?: number; // Number of frames to decode
    numFrames?: number; // Number of frames in output video
  }
): Promise<VideoGenerationResult> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
    fetch: (url, options) => {
      return fetch(url, { ...options, cache: 'no-store' });
    },
  });

  const selectedModel = options?.model || DEFAULT_VIDEO_MODEL;

  console.log(`🎬 Generating video from image with ${selectedModel}...`);

  try {
    let inputParams: any;

    if (selectedModel === 'stability-ai/stable-video-diffusion') {
      // Stable Video Diffusion - Best quality
      inputParams = {
        image: imageUrl,
        motion_bucket_id: options?.motionBucketId || 127, // Medium motion
        cond_aug: options?.condAug || 0.02,
        decoding_t: options?.decodingT || 14, // Number of frames to decode
        num_frames: options?.numFrames || 14, // Output video frames (14 = ~0.5s at 30fps)
      };
    } else if (selectedModel === 'anotherjesse/zeroscope-v2-xl') {
      // Zeroscope v2 XL - Good quality, fast
      inputParams = {
        image: imageUrl,
        num_frames: options?.numFrames || 24, // ~1 second at 24fps
        num_inference_steps: 50,
        guidance_scale: 17.5,
      };
    } else {
      // AnimateLCM - Fast, short clips
      inputParams = {
        image: imageUrl,
        num_frames: options?.numFrames || 16, // ~0.5s at 30fps
        num_inference_steps: 4,
        guidance_scale: 1.0,
      };
    }

    const output = await replicate.run(selectedModel, {
      input: inputParams,
    });

    // Handle output - Replicate returns array of file URLs or ReadableStream
    let videoUrl: string | null = null;

    if (output && Array.isArray(output) && output.length > 0) {
      const firstOutput = output[0];

      if (typeof firstOutput === 'string') {
        videoUrl = firstOutput;
      } else if (firstOutput && typeof firstOutput === 'object') {
        if (typeof firstOutput.url === 'function') {
          try {
            const urlResult = firstOutput.url();
            if (typeof urlResult === 'string' && urlResult.trim() !== '') {
              videoUrl = urlResult;
            } else if (urlResult && typeof urlResult === 'object' && 'href' in urlResult) {
              videoUrl = (urlResult as any).href || String(urlResult);
            }
          } catch (error) {
            console.warn('Error calling url() method:', error);
            videoUrl = (firstOutput as any).href || (firstOutput as any).source || String(firstOutput);
          }
        } else {
          videoUrl = (firstOutput as any).url || (firstOutput as any).href || String(firstOutput);
        }
      }
    } else if (typeof output === 'string') {
      videoUrl = output;
    }

    if (!videoUrl) {
      throw new Error('No video URL returned from Replicate');
    }

    // Validate URL
    try {
      new URL(videoUrl);
    } catch (e) {
      throw new Error(`Invalid video URL format: ${videoUrl.substring(0, 100)}`);
    }

    console.log(`✅ Video generated: ${videoUrl.substring(0, 100)}...`);

    return {
      videoUrl,
      model: selectedModel,
    };
  } catch (error: any) {
    console.error('Video generation error:', error);

    if (error?.statusCode === 402 || error?.isPaymentRequired) {
      throw new Error('Video generation requires Replicate credits');
    }

    throw new Error(`Failed to generate video: ${error?.message || String(error)}`);
  }
}

