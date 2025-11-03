import Replicate from 'replicate';
import dotenv from 'dotenv';
import { getImageNegativePrompt, getImageQualityEnhancements } from './system-prompts';
import { getReplicateModel } from './get-replicate-model';

// Load environment variables if not already loaded
dotenv.config();

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

/**
 * Replicate Model Options for Image Generation
 * 
 * Models ranked by use case:
 * 1. ideogram-ai/ideogram-v3-turbo - BEST for text in images + humans (social media quotes, announcements)
 * 2. black-forest-labs/flux-1.1-pro - Best overall quality (humans + text, but slower/costlier)
 * 3. black-forest-labs/flux-schnell - Best value (fast, cheap, good for visuals without text)
 * 4. black-forest-labs/flux-dev - Not recommended (no advantage over flux-schnell)
 */
export type ReplicateModel = 
  | 'ideogram-ai/ideogram-v3-turbo'  // Best for text rendering + humans
  | 'black-forest-labs/flux-1.1-pro' // Best quality, slower
  | 'black-forest-labs/flux-schnell'; // Best value, fast

/**
 * Default model selection based on use case:
 * - ideogram-v3-turbo: Best for social media with text (quotes, announcements, human faces)
 * - flux-schnell: Best for cost-effective visuals without text
 */
const DEFAULT_MODEL: ReplicateModel = process.env.REPLICATE_MODEL as ReplicateModel || 'ideogram-ai/ideogram-v3-turbo';

/**
 * System-wide default negative prompt to prevent common image generation issues
 * This is applied to ALL image generation to prevent mistakes before they happen
 */
const DEFAULT_NEGATIVE_PROMPT = `watermark, gibberish, random characters, unreadable text, corrupted text, distorted text, blurry text, low-res, blurry, distortion, bad anatomy, bad proportions, duplicate, ugly, deformed, amateur, low quality, pixelated, grainy, noise, artifacts, compression artifacts, bad composition, cluttered, messy, poorly lit, oversaturated, undersaturated, washed out, dark shadows, blown highlights`;

/**
 * Enhanced default positive prompt additions to ensure high quality
 * Note: Removed "text-free" to allow text generation when using ideogram or flux-1.1-pro
 */
const DEFAULT_QUALITY_ENHANCEMENTS = `ultra high quality, professional photography, crisp and sharp, well-composed, balanced composition, perfect lighting, vibrant colors, clean background`;

export interface ImageGenerationInput {
  hook: string;
  brandName: string;
  brandColors?: string[];
  logoUrl?: string;
  bannedTerms?: string[];
  industry?: string;
  targetAudience?: string;
  customPromptTemplate?: string;
  customNegativePromptTemplate?: string; // Custom negative prompt from client settings
  imageFeedback?: string[]; // Feedback from validation about image issues
  model?: ReplicateModel; // Override default model selection
  includeText?: boolean; // Whether to allow/generate text in images (for quotes, announcements)
}

export interface ImageGenerationResult {
  imageUrl: string;
  model: ReplicateModel;
}

/**
 * Generate an image using Replicate API
 * 
 * Model Selection Guide:
 * - ideogram-v3-turbo: BEST for social media with text rendering (quotes, human faces)
 * - flux-1.1-pro: Best quality overall but slower and more expensive
 * - flux-schnell: Best value for visuals without text (fast, cheap)
 * 
 * Replicate offers $10 free credits and pay-as-you-go pricing
 * Includes retry logic for better reliability
 */
export async function generateImage(
  input: ImageGenerationInput,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<ImageGenerationResult> {
  // Note: This function is now async, but getReplicateModel is called inside
  // to get the global setting if no model override is provided
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  // Initialize Replicate with custom fetch to avoid Next.js caching issues
  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
    fetch: (url, options) => {
      return fetch(url, { ...options, cache: 'no-store' });
    },
  });

  // Get quality enhancements from database
  const dbQualityEnhancements = await getImageQualityEnhancements();
  const qualityEnhancements = dbQualityEnhancements || DEFAULT_QUALITY_ENHANCEMENTS;

  // Helper function to generate style keywords based on industry and audience (defined before use)
  function getStyleKeywordsForImage(industry?: string, targetAudience?: string): string {
    let styles: string[] = ['premium', 'ad-quality', 'professional'];
    
    // Add industry-specific styles
    if (industry) {
      const industryLower = industry.toLowerCase();
      if (industryLower.includes('fashion') || industryLower.includes('style')) {
        styles.push('fashion-forward', 'stylish', 'trendy');
      } else if (industryLower.includes('tech') || industryLower.includes('software')) {
        styles.push('futuristic', 'modern', 'clean', 'minimalist');
      } else if (industryLower.includes('food') || industryLower.includes('restaurant')) {
        styles.push('appetizing', 'vibrant', 'lifestyle');
      } else if (industryLower.includes('fitness') || industryLower.includes('health')) {
        styles.push('energetic', 'dynamic', 'motivational');
      }
    }
    
    // Add audience-specific styles
    if (targetAudience) {
      const audienceLower = targetAudience.toLowerCase();
      if (audienceLower.includes('young') || audienceLower.includes('millennial') || audienceLower.includes('gen z')) {
        styles.push('contemporary', 'trendy', 'youthful');
      } else if (audienceLower.includes('professional') || audienceLower.includes('executive')) {
        styles.push('sophisticated', 'corporate', 'polished');
      }
    }
    
    return styles.join(', ');
  }

  // Use custom prompt template if provided, otherwise use default
  let prompt: string;
  if (input.customPromptTemplate) {
    // Replace placeholders in custom template
    // Also add quality enhancements to custom templates to ensure consistency
    prompt = input.customPromptTemplate
      .replace('{hook}', input.hook)
      .replace('{brandName}', input.brandName)
      .replace('{colors}', input.brandColors?.join(', ') || 'modern, vibrant')
      .replace('{industry}', input.industry || '')
      .replace('{targetAudience}', input.targetAudience || '');
    
    // Append quality enhancements if not already present (avoid duplication)
    const promptLower = prompt.toLowerCase();
    // Always add quality enhancements (removed text-free check since we now allow text)
    prompt += ` ${qualityEnhancements}`;
  } else {
    // Default prompt with structured format (Best Practice: Subject → Setting → Style → Quality → Colors)
    let contextInfo = '';
    if (input.industry) {
      contextInfo += ` Industry context: ${input.industry}.`;
    }
    if (input.targetAudience) {
      contextInfo += ` Target audience: ${input.targetAudience}.`;
    }
    
    // Get style keywords based on brand voice (implied from brand context)
    const styleKeywords = getStyleKeywordsForImage(input.industry, input.targetAudience);
    
    // Structured prompt following best practices: Subject | Context | Style | Technical | Colors | Composition
    prompt = `${input.hook} | Brand: ${input.brandName}${contextInfo}
Setting: Modern, professional social media advertising environment, optimized for digital display
Style: ${styleKeywords}, editorial photography, magazine-quality, high-contrast visual
Technical: ${qualityEnhancements}
${input.brandColors && input.brandColors.length > 0 ? `Colors: ${input.brandColors.join(', ')}, cohesive color palette, brand-aligned` : 'Colors: Modern, vibrant, attention-grabbing'}
Composition: Balanced, eye-catching, optimized for social media feed (1:1 ratio), clear focal point, professional framing`;
  }

  // Apply image feedback to improve the prompt
  if (input.imageFeedback && input.imageFeedback.length > 0) {
    const imageImprovements: string[] = [];
    
    input.imageFeedback.forEach((feedback) => {
      const feedbackLower = feedback.toLowerCase();
      
      // Extract actionable improvements from feedback
      if (feedbackLower.includes('low quality') || feedbackLower.includes('professional')) {
        imageImprovements.push('ultra high quality', 'professional photography', 'crisp and sharp');
      }
      if (feedbackLower.includes('gibberish') || feedbackLower.includes('random characters') || feedbackLower.includes('unreadable text')) {
        // Improve text quality instead of removing text
        imageImprovements.push('clear readable text', 'professional typography', 'legible fonts');
      }
      if (feedbackLower.includes('non-english') || feedbackLower.includes('foreign language text')) {
        // Ensure text is in intended language
        imageImprovements.push('readable text in intended language', 'clear typography');
      }
      if (feedbackLower.includes('composition') || feedbackLower.includes('layout')) {
        imageImprovements.push('well-composed', 'balanced composition');
      }
    });
    
    if (imageImprovements.length > 0) {
      prompt += ` ${imageImprovements.join(', ')}.`;
    }
  }

  // Start with system-wide default negative prompt (prevents common issues from the start)
  // Get from database, fallback to hardcoded default
  const dbNegativePrompt = await getImageNegativePrompt();
  let negativePrompt = dbNegativePrompt || DEFAULT_NEGATIVE_PROMPT;
  
  // Add custom negative prompt template if provided (combines with default)
  if (input.customNegativePromptTemplate && input.customNegativePromptTemplate.trim().length > 0) {
    negativePrompt += `, ${input.customNegativePromptTemplate.trim()}`;
  }
  
  // Add feedback-based exclusions (additional safeguards if issues were detected)
  if (input.imageFeedback && input.imageFeedback.length > 0) {
    const additionalExclusions: string[] = [];
    
    input.imageFeedback.forEach((feedback) => {
      const feedbackLower = feedback.toLowerCase();
      
      // Add extra emphasis if we've seen these issues before
      // Exclude gibberish and unreadable text, but allow readable text
      if (feedbackLower.includes('gibberish') || feedbackLower.includes('random characters')) {
        additionalExclusions.push('gibberish text', 'random characters', 'unreadable text', 'corrupted text', 'scrambled letters', 'meaningless text');
      }
      if (feedbackLower.includes('non-english') || feedbackLower.includes('foreign language text')) {
        additionalExclusions.push('foreign language text', 'non-English characters (unless part of design)', 'unreadable foreign text');
      }
      if (feedbackLower.includes('unreadable') && !feedbackLower.includes('gibberish')) {
        additionalExclusions.push('unreadable text', 'distorted text', 'blurry text', 'jumbled words');
      }
      if (feedbackLower.includes('quality') && feedbackLower.includes('low')) {
        additionalExclusions.push('low quality', 'pixelated', 'grainy');
      }
    });
    
    // Add additional exclusions if any were found (avoid duplicates)
    if (additionalExclusions.length > 0) {
      const existingLower = negativePrompt.toLowerCase();
      additionalExclusions.forEach(exclusion => {
        if (!existingLower.includes(exclusion.toLowerCase())) {
          negativePrompt += `, ${exclusion}`;
        }
      });
    }
  }
  
  // Add client-specific banned terms
  if (input.bannedTerms && input.bannedTerms.length > 0) {
    const existingLower = negativePrompt.toLowerCase();
    input.bannedTerms.forEach(term => {
      if (!existingLower.includes(term.toLowerCase())) {
        negativePrompt += `, ${term}`;
      }
    });
  }

  // Determine which model to use
  // Priority: input.model (override) > global system setting > default
  let selectedModel: ReplicateModel;
  if (input.model) {
    selectedModel = input.model;
  } else {
    // Get from global system settings (async, but we need to await)
    selectedModel = await getReplicateModel();
  }
  
  // Text handling: By default, allow readable text but exclude gibberish
  // Only exclude text if explicitly requested (includeText: false)
  const shouldExcludeText = input.includeText === false;
  const shouldEnhanceText = input.includeText === true || 
                            (input.includeText === undefined && 
                             (selectedModel === 'ideogram-ai/ideogram-v3-turbo' || selectedModel === 'black-forest-labs/flux-1.1-pro'));
  
  // Update prompts based on text handling preferences
  if (shouldExcludeText) {
    // Explicitly exclude all text when requested
    if (!negativePrompt.toLowerCase().includes('text')) {
      negativePrompt = `text, typography, words, letters, characters, writing, font, ${negativePrompt}`;
    }
    prompt += `, text-free, visual only`;
  } else if (shouldEnhanceText && selectedModel === 'ideogram-ai/ideogram-v3-turbo') {
    // For Ideogram, enhance prompt for text rendering and human faces
    prompt += `, clear readable text, professional typography, human faces, realistic people, diverse representation`;
    // Negative prompt already excludes gibberish (default behavior)
  } else if (shouldEnhanceText) {
    // For other models that support text, enhance for readability
    prompt += `, clear readable text, professional typography`;
    // Negative prompt already excludes gibberish (default behavior)
  }
  // If includeText is undefined and model doesn't auto-enhance, default behavior applies:
  // - Prompts may include text naturally
  // - Negative prompt excludes gibberish but allows readable text

  try {
    // Model-specific parameter configuration
    let inputParams: any;
    
    if (selectedModel === 'ideogram-ai/ideogram-v3-turbo') {
      // Ideogram v3 Turbo - Best for text rendering and human faces
      // Pricing: Typically $0.004-0.01 per image (check current Replicate pricing)
      inputParams = {
        prompt,
        aspect_ratio: '1:1',
        mode: 'auto', // auto, quality, speed
        output_format: 'webp',
        output_quality: 90,
      };
      // Ideogram doesn't use negative_prompt the same way - it's built-in
    } else if (selectedModel === 'black-forest-labs/flux-1.1-pro') {
      // FLUX 1.1 Pro - Best quality for humans and text
      // Pricing: $0.04 per image
      inputParams = {
        prompt,
        num_outputs: 1,
        guidance_scale: 3.5,
        num_inference_steps: 28,
        aspect_ratio: '1:1',
      };
      if (negativePrompt && negativePrompt.trim().length > 0) {
        inputParams.negative_prompt = negativePrompt;
      }
    } else {
      // FLUX Schnell (default) - Best value for visuals without text
      // Pricing: $3 per 1,000 images ($0.003/image)
      inputParams = {
        prompt,
        num_outputs: 1,
        guidance_scale: 3.5,
        num_inference_steps: 4, // flux-schnell requires <= 4
        aspect_ratio: '1:1',
      };
      if (negativePrompt && negativePrompt.trim().length > 0) {
        inputParams.negative_prompt = negativePrompt;
      }
    }
    
    console.log(`🎨 Generating image with ${selectedModel}${shouldExcludeText ? ' (text excluded)' : shouldEnhanceText ? ' (text rendering enhanced)' : ' (text allowed, gibberish excluded)'}`);
    
    const output = await replicate.run(
      selectedModel,
      {
        input: inputParams,
      }
    );

    // Debug logging to understand what Replicate returns
    console.log(`📦 Replicate response type: ${typeof output}, isArray: ${Array.isArray(output)}, value:`, 
      output ? (typeof output === 'object' ? JSON.stringify(output).substring(0, 500) : String(output)) : 'null/undefined');
    
    // Handle null/undefined output
    if (!output) {
      console.error(`❌ Replicate returned null or undefined. This indicates a generation failure.`);
      throw new Error(`Image generation failed: Replicate returned no result. This might be due to:\n- Model failure or timeout\n- Invalid API request\n- Network issues\n\nPlease try again or check your Replicate API status.`);
    }

    // Handle empty array case (generation might have failed silently)
    if (output && Array.isArray(output) && output.length === 0) {
      console.error(`❌ Replicate returned empty array. This might indicate a generation failure.`);
      throw new Error(`Image generation failed: Replicate returned an empty result. This might be due to:\n- Invalid prompt parameters\n- Model timeout or failure\n- API quota exceeded\n\nTry again or check your Replicate account status.`);
    }

    // Replicate returns an array of file URLs or ReadableStream objects
    if (output && Array.isArray(output) && output.length > 0) {
      // Handle different output types: FileOutput, ReadableStream, or URLs
      const firstOutput = output[0];
      console.log(`📦 First output item type: ${typeof firstOutput}, value:`, 
        typeof firstOutput === 'object' ? JSON.stringify(firstOutput).substring(0, 200) : String(firstOutput));
      
      let imageUrlRaw: any;
      
      if (typeof firstOutput === 'string') {
        // Direct URL string
        imageUrlRaw = firstOutput;
      } else if (firstOutput && typeof firstOutput === 'object') {
        // Handle FileOutput object with url() method
        if (typeof firstOutput.url === 'function') {
          try {
            const urlResult = firstOutput.url();
            // Ensure the result is actually a string URL, not another function or object
            if (typeof urlResult === 'string' && urlResult.trim() !== '') {
              imageUrlRaw = urlResult;
            } else if (urlResult && typeof urlResult === 'object' && 'href' in urlResult) {
              // If url() returns a URL object, get the href
              imageUrlRaw = (urlResult as any).href || String(urlResult);
            } else {
              // Fallback: try to extract from the object directly
              imageUrlRaw = (firstOutput as any).href || 
                          (firstOutput as any).source ||
                          String(firstOutput);
            }
          } catch (error) {
            console.warn('Error calling url() method, trying fallback:', error);
            // Fallback if url() throws an error
            imageUrlRaw = (firstOutput as any).href || 
                        (firstOutput as any).source ||
                        String(firstOutput);
          }
        } 
        // Handle ReadableStream - wait for it to resolve
        else if (firstOutput instanceof ReadableStream || firstOutput.constructor?.name === 'ReadableStream') {
          // ReadableStream needs to be consumed - but Replicate usually resolves this automatically
          // Try accessing the URL property if available
          imageUrlRaw = (firstOutput as any).url || String(firstOutput);
        }
        // Try common property names (but exclude functions)
        else {
          const urlProp = (firstOutput as any).url;
          // Only use url property if it's not a function
          if (typeof urlProp === 'string') {
            imageUrlRaw = urlProp;
          } else {
            // Try other properties
            imageUrlRaw = (firstOutput as any).href || 
                        (firstOutput as any).source || 
                        (firstOutput as any).data ||
                        String(firstOutput);
          }
        }
      } else {
        imageUrlRaw = String(firstOutput);
      }
      
      // Always convert to string - ensure imageUrl is a string before any operations
      // Also check that it's not a function stringified
      let imageUrlStr: string;
      if (typeof imageUrlRaw === 'string') {
        imageUrlStr = imageUrlRaw;
      } else if (imageUrlRaw && typeof imageUrlRaw === 'object') {
        // If it's still an object, try to extract URL from it
        imageUrlStr = (imageUrlRaw as any).href || 
                     (imageUrlRaw as any).url || 
                     String(imageUrlRaw);
      } else {
        imageUrlStr = String(imageUrlRaw);
      }
      
      // Final validation: reject if it looks like a function string
      if (imageUrlStr && (imageUrlStr.includes('function') || imageUrlStr.includes('url() {'))) {
        console.error('❌ Extracted URL looks like a function:', imageUrlStr.substring(0, 100));
        throw new Error(`Failed to extract valid URL from Replicate response. Got function instead of URL string.`);
      }
      
      if (!imageUrlStr || imageUrlStr === '[object Object]' || imageUrlStr.trim() === '') {
        console.error(`❌ Failed to extract image URL. First output:`, firstOutput);
        throw new Error(`Could not extract image URL from Replicate response. Output type: ${typeof firstOutput}, Output structure: ${JSON.stringify(firstOutput).substring(0, 200)}`);
      }
      
      // Use the validated string version
      const imageUrl = imageUrlStr;
      
      console.log(`✅ Extracted image URL: ${imageUrl.substring(0, 100)}...`);
      
      // Return the Replicate URL and model - storage will be handled by the caller
      return {
        imageUrl,
        model: selectedModel,
      };
    } else if (output && typeof output === 'string') {
      // Single string output
      const urlStr: string = output;
      console.log(`✅ Received string output: ${urlStr.substring(0, 100)}...`);
      return {
        imageUrl: urlStr,
        model: selectedModel,
      };
    } else if (output && typeof output === 'object' && !Array.isArray(output)) {
      // Handle object output (might be a single object instead of array)
      try {
        const outputStr = JSON.stringify(output);
        console.log(`📦 Trying to extract from object output:`, outputStr.substring(0, 200));
      } catch (e) {
        console.log(`📦 Trying to extract from object output (could not stringify)`);
      }
      const imageUrlRaw = (output as any).url || 
                      (output as any).href || 
                      (output as any).output?.[0] ||
                      (output as any).data ||
                      (Array.isArray((output as any).output) && (output as any).output[0]) ||
                      String(output);
      
      // Ensure it's a string before checking
      const imageUrlStr = typeof imageUrlRaw === 'string' ? imageUrlRaw : String(imageUrlRaw);
      
      if (imageUrlStr && imageUrlStr !== '[object Object]' && imageUrlStr.trim() !== '') {
        console.log(`✅ Extracted image URL from object: ${imageUrlStr.substring(0, 100)}...`);
        return {
          imageUrl: imageUrlStr,
          model: selectedModel,
        };
      }
    }
    
    // If we get here, output format is unexpected
    console.error(`❌ Unexpected Replicate response format. Output:`, output);
    const errorDetails = {
      outputType: typeof output,
      isArray: Array.isArray(output),
      outputLength: Array.isArray(output) ? output.length : undefined,
      outputValue: output ? (typeof output === 'object' ? JSON.stringify(output).substring(0, 500) : String(output)) : 'null/undefined'
    };
    throw new Error(`No image returned from Replicate. Response: ${JSON.stringify(errorDetails)}`);
  } catch (error: any) {
    console.error(`Replicate API error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error?.message || error);
    
    // Handle payment required error with helpful message
    if (error?.response?.status === 402 || 
        error?.message?.toLowerCase().includes('payment') ||
        error?.message?.toLowerCase().includes('credit') ||
        error?.status_code === 402) {
      const helpfulError = new Error(
        `Replicate API: Payment required (402).\n\n` +
        `The free tier has usage limits that have been exceeded.\n\n` +
        `To continue:\n` +
        `1. Add payment method at https://replicate.com/account/billing\n` +
        `2. Or use a different Replicate account with free credits\n` +
        `3. The model being used: ${selectedModel}\n\n` +
        `Note: Replicate charges per API call based on compute time.\n` +
        `Alternatively, you can integrate other free image generation APIs.`
      );
      (helpfulError as any).statusCode = 402;
      (helpfulError as any).isPaymentRequired = true;
      throw helpfulError;
    }
    
    // Determine if we should retry
    const shouldRetry = retryCount < maxRetries && (
      // Retry on network errors
      error?.message?.includes('network') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('ECONNRESET') ||
      error?.message?.includes('ETIMEDOUT') ||
      // Retry on rate limit (with exponential backoff)
      error?.message?.includes('429') ||
      error?.response?.status === 429 ||
      // Retry on server errors
      error?.response?.status >= 500 ||
      error?.response?.status === 502 ||
      error?.response?.status === 503 ||
      error?.response?.status === 504 ||
      // Retry on timeout errors
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNRESET'
    );

    if (shouldRetry) {
      // Exponential backoff: wait 2^retryCount seconds (2s, 4s, 8s)
      const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
      console.log(`⏳ Retrying image generation in ${waitTime / 1000}s... (attempt ${retryCount + 2}/${maxRetries + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Retry with incremented counter
      return generateImage(input, retryCount + 1, maxRetries);
    }

    // Don't retry on authentication errors or invalid requests
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      throw new Error(`Replicate API authentication failed: ${error?.message || 'Invalid API token'}\n\nCheck your REPLICATE_API_TOKEN in .env file`);
    }

    // Final error after retries exhausted
    const errorMessage = error?.message || 'Unknown error';
    const errorDetails = error?.response?.data ? JSON.stringify(error.response.data) : '';
    throw new Error(`Failed to generate image after ${retryCount + 1} attempts. ${errorMessage} ${errorDetails}`);
  }
}

