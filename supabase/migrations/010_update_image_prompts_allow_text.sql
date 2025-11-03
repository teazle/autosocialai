-- Update image generation prompts to allow readable text but exclude gibberish
-- This migration updates existing system settings to the improved prompts

-- Update image_negative_prompt: Remove blanket text exclusions, only exclude gibberish and unreadable text
UPDATE system_settings 
SET value = 'watermark, gibberish text, random characters, unreadable text, corrupted text, distorted text, blurry text, foreign language text, non-English characters (unless part of design), scrambled letters, meaningless text, jumbled words, low-res, blurry, distortion, bad anatomy, bad proportions, duplicate, ugly, deformed, amateur, low quality, pixelated, grainy, noise, artifacts, compression artifacts, bad composition, cluttered, messy, poorly lit, oversaturated, undersaturated, washed out, dark shadows, blown highlights',
    updated_at = NOW()
WHERE key = 'image_negative_prompt';

-- Update image_default_prompt_template: Remove "text-free, visual only", allow text when appropriate
UPDATE system_settings
SET value = '{hook} | Brand: {brandName}
Setting: Modern, professional social media advertising environment, optimized for digital display
Style: {styleKeywords}, editorial photography, magazine-quality, high-contrast visual
Technical: ultra high quality, professional photography, crisp and sharp, well-composed, balanced composition, perfect lighting, vibrant colors, clean background, clear readable text (if text is included), professional typography
Colors: {colors}
Composition: Balanced, eye-catching, optimized for social media feed (1:1 ratio), clear focal point, professional framing',
    updated_at = NOW()
WHERE key = 'image_default_prompt_template';

-- Update image_quality_enhancements: Remove "text-free, visual only", add text quality keywords
UPDATE system_settings
SET value = 'ultra high quality, professional photography, crisp and sharp, well-composed, balanced composition, perfect lighting, vibrant colors, clean background, clear readable text (if text is included), professional typography',
    updated_at = NOW()
WHERE key = 'image_quality_enhancements';

-- Update content_system_prompt with improved version from Context7 best practices
UPDATE system_settings
SET value = 'You are an expert social media content creator and strategist specializing in {industry}. 

Your expertise includes:
- Creating highly engaging, {brandVoice} content tailored to {targetAudience}
- Optimizing content for Instagram, Facebook, and TikTok with platform-specific best practices
- Crafting compelling hooks that drive action and engagement
- Incorporating relevant hashtags and trending language naturally
- Maintaining brand voice consistency while maximizing reach and engagement

Content Quality Standards:
- All content must be brand-aligned and authentic to the brand voice
- Platform-optimized: Instagram (visual storytelling), Facebook (community engagement), TikTok (trendy and energetic)
- Engagement-focused: Every piece should encourage interaction, sharing, or action
- Industry-relevant: Use appropriate terminology and context for {industry}

Output Format (CRITICAL):
You must return ONLY valid JSON without any markdown formatting, code blocks, or explanatory text. The JSON schema is:
{
  "hook": "string (max 12 words - punchy, curiosity-driven, action-oriented)",
  "caption_ig": "string (120-200 words with 5-10 relevant hashtags, engaging storytelling)",
  "caption_fb": "string (80-120 words, community-focused, conversational)",
  "caption_tt": "string (max 60 words, energetic, trending language)"
}

Remember: The system is configured for JSON mode. Your response must be parseable JSON only.',
    updated_at = NOW()
WHERE key = 'content_system_prompt';

