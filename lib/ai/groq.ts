import axios from 'axios';
import dotenv from 'dotenv';
import { getContentSystemPrompt } from './system-prompts';

// Load environment variables if not already loaded
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
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
}

/**
 * Generate social media content using Groq AI
 */
export async function generateContent(
  input: ContentGenerationInput
): Promise<ContentGeneration> {
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
  let prompt = `## Brand Context
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
        temperature: 0.7, // Good for creative content (Best Practice: 0.6-0.8 for social media)
        max_tokens: 800, // Prevent overly long outputs (Best Practice: Set limits)
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
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
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error('Failed to generate content');
  }
}

