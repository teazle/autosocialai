import axios from 'axios';
import dotenv from 'dotenv';
import { getContentSystemPrompt } from './system-prompts';

// Load environment variables if not already loaded
dotenv.config();

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export interface ContentGeneration {
  hook: string;
  caption_ig: string;
  caption_fb: string;
  caption_tt: string;
}

export interface ContentGenerationInput {
  brandName: string;
  brandVoice: 'Friendly' | 'Premium' | 'Bold' | 'Luxury';
  companyDescription?: string;
  industry?: string;
  targetAudience?: string;
  topic?: string;
  keywords?: string[];
  feedback?: string; // AI editor feedback for improvement
  previousAttempt?: ContentGeneration; // Previous content that failed validation
  // AI Brand Analysis (from brand analyzer)
  brandAnalysis?: {
    writing_style?: {
      tone?: string;
      vocabulary_level?: string;
      sentence_style?: string;
      common_phrases?: string[];
      avoid_phrases?: string[];
    };
    content_strategy?: {
      key_themes?: string[];
      value_propositions?: string[];
      call_to_actions?: string[];
    };
    brand_personality?: string;
    brand_summary?: string;
  };
}

/**
 * Generate social media content using Groq AI
 */
export async function generateContent(
  input: ContentGenerationInput
): Promise<ContentGeneration> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  // Helper function to get voice descriptions (defined before use)
  function getVoiceDescription(voice: string): string {
    const descriptions: Record<string, string> = {
      'Friendly': 'warm, approachable, conversational, relatable',
      'Premium': 'sophisticated, refined, elegant, high-end',
      'Bold': 'confident, dynamic, striking, attention-grabbing',
      'Luxury': 'exclusive, prestigious, aspirational, opulent'
    };
    return descriptions[voice] || 'professional';
  }

  // Build system prompt to set AI persona and role (Best Practice: Use system messages)
  // Try to get from database, fallback to hardcoded default
  const systemPrompt = await getContentSystemPrompt(
    input.industry,
    input.brandVoice,
    input.targetAudience
  );

  // Build structured user prompt with clear sections (Best Practice: Use structured prompts)
  let prompt = `## Market Research & Strategy
  Act as a social media expert who has conducted deep market research. 
  - Identify current trends in the ${input.industry || 'general'} industry.
  - Focus on providing high VALUE to the audience (tips, insights, or entertainment).
  - Avoid generic marketing fluff. Be specific and authoritative.

  ## Brand Context
- Brand Name: ${input.brandName}
- Brand Voice: ${input.brandVoice} (tone: ${getVoiceDescription(input.brandVoice)})
${input.companyDescription ? `- Company Description: ${input.companyDescription}` : ''}
${input.industry ? `- Industry: ${input.industry}` : ''}
${input.targetAudience ? `- Target Audience: ${input.targetAudience}` : ''}

## Content Requirements
- Hook: A punchy, curiosity-driven hook (max 12 words) that creates urgency and compels action
- Instagram Caption: 100-250 words (ideal 125-175 words) with 5-10 relevant hashtags, engaging storytelling, visual descriptions. Longer captions are acceptable for storytelling.
- Facebook Caption: 40-150 words (ideal 60-100 words), community-focused, conversational tone, encourages discussion. Can be shorter for higher engagement.
- TikTok Caption: 25-100 words (ideal 30-60 words), energetic, trending language, hashtag-friendly, attention-grabbing. Shorter is often better for engagement.
${input.targetAudience ? `- Tailor content specifically for: ${input.targetAudience}` : ''}
${input.industry ? `- Incorporate industry context and terminology for: ${input.industry}` : ''}

${input.topic ? `## Topic Focus\n${input.topic}\n` : ''}
${input.keywords ? `## Keywords to Incorporate\n${input.keywords.join(', ')}\n` : ''}`;

  // Add AI brand analysis context if available
  if (input.brandAnalysis) {
    const ba = input.brandAnalysis;
    let analysisContext = '\n## AI Brand Analysis (FOLLOW CAREFULLY)\n';
    if (ba.brand_summary) analysisContext += `- Brand Overview: ${ba.brand_summary}\n`;
    if (ba.brand_personality) analysisContext += `- Brand Personality: ${ba.brand_personality}\n`;
    if (ba.writing_style?.tone) analysisContext += `- Writing Tone: ${ba.writing_style.tone}\n`;
    if (ba.writing_style?.sentence_style) analysisContext += `- Sentence Style: ${ba.writing_style.sentence_style}\n`;
    if (ba.writing_style?.common_phrases?.length) analysisContext += `- Use phrases like: ${ba.writing_style.common_phrases.join(', ')}\n`;
    if (ba.writing_style?.avoid_phrases?.length) analysisContext += `- AVOID: ${ba.writing_style.avoid_phrases.join(', ')}\n`;
    if (ba.content_strategy?.key_themes?.length) analysisContext += `- Key Themes: ${ba.content_strategy.key_themes.join(', ')}\n`;
    if (ba.content_strategy?.value_propositions?.length) analysisContext += `- Highlight: ${ba.content_strategy.value_propositions.join(', ')}\n`;
    if (ba.content_strategy?.call_to_actions?.length) analysisContext += `- CTAs: ${ba.content_strategy.call_to_actions.join(', ')}\n`;
    prompt += analysisContext;
  }

  // Add feedback-based improvements if validation failed
  if (input.feedback && input.feedback.length > 0) {
    prompt += `\n\nIMPORTANT - Previous content failed validation. Please fix these issues:
${input.feedback}

Generate new content that addresses all the issues above while maintaining the ${input.brandVoice} brand voice.`;

    if (input.previousAttempt) {
      prompt += `\n\nPrevious content (DO NOT reuse, but learn from what was wrong):
Hook: ${input.previousAttempt.hook}
Instagram Caption: ${input.previousAttempt.caption_ig?.substring(0, 100)}...
Facebook Caption: ${input.previousAttempt.caption_fb?.substring(0, 100)}...`;
    }
  }

  prompt += `\n## Output Format
Return a JSON object with exactly this structure (no markdown, no code blocks):
{
  "hook": "string (max 12 words)",
  "caption_ig": "string (120-200 words with hashtags)",
  "caption_fb": "string (80-120 words)",
  "caption_tt": "string (max 60 words)"
}`;

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await axios.post(
        `${GROQ_BASE_URL}/chat/completions`,
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 800,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);

      return {
        hook: parsed.hook || '',
        caption_ig: parsed.caption_ig || '',
        caption_fb: parsed.caption_fb || '',
        caption_tt: parsed.caption_tt || '',
      };
    } catch (error: any) {
      const isRateLimit = error.response?.status === 429;
      const isServerOverload = error.response?.status >= 500;

      if ((isRateLimit || isServerOverload) && retries > 1) {
        console.warn(`Groq API error ${error.response?.status}. Retrying... (${retries - 1} attempts left)`);
        retries--;
        // Exponential backoff: 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, 3 - retries)));
        continue;
      }

      console.error('Groq API error:', error.message);
      if (error.response?.data) {
        console.error('Groq Error Details:', JSON.stringify(error.response.data));
      }
      throw new Error('Failed to generate content');
    }
  }
  throw new Error('Failed to generate content after retries');
}

