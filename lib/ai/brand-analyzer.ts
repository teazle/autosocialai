import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Brand Analysis Output Structure
 * This is saved to brand_assets.ai_analysis
 */
export interface BrandAnalysis {
    // Core Brand Identity
    brand_summary: string;
    brand_personality: string;

    // Writing Style (→ Content Generator)
    writing_style: {
        tone: string;
        vocabulary_level: string;
        sentence_style: string;
        common_phrases: string[];
        avoid_phrases: string[];
    };

    // Visual Style (→ Image Generator)
    visual_style: {
        suggested_colors: string[];
        aesthetic: string;
        mood: string;
        image_style: string;
    };

    // Content Strategy (→ Content Generator)
    content_strategy: {
        key_themes: string[];
        value_propositions: string[];
        call_to_actions: string[];
        hashtag_style: string;
    };

    // Quality Guidelines (→ Editor AI)
    quality_guidelines: {
        dos: string[];
        donts: string[];
        brand_voice_examples: string[];
    };

    // Metadata
    analyzed_sources: string[];
    analyzed_at: string;
    confidence_score: number;
}

/**
 * Scrape a website for brand information
 */
export async function scrapeWebsite(url: string): Promise<{
    title: string;
    description: string;
    headings: string[];
    bodyText: string;
    colors: string[];
}> {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(response.data);

        // Extract title
        const title = $('title').text().trim() || $('h1').first().text().trim() || '';

        // Extract meta description
        const description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') || '';

        // Extract all headings
        const headings: string[] = [];
        $('h1, h2, h3').each((_, el) => {
            const text = $(el).text().trim();
            if (text && text.length < 200) headings.push(text);
        });

        // Extract body text (first 5000 chars)
        const bodyText = $('body').text()
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000);

        // Extract colors from inline styles and CSS
        const colors: string[] = [];
        const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)/g;
        const styleContent = $('style').text() + ' ' + $('[style]').attr('style');
        const matches = styleContent?.match(colorRegex) || [];
        colors.push(...new Set(matches.slice(0, 10)));

        return { title, description, headings, bodyText, colors };
    } catch (error) {
        console.error('Error scraping website:', error);
        return { title: '', description: '', headings: [], bodyText: '', colors: [] };
    }
}

/**
 * Extract text content from Instagram profile (basic scraping)
 */
export async function scrapeInstagram(url: string): Promise<{
    bio: string;
    username: string;
}> {
    try {
        // Note: Instagram heavily restricts scraping. This is a basic attempt.
        // For production, consider using the official Instagram API.
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(response.data);

        // Try to extract bio from meta tags or JSON-LD
        const description = $('meta[property="og:description"]').attr('content') || '';
        const username = url.split('/').filter(Boolean).pop() || '';

        return { bio: description, username };
    } catch (error) {
        console.error('Error scraping Instagram:', error);
        return { bio: '', username: '' };
    }
}

/**
 * Extract text content from YouTube channel
 */
export async function scrapeYouTube(url: string): Promise<{
    channelName: string;
    description: string;
}> {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(response.data);

        const channelName = $('meta[property="og:title"]').attr('content') || '';
        const description = $('meta[property="og:description"]').attr('content') || '';

        return { channelName, description };
    } catch (error) {
        console.error('Error scraping YouTube:', error);
        return { channelName: '', description: '' };
    }
}

/**
 * Parse PDF and extract text (requires pdf-parse library)
 */
export async function parsePdf(pdfUrl: string): Promise<string> {
    try {
        // Download PDF
        const response = await axios.get(pdfUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
        });

        // Dynamically import pdf-parse (optional dependency)
        try {
            const pdfParse = (await import('pdf-parse')).default;
            const data = await pdfParse(Buffer.from(response.data));
            return data.text.substring(0, 10000); // Limit to 10000 chars
        } catch (e) {
            console.warn('pdf-parse not available, skipping PDF parsing');
            return '';
        }
    } catch (error) {
        console.error('Error parsing PDF:', error);
        return '';
    }
}

/**
 * Generate brand profile using LLM (Groq)
 */
export async function generateBrandProfile(data: {
    websiteData?: Awaited<ReturnType<typeof scrapeWebsite>>;
    instagramData?: Awaited<ReturnType<typeof scrapeInstagram>>;
    youtubeData?: Awaited<ReturnType<typeof scrapeYouTube>>;
    pdfText?: string;
    existingColors?: string[];
    brandName?: string;
}): Promise<BrandAnalysis> {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
    }

    // Build context from all sources
    const context: string[] = [];
    const analyzedSources: string[] = [];

    if (data.websiteData && data.websiteData.title) {
        context.push(`WEBSITE:
Title: ${data.websiteData.title}
Description: ${data.websiteData.description}
Key Headings: ${data.websiteData.headings.join(', ')}
Content Sample: ${data.websiteData.bodyText.substring(0, 2000)}`);
        analyzedSources.push('website');
    }

    if (data.instagramData && data.instagramData.bio) {
        context.push(`INSTAGRAM:
Username: ${data.instagramData.username}
Bio: ${data.instagramData.bio}`);
        analyzedSources.push('instagram');
    }

    if (data.youtubeData && data.youtubeData.channelName) {
        context.push(`YOUTUBE:
Channel: ${data.youtubeData.channelName}
Description: ${data.youtubeData.description}`);
        analyzedSources.push('youtube');
    }

    if (data.pdfText) {
        context.push(`BRAND DOCUMENT (PDF):
${data.pdfText.substring(0, 3000)}`);
        analyzedSources.push('pdf');
    }

    if (context.length === 0) {
        throw new Error('No data sources provided for brand analysis');
    }

    const prompt = `You are a brand strategist analyzing a company's online presence.

Based on the following sources, generate a comprehensive brand profile in JSON format.

${context.join('\n\n---\n\n')}

${data.existingColors?.length ? `Existing brand colors: ${data.existingColors.join(', ')}` : ''}
${data.brandName ? `Brand name: ${data.brandName}` : ''}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "brand_summary": "2-3 sentence brand overview",
  "brand_personality": "3-5 personality traits (e.g., innovative, approachable, bold)",
  "writing_style": {
    "tone": "e.g., conversational, formal, playful, professional",
    "vocabulary_level": "simple, technical, or sophisticated",
    "sentence_style": "short punchy, long flowing, or mixed",
    "common_phrases": ["phrases the brand uses"],
    "avoid_phrases": ["phrases to avoid based on brand voice"]
  },
  "visual_style": {
    "suggested_colors": ["#hex codes"],
    "aesthetic": "e.g., minimalist, vibrant, corporate, artistic",
    "mood": "e.g., energetic, calm, professional, playful",
    "image_style": "photography, illustration, 3D, or mixed"
  },
  "content_strategy": {
    "key_themes": ["main topics/themes"],
    "value_propositions": ["key benefits/messages"],
    "call_to_actions": ["effective CTAs for this brand"],
    "hashtag_style": "branded, trending, minimal, or mixed"
  },
  "quality_guidelines": {
    "dos": ["things content should do"],
    "donts": ["things content should avoid"],
    "brand_voice_examples": ["2-3 example sentences in brand voice"]
  },
  "confidence_score": 0.0 to 1.0
}`;

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a brand strategist. Return only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const content = response.data.choices[0]?.message?.content;
        if (!content) throw new Error('No response from LLM');

        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid JSON response from LLM');

        const analysis = JSON.parse(jsonMatch[0]) as Omit<BrandAnalysis, 'analyzed_sources' | 'analyzed_at'>;

        return {
            ...analysis,
            analyzed_sources: analyzedSources,
            analyzed_at: new Date().toISOString(),
            confidence_score: analysis.confidence_score || 0.7,
        };
    } catch (error) {
        console.error('Error generating brand profile:', error);
        throw error;
    }
}

/**
 * Full brand analysis pipeline
 */
export async function analyzeBrand(params: {
    websiteUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    pdfUrl?: string;
    existingColors?: string[];
    brandName?: string;
}): Promise<BrandAnalysis> {
    console.log('🔍 Starting brand analysis...');

    // Scrape all sources in parallel
    const [websiteData, instagramData, youtubeData, pdfText] = await Promise.all([
        params.websiteUrl ? scrapeWebsite(params.websiteUrl) : undefined,
        params.instagramUrl ? scrapeInstagram(params.instagramUrl) : undefined,
        params.youtubeUrl ? scrapeYouTube(params.youtubeUrl) : undefined,
        params.pdfUrl ? parsePdf(params.pdfUrl) : undefined,
    ]);

    console.log('📊 Scraped sources:', {
        website: !!websiteData?.title,
        instagram: !!instagramData?.bio,
        youtube: !!youtubeData?.channelName,
        pdf: !!pdfText,
    });

    // Generate brand profile using LLM
    const analysis = await generateBrandProfile({
        websiteData,
        instagramData,
        youtubeData,
        pdfText,
        existingColors: params.existingColors,
        brandName: params.brandName,
    });

    console.log('✅ Brand analysis complete:', analysis.brand_summary);

    return analysis;
}
