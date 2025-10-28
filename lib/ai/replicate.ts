import Replicate from 'replicate';
import dotenv from 'dotenv';

// Load environment variables if not already loaded
dotenv.config();

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export interface ImageGenerationInput {
  hook: string;
  brandName: string;
  brandColors?: string[];
  logoUrl?: string;
  bannedTerms?: string[];
}

/**
 * Generate an image using Replicate API (FLUX Schnell model)
 * Replicate offers $10 free credits and pay-as-you-go pricing
 */
export async function generateImage(
  input: ImageGenerationInput
): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
  });

  const prompt = `Premium social media ad visual for ${input.brandName}. 
Palette: ${input.brandColors?.join(', ') || 'modern, vibrant'}. 
Idea from hook: "${input.hook}". 
Style: high-contrast, editorial, ad-quality, professional photography.`;

  const negativePrompt = `watermark, text, low-res, blurry, distortion, bad anatomy, bad proportions, duplicate, ugly, deformed, amateur${input.bannedTerms?.map(t => `, ${t}`).join('') || ''}`;

  try {
    // Use FLUX Schnell - fast and cost-effective image generation model
    const output = await replicate.run(
      'black-forest-labs/flux-schnell',
      {
        input: {
          prompt,
          num_outputs: 1,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          aspect_ratio: '1:1',
        },
      }
    );

    // Replicate returns an array of file URLs
    if (output && Array.isArray(output) && output.length > 0) {
      // Handle FileOutput objects or URLs
      const imageUrl = typeof output[0] === 'string' 
        ? output[0] 
        : output[0].url?.() || String(output[0]);
      
      return imageUrl;
    } else if (output && typeof output === 'string') {
      // Single string output
      return output;
    } else {
      throw new Error('No image returned from Replicate');
    }
  } catch (error) {
    console.error('Replicate API error:', error);
    throw new Error('Failed to generate image');
  }
}

