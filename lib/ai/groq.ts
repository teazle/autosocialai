import axios from 'axios';

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
  brandVoice: 'Friendly' | 'Premium' | 'Bold';
  topic?: string;
  keywords?: string[];
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

  const prompt = `Generate social media content for ${input.brandName} with a ${input.brandVoice} brand voice.

Requirements:
- Hook: A punchy, curiosity-driven hook (max 12 words)
- Instagram Caption: 120-200 words with relevant hashtags
- Facebook Caption: 80-120 words
- TikTok Caption: Max 60 words, energetic and engaging

${input.topic ? `Topic: ${input.topic}` : ''}
${input.keywords ? `Keywords to include: ${input.keywords.join(', ')}` : ''}

Return a JSON object with exactly this structure:
{
  "hook": "...",
  "caption_ig": "...",
  "caption_fb": "...",
  "caption_tt": "..."
}`;

  try {
    const response = await axios.post(
      `${GROQ_BASE_URL}/chat/completions`,
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
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

