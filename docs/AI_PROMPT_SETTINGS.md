# AI Prompt Settings Guide

## Overview

AutoSocial AI now supports configurable AI prompts for content and image generation. You can customize the prompts that control how AI generates social media content and images through a user-friendly admin interface.

## Accessing Settings

Navigate to **Admin Dashboard > AI Settings** or visit `/admin/settings` directly.

## Available Prompts

### Content Generation

#### 1. Content System Prompt
Sets the AI's persona and role for generating social media content.

**Placeholders:**
- `{industry}` - Client's industry
- `{brandVoice}` - Brand voice (friendly, premium, bold)
- `{targetAudience}` - Target audience

**Default:**
```
You are an expert social media content creator specializing in {industry}. 
You create engaging, {brandVoice} content that resonates with {targetAudience}. 
Your content is always brand-aligned, platform-optimized, and designed to maximize engagement.
Always return valid JSON without any markdown formatting or code blocks.
```

#### 2. Content User Prompt Template
Defines the structure and requirements for content generation.

**Placeholders:**
- `{brandName}` - Client's brand name
- `{brandVoice}` - Brand voice
- `{voiceDescription}` - Description of brand voice tone
- `{companyDescription}` - Company description
- `{industry}` - Industry
- `{targetAudience}` - Target audience

### Image Generation

#### 3. Image Default Prompt Template
Template for generating images when no custom template is provided.

**Placeholders:**
- `{hook}` - Content hook (main idea)
- `{brandName}` - Brand name
- `{styleKeywords}` - Industry/audience-specific style keywords
- `{colors}` - Brand colors

#### 4. Image Negative Prompt
Excludes unwanted elements from generated images.

**Purpose:** Prevents common image generation issues like text, watermarks, and artifacts.

#### 5. Image Quality Enhancements
Positive keywords added to all image prompts for quality.

**Purpose:** Ensures high-quality, professional images.

## Editing Prompts

1. Go to **Admin Dashboard > AI Settings**
2. Find the prompt you want to edit
3. Make your changes in the textarea
4. Click **Save All Settings**

⚠️ **Warning:** Changes affect all future content generation. Test carefully!

## Placeholder Guide

### Content Generation Placeholders

```plaintext
{brandName} - Client's brand name
{brandVoice} - One of: Friendly, Premium, Bold
{voiceDescription} - Auto-generated tone description
{companyDescription} - Company description
{industry} - Client's industry
{targetAudience} - Target audience description
```

### Image Generation Placeholders

```plaintext
{hook} - Main content hook/idea
{brandName} - Client's brand name
{styleKeywords} - Auto-generated style keywords based on industry/audience
{colors} - Brand colors (comma-separated)
```

## Best Practices

1. **Test Incrementally** - Make small changes and test before large overhauls
2. **Keep Fallbacks** - Don't remove essential instructions
3. **Use Placeholders** - Leverage dynamic placeholders for flexibility
4. **Clear Instructions** - Write clear, specific instructions
5. **Maintain JSON Format** - Content prompts must request valid JSON

## Fallback Behavior

If the database is unavailable or prompts aren't configured, the system falls back to hardcoded defaults. This ensures uninterrupted service.

## Cache

Prompts are cached for 5 minutes to reduce database queries and improve performance. After saving settings, changes take effect within 5 minutes.

## Technical Details

- **Storage:** Prompts stored in `system_settings` table
- **Cache:** 5-minute TTL, in-memory
- **API:** `/api/admin/settings` (GET/POST)
- **Implementation:** `lib/ai/system-prompts.ts` provides helper functions

## Support

If you need to reset prompts to defaults:
1. Contact your system administrator
2. They can restore default values from `supabase/migrations/009_add_system_settings.sql`

## Examples

### Customizing Content Tone

To make all content more formal:

**Content System Prompt:**
```
You are a corporate social media expert specializing in B2B communications in {industry}.
You create professional, {brandVoice} content that speaks to {targetAudience} decision-makers.
Your content maintains corporate standards, is data-driven, and designed for LinkedIn and professional platforms.
Always return valid JSON without any markdown formatting or code blocks.
```

### Emphasizing Visual Quality

To boost image quality even more:

**Image Quality Enhancements:**
```
ultra high quality, professional photography, crisp and sharp, well-composed, balanced composition, perfect lighting, vibrant colors, clean background, 8K quality, magazine cover aesthetic, award-winning photography
```

### Preventing Specific Issues

To prevent certain image problems:

**Image Negative Prompt:**
```
watermark, text, typography, words, letters, characters, writing, font, gibberish, random characters, unreadable text, corrupted text, foreign text, non-English characters, foreign language text, distorted text, blurry text, low-res, blurry, distortion, bad anatomy, bad proportions, duplicate, ugly, deformed, amateur, low quality, pixelated, grainy, noise, artifacts, compression artifacts, bad composition, cluttered, messy, poorly lit, oversaturated, undersaturated, washed out, dark shadows, blown highlights, [your custom exclusions]
```

## Troubleshooting

**Prompts not updating:**
- Check browser console for errors
- Wait 5 minutes for cache to expire
- Verify database connection

**Content quality degrades after changes:**
- Revert to previous version
- Make smaller incremental changes
- Test with one client first

**Placeholders not working:**
- Check placeholder spelling (case-sensitive)
- Ensure placeholders use curly braces `{placeholder}`
- Verify placeholder exists in client data
