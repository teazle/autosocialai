-- Create system_settings table for global AI prompt configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default AI prompts
INSERT INTO system_settings (key, value, description) VALUES
  ('content_system_prompt', 
   'You are an expert social media content creator specializing in {industry}. You create engaging, {brandVoice} content that resonates with {targetAudience}. Your content is always brand-aligned, platform-optimized, and designed to maximize engagement. Always return valid JSON without any markdown formatting or code blocks.',
   'System prompt for Groq content generation. Use placeholders: {industry}, {brandVoice}, {targetAudience}'),
  
  ('content_user_prompt_template',
   '## Brand Context
- Brand Name: {brandName}
- Brand Voice: {brandVoice} (tone: {voiceDescription})
- Company Description: {companyDescription}
- Industry: {industry}
- Target Audience: {targetAudience}

## Content Requirements
- Hook: A punchy, curiosity-driven hook (max 12 words) that creates urgency and compels action
- Instagram Caption: 120-200 words with 5-10 relevant hashtags, engaging storytelling, visual descriptions
- Facebook Caption: 80-120 words, community-focused, conversational tone, encourages discussion
- TikTok Caption: Max 60 words, energetic, trending language, hashtag-friendly, attention-grabbing
- Tailor content specifically for: {targetAudience}
- Incorporate industry context and terminology for: {industry}

## Output Format
Return a JSON object with exactly this structure (no markdown, no code blocks):
{
  "hook": "string (max 12 words)",
  "caption_ig": "string (120-200 words with hashtags)",
  "caption_fb": "string (80-120 words)",
  "caption_tt": "string (max 60 words)"
}',
   'User prompt template for content generation. Use placeholders: {brandName}, {brandVoice}, {voiceDescription}, {companyDescription}, {industry}, {targetAudience}'),
  
  ('image_default_prompt_template',
   '{hook} | Brand: {brandName}
Setting: Modern, professional social media advertising environment, optimized for digital display
Style: {styleKeywords}, editorial photography, magazine-quality, high-contrast visual
Technical: text-free, visual only, ultra high quality, professional photography, crisp and sharp, well-composed, balanced composition, perfect lighting, vibrant colors, clean background
Colors: {colors}
Composition: Balanced, eye-catching, optimized for social media feed (1:1 ratio), clear focal point, professional framing',
   'Default image generation prompt template. Use placeholders: {hook}, {brandName}, {styleKeywords}, {colors}'),
  
  ('image_negative_prompt',
   'watermark, text, typography, words, letters, characters, writing, font, gibberish, random characters, unreadable text, corrupted text, foreign text, non-English characters, foreign language text, distorted text, blurry text, low-res, blurry, distortion, bad anatomy, bad proportions, duplicate, ugly, deformed, amateur, low quality, pixelated, grainy, noise, artifacts, compression artifacts, bad composition, cluttered, messy, poorly lit, oversaturated, undersaturated, washed out, dark shadows, blown highlights',
   'Negative prompt for image generation to prevent unwanted artifacts'),
  
  ('image_quality_enhancements',
   'text-free, visual only, ultra high quality, professional photography, crisp and sharp, well-composed, balanced composition, perfect lighting, vibrant colors, clean background',
   'Quality enhancement keywords added to all image prompts');

-- Create index for lookups
CREATE INDEX idx_system_settings_key ON system_settings(key);
