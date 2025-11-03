import { createServiceRoleClient } from '@/lib/supabase/server';

// Cache for system settings to reduce database queries
let promptsCache: Record<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get system prompts from database or cache
 */
export async function getSystemPrompts(): Promise<Record<string, string>> {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (promptsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return promptsCache;
  }

  try {
    const supabase = createServiceRoleClient();
    
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching system settings:', error);
      // Return empty object if we can't fetch settings
      return {};
    }

    // Convert to object
    promptsCache = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
    
    cacheTimestamp = now;
    
    return promptsCache;
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    return {};
  }
}

/**
 * Get a specific system prompt by key
 */
export async function getSystemPrompt(key: string): Promise<string | null> {
  const prompts = await getSystemPrompts();
  return prompts[key] || null;
}

/**
 * Invalidate the prompts cache (call after updating settings)
 */
export function invalidatePromptsCache() {
  promptsCache = null;
  cacheTimestamp = 0;
}

/**
 * Get content generation system prompt
 */
export async function getContentSystemPrompt(industry?: string, brandVoice?: string, targetAudience?: string): Promise<string> {
  const template = await getSystemPrompt('content_system_prompt');
  
  if (!template) {
    // Fallback to hardcoded default if database is not available
    // Enhanced system prompt following Context7/Groq best practices:
    // - Clear role definition with expertise areas
    // - Specific output format instructions (JSON mode requirement)
    // - Content quality standards and engagement optimization
    return `You are an expert social media content creator and strategist specializing in ${industry || 'various industries'}. 

Your expertise includes:
- Creating highly engaging, ${brandVoice?.toLowerCase() || 'professional'} content tailored to ${targetAudience || 'target audiences'}
- Optimizing content for Instagram, Facebook, and TikTok with platform-specific best practices
- Crafting compelling hooks that drive action and engagement
- Incorporating relevant hashtags and trending language naturally
- Maintaining brand voice consistency while maximizing reach and engagement

Content Quality Standards:
- All content must be brand-aligned and authentic to the brand voice
- Platform-optimized: Instagram (visual storytelling), Facebook (community engagement), TikTok (trendy and energetic)
- Engagement-focused: Every piece should encourage interaction, sharing, or action
- Industry-relevant: Use appropriate terminology and context for ${industry || 'the target industry'}

Output Format (CRITICAL):
You must return ONLY valid JSON without any markdown formatting, code blocks, or explanatory text. The JSON schema is:
{
  "hook": "string (max 12 words - punchy, curiosity-driven, action-oriented)",
  "caption_ig": "string (120-200 words with 5-10 relevant hashtags, engaging storytelling)",
  "caption_fb": "string (80-120 words, community-focused, conversational)",
  "caption_tt": "string (max 60 words, energetic, trending language)"
}

Remember: The system is configured for JSON mode. Your response must be parseable JSON only.`;
  }
  
  // Replace placeholders
  return template
    .replace('{industry}', industry || 'various industries')
    .replace('{brandVoice}', (brandVoice || 'professional').toLowerCase())
    .replace('{targetAudience}', targetAudience || 'target audiences');
}

/**
 * Get image generation default prompt template
 */
export async function getImageDefaultPromptTemplate(): Promise<string> {
  const template = await getSystemPrompt('image_default_prompt_template');
  
  if (!template) {
    // Fallback to hardcoded default
    // Updated: Removed "text-free, visual only" to allow readable text when appropriate
    return `{hook} | Brand: {brandName}
Setting: Modern, professional social media advertising environment, optimized for digital display
Style: {styleKeywords}, editorial photography, magazine-quality, high-contrast visual
Technical: ultra high quality, professional photography, crisp and sharp, well-composed, balanced composition, perfect lighting, vibrant colors, clean background, clear readable text (if text is included), professional typography
Colors: {colors}
Composition: Balanced, eye-catching, optimized for social media feed (1:1 ratio), clear focal point, professional framing`;
  }
  
  return template;
}

/**
 * Get image generation negative prompt
 */
export async function getImageNegativePrompt(): Promise<string> {
  const prompt = await getSystemPrompt('image_negative_prompt');
  
  if (!prompt) {
    // Fallback to hardcoded default
    // Updated: Allow readable text/fonts but exclude gibberish and unreadable text
    return 'watermark, gibberish text, random characters, unreadable text, corrupted text, distorted text, blurry text, foreign language text, non-English characters (unless part of design), scrambled letters, meaningless text, jumbled words, low-res, blurry, distortion, bad anatomy, bad proportions, duplicate, ugly, deformed, amateur, low quality, pixelated, grainy, noise, artifacts, compression artifacts, bad composition, cluttered, messy, poorly lit, oversaturated, undersaturated, washed out, dark shadows, blown highlights';
  }
  
  return prompt;
}

/**
 * Get image quality enhancements
 */
export async function getImageQualityEnhancements(): Promise<string> {
  const enhancements = await getSystemPrompt('image_quality_enhancements');
  
  if (!enhancements) {
    // Fallback to hardcoded default
    // Updated: Removed "text-free, visual only" to allow readable text when appropriate
    return 'ultra high quality, professional photography, crisp and sharp, well-composed, balanced composition, perfect lighting, vibrant colors, clean background, clear readable text (if text is included), professional typography';
  }
  
  return enhancements;
}

/**
 * Get content user prompt template
 */
export async function getContentUserPromptTemplate(): Promise<string> {
  const template = await getSystemPrompt('content_user_prompt_template');
  
  if (!template) {
    // Return empty string if no template, will use hardcoded default
    return '';
  }
  
  return template;
}
