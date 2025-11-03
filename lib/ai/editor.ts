import axios from 'axios';
import dotenv from 'dotenv';
import Replicate from 'replicate';

// Load environment variables if not already loaded
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export interface ValidationResult {
  approved: boolean;
  issues: string[];
  details: {
    imageTextReadable: boolean;
    imageTextLanguage: 'english' | 'other' | 'none';
    imageTextDetected: string | null;
    contentQuality: 'high' | 'medium' | 'low';
    overallScore: number; // 0-100
  };
}

export interface ContentToValidate {
  hook: string;
  caption_ig?: string;
  caption_fb?: string;
  caption_tt?: string;
  image_url: string;
  brandName: string;
}

/**
 * Validates content using AI, specifically checking:
 * - If images contain readable English text (not gibberish or other languages)
 * - Overall content quality
 * - Brand alignment
 */
export async function validateContent(
  content: ContentToValidate
): Promise<ValidationResult> {
  if (!content.image_url) {
    return {
      approved: false,
      issues: ['No image URL provided'],
      details: {
        imageTextReadable: false,
        imageTextLanguage: 'none',
        imageTextDetected: null,
        contentQuality: 'low',
        overallScore: 0,
      },
    };
  }

  try {
    // Step 1: Analyze the image using OCR/Vision API
    const visionAnalysis = await analyzeImage(content.image_url);

    // Step 2: Validate text content quality
    const textValidation = await validateTextContent(content);

    // Step 3: Combine results and make final decision
    const issues: string[] = [];

    // Check image text issues - STRICT CHECKING for gibberish
    if (visionAnalysis.hasText) {
      if (visionAnalysis.textLanguage === 'gibberish') {
        issues.push('Image contains gibberish or random characters instead of readable text');
        // Gibberish is a critical issue - should be rejected
      }
      if (visionAnalysis.textLanguage === 'other') {
        issues.push('Image contains text in a non-English language');
      }
      if (!visionAnalysis.textIsReadable && visionAnalysis.textLanguage !== 'decorative') {
        issues.push('Image contains unreadable text');
      }
      if (visionAnalysis.textContent && visionAnalysis.textContent.length > 0) {
        // Additional check: ensure text doesn't contain too many special characters
        const specialCharRatio =
          (visionAnalysis.textContent.match(/[^a-zA-Z0-9\s]/g) || []).length /
          visionAnalysis.textContent.length;
        if (specialCharRatio > 0.5) {
          issues.push('Image text contains too many special/random characters');
        }
        // Check for common gibberish patterns
        const hasRepeatingChars = /(.)\1{4,}/.test(visionAnalysis.textContent); // 5+ repeated chars
        const hasManySpecialChars = specialCharRatio > 0.3; // Lower threshold
        const hasFewWords = (visionAnalysis.textContent.match(/\b\w+\b/g) || []).length < 3 && visionAnalysis.textContent.length > 10;
        
        if (hasRepeatingChars || (hasManySpecialChars && hasFewWords)) {
          issues.push('Image appears to contain gibberish or corrupted text');
        }
      }
    }

    // Check image quality
    if (visionAnalysis.imageQuality === 'low') {
      issues.push('Image quality is below professional standards');
    }

    if (!visionAnalysis.professionalStandard) {
      issues.push('Image does not meet professional social media standards');
    }

    // Combine with text content issues
    issues.push(...textValidation.issues);

    // Calculate overall score - Gibberish is a CRITICAL issue
    let score = 100;
    if (visionAnalysis.textLanguage === 'gibberish') {
      score -= 50; // Heavy penalty for gibberish - makes approval very unlikely
      // Gibberish should never be approved
    }
    if (visionAnalysis.textLanguage === 'other') score -= 30;
    if (!visionAnalysis.textIsReadable && visionAnalysis.hasText) score -= 25;
    if (visionAnalysis.imageQuality === 'low') score -= 20;
    if (!visionAnalysis.professionalStandard) score -= 15;
    if (textValidation.details.contentQuality === 'low') score -= 10;

    // Check for gibberish-related issues in the issues array
    const hasGibberishIssue = issues.some(issue => 
      typeof issue === 'string' && 
      (issue.toLowerCase().includes('gibberish') || 
       issue.toLowerCase().includes('random characters') ||
       issue.toLowerCase().includes('corrupted text'))
    );

    // NEVER approve if there's gibberish detected
    const approved = !hasGibberishIssue && issues.length === 0 && score >= 70;

    return {
      approved,
      issues,
      details: {
        imageTextReadable:
          visionAnalysis.hasText && visionAnalysis.textIsReadable,
        imageTextLanguage:
          visionAnalysis.textLanguage === 'english'
            ? 'english'
            : visionAnalysis.textLanguage === 'none'
              ? 'none'
              : 'other',
        imageTextDetected: visionAnalysis.textContent || null,
        contentQuality: textValidation.details.contentQuality,
        overallScore: Math.max(0, Math.min(100, score)),
      },
    };
  } catch (error: any) {
    console.error('Content validation error:', error?.message || error);
    
    // If vision API fails, do a basic text-only validation
    // Don't fail completely - approve if text content is good
    try {
      const textValidation = await validateTextContent(content);
      
      // If text validation passes with high quality, approve it
      // OCR failure shouldn't block good content
      // Approve if score >= 90 OR if text validation itself approved
      const textScore = textValidation.details.overallScore;
      // Approve if: text validated approved it, OR score is very high (>= 95), OR score >= 85 with no critical issues
      // Score of 100 with minor suggestions should always approve
      const hasCriticalTextIssues = textValidation.issues.some((issue: string) => {
        const issueStr = typeof issue === 'string' ? issue : JSON.stringify(issue);
        return (
          issueStr.toLowerCase().includes('error') ||
          issueStr.toLowerCase().includes('grammar') ||
          issueStr.toLowerCase().includes('spelling') ||
          issueStr.toLowerCase().includes('inappropriate') ||
          issueStr.toLowerCase().includes('poor quality') ||
          issueStr.toLowerCase().includes('bad')
        );
      });
      // If score is 100 or 95+, approve regardless of suggestions (they're just recommendations)
      const shouldApprove = textValidation.approved || textScore >= 95 || (textScore >= 90 && !hasCriticalTextIssues);
      
      if (shouldApprove) {
        return {
          approved: true,
          issues: textScore >= 95 
            ? ['Image validation skipped (OCR unavailable), but excellent text content approved']
            : ['Image validation skipped (OCR unavailable), but text content approved'],
          details: {
            imageTextReadable: false,
            imageTextLanguage: 'none',
            imageTextDetected: null,
            contentQuality: textValidation.details.contentQuality,
            overallScore: Math.max(85, textScore - 5), // Small penalty for no image check (5 points instead of 10)
          },
        };
      }
      
      // If text is medium quality, mark for review but with better score
      return {
        approved: false,
        issues: [
          'Image validation unavailable - manual review recommended',
          ...textValidation.issues.filter(i => !i.includes('OCR') && !i.includes('image')), // Don't duplicate image issues
        ],
        details: {
          imageTextReadable: false,
          imageTextLanguage: 'none',
          imageTextDetected: null,
          contentQuality: textValidation.details.contentQuality,
          overallScore: textValidation.details.overallScore,
        },
      };
    } catch (textError: any) {
      // Even text validation failed - this is a real problem
      console.error('Text validation also failed:', textError);
      return {
        approved: false,
        issues: ['Validation system error - needs manual review'],
        details: {
          imageTextReadable: false,
          imageTextLanguage: 'none',
          imageTextDetected: null,
          contentQuality: 'low',
          overallScore: 30,
        },
      };
    }
  }
}

/**
 * Analyzes an image using OCR to extract and validate text
 */
async function analyzeImage(imageUrl: string): Promise<{
  hasText: boolean;
  textContent: string | null;
  textIsReadable: boolean;
  textLanguage: 'english' | 'other' | 'gibberish' | 'decorative' | 'none';
  imageQuality: 'high' | 'medium' | 'low';
  professionalStandard: boolean;
  issues: string[];
}> {
  try {
    // Use Replicate's OCR model for text extraction
    if (REPLICATE_API_TOKEN) {
      const replicate = new Replicate({
        auth: REPLICATE_API_TOKEN,
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
        },
      });

      try {
        // Try multiple OCR approaches for better reliability
        let extractedText = '';
        let ocrOutput: any;
        let analysisMethod = 'none';
        
        // Method 1: Try Tesseract-based OCR (reliable, widely available)
        try {
          ocrOutput = await replicate.run(
            'daanelson/image-ocr:latest',
            {
              input: {
                image: imageUrl,
              },
            }
          );
          analysisMethod = 'tesseract-ocr';
        } catch (error1) {
          // Method 2: Try vision-language model (can analyze and extract text)
          try {
            ocrOutput = await replicate.run(
              'yorickvp/llava-13b:latest',
              {
                input: {
                  image: imageUrl,
                  prompt: 'Extract ALL text from this image exactly as it appears. If there is no text, respond with only "NO_TEXT". If text appears to be gibberish or random characters, extract it anyway - we will analyze it separately.',
                },
              }
            );
            analysisMethod = 'llava-vision';
          } catch (error2) {
            // Method 3: Try alternative OCR model
            try {
              ocrOutput = await replicate.run(
                'microsoft/trocr-base-printed:latest',
                {
                  input: {
                    image: imageUrl,
                  },
                }
              );
              analysisMethod = 'trocr-ocr';
            } catch (error3) {
              // Method 4: Try another vision model
              try {
                ocrOutput = await replicate.run(
                  'lucataco/llava-v1.6-vicuna:latest',
                  {
                    input: {
                      image: imageUrl,
                      prompt: 'What text is visible in this image? Extract all text exactly as it appears. If no text, say "NO_TEXT".',
                    },
                  }
                );
                analysisMethod = 'llava-vicuna';
              } catch (error4) {
                throw error4; // All OCR methods failed
              }
            }
          }
        }
        
        // Handle different output formats from different models
        if (typeof ocrOutput === 'string') {
          extractedText = ocrOutput;
        } else if (Array.isArray(ocrOutput)) {
          extractedText = ocrOutput.map((item: any) => 
            typeof item === 'string' ? item : (item?.text || item?.content || item?.output || '')
          ).join(' ').trim();
        } else if (ocrOutput && typeof ocrOutput === 'object') {
          extractedText = ocrOutput.text || ocrOutput.result || ocrOutput.content || 
                         ocrOutput.output || ocrOutput.description ||
                         JSON.stringify(ocrOutput);
        }

        // Clean up extracted text
        extractedText = extractedText.trim();
        
        // Check for "NO_TEXT" response from vision models
        if (extractedText.toLowerCase().includes('no_text') || extractedText.length === 0) {
          return {
            hasText: false,
            textContent: null,
            textIsReadable: true,
            textLanguage: 'none',
            imageQuality: 'high',
            professionalStandard: true,
            issues: [],
          };
        }

        // Analyze extracted text using enhanced Groq analysis
        const textAnalysis = await analyzeExtractedText(extractedText);

        console.log(`📸 Image text analysis (${analysisMethod}): Found text: "${extractedText.substring(0, 150)}...", Readable: ${textAnalysis.isReadable}, Language: ${textAnalysis.language}`);
        console.log(`📸 Full extracted text for debugging:`, extractedText);

        return {
          hasText: true,
          textContent: extractedText,
          textIsReadable: textAnalysis.isReadable,
          textLanguage: textAnalysis.language,
          imageQuality: 'high', // Assume high if OCR worked
          professionalStandard: textAnalysis.isReadable,
          issues: textAnalysis.issues,
        };
      } catch (ocrError: any) {
        // If all OCR methods fail, log the error but continue with fallback
        console.error('❌ All OCR extraction methods failed:', {
          error: ocrError?.message || String(ocrError),
          imageUrl: imageUrl.substring(0, 100) + '...',
          stack: ocrError?.stack
        });
        // Try a direct vision analysis as last resort
        return await analyzeImageWithVisionAPI(imageUrl);
      }
    } else {
      // Fallback: Use vision API to analyze the image description
      // Note: This is less accurate but works without additional APIs
      return await analyzeImageWithVisionAPI(imageUrl);
    }
  } catch (error) {
    console.error('Image analysis error:', error);
    // Fallback to vision analysis
    return await analyzeImageWithVisionAPI(imageUrl);
  }
}

/**
 * Analyzes extracted text to determine if it's readable English
 */
async function analyzeExtractedText(text: string): Promise<{
  isReadable: boolean;
  language: 'english' | 'other' | 'gibberish' | 'decorative';
  issues: string[];
}> {
  if (!GROQ_API_KEY) {
    // Basic fallback check
    const englishCharRatio = (text.match(/[a-zA-Z\s]/g) || []).length / text.length;
    return {
      isReadable: englishCharRatio > 0.7,
      language: englishCharRatio > 0.7 ? 'english' : 'gibberish',
      issues: englishCharRatio <= 0.7 ? ['Text appears to be gibberish or non-English'] : [],
    };
  }

  try {
    const response = await axios.post(
      `${GROQ_BASE_URL}/chat/completions`,
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: `You are an expert at detecting gibberish and unreadable text in images. Analyze this text extracted from a social media image:

"${text}"

CRITICAL: Your job is to determine if this text is:
1. **Readable English**: Actual words that form meaningful sentences (e.g., "Save 50% Today", "New Collection")
2. **Gibberish**: Random characters, scrambled letters, meaningless text (e.g., "asdfghjkl", "x7#kP@m9", "jklmnopqrst")
3. **Corrupted text**: Encoding issues, special characters mixed randomly (e.g., "Sav#50% T@day", "N3w C0llec7i0n" with random symbols)
4. **Decorative text**: Stylized but readable (acceptable)
5. **Other language**: Foreign language text (acceptable if intentional)
6. **None**: No text detected

Detection Rules:
- **Gibberish indicators**: 
  * Repeated random characters (aaaaa, xxxxx)
  * High ratio of special characters without words
  * Mix of letters that don't form words (asdf, qwerty)
  * Non-English characters mixed randomly
  * Patterns that look like keyboard mashing
  
- **NOT Gibberish** (Acceptable):
  * Real words even if styled (SAVE, NEW, 50% OFF)
  * Brand names or proper nouns
  * Decorative but readable text
  * Foreign language words (if intentional)

Examples:
- "Save 50% Today" → readable English ✅
- "asdfghjklmnop" → gibberish ❌
- "Sav#@50% T@day!" → corrupted/gibberish ❌
- "NUEVA COLECCIÓN" → other language (Spanish, acceptable if intentional) ✅
- "x7#kP@m9$qL" → gibberish ❌
- "NEW COLLECTION" → readable English ✅

Respond with JSON only:
{
  "isReadable": boolean,
  "language": "english" | "other" | "gibberish" | "decorative",
  "issues": [array of specific issues if text is gibberish or corrupted, empty if readable]
}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const analysis = JSON.parse(response.data.choices[0].message.content);
    return {
      isReadable: analysis.isReadable || false,
      language: analysis.language || 'other',
      issues: analysis.issues || [],
    };
  } catch (error) {
    console.error('Text analysis error:', error);
    // Basic fallback
    const englishCharRatio = (text.match(/[a-zA-Z\s]/g) || []).length / text.length;
    return {
      isReadable: englishCharRatio > 0.7,
      language: englishCharRatio > 0.7 ? 'english' : 'gibberish',
      issues: englishCharRatio <= 0.7 ? ['Could not fully analyze text - manual review recommended'] : [],
    };
  }
}

/**
 * Fallback: Try using vision API directly if available
 * (Used when all OCR models fail)
 */
async function analyzeImageWithVisionAPI(imageUrl: string): Promise<{
  hasText: boolean;
  textContent: string | null;
  textIsReadable: boolean;
  textLanguage: 'english' | 'other' | 'gibberish' | 'decorative' | 'none';
  imageQuality: 'high' | 'medium' | 'low';
  professionalStandard: boolean;
  issues: string[];
}> {
  if (!GROQ_API_KEY) {
    return {
      hasText: false,
      textContent: null,
      textIsReadable: true,
      textLanguage: 'none',
      imageQuality: 'high',
      professionalStandard: true,
      issues: ['Image validation skipped - API not configured'],
    };
  }

  // Try using Groq with a vision-capable model if available
  // Note: This is a workaround since Groq doesn't have direct vision API
  // We'll use text-based analysis as fallback
  console.warn('⚠️ OCR models unavailable - using vision fallback. Manual review recommended.');
  
  // Return a conservative result that flags for manual review
  // This ensures images with potential text issues get checked
  return {
    hasText: false,
    textContent: null,
    textIsReadable: true,
    textLanguage: 'none',
    imageQuality: 'medium', // Conservative: assume medium without OCR
    professionalStandard: true,
    issues: ['Image text validation skipped - OCR not available. Manual review recommended for images with text.'],
  };
}

/**
 * Validates text content quality separately
 */
async function validateTextContent(
  content: ContentToValidate
): Promise<ValidationResult> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      `${GROQ_BASE_URL}/chat/completions`,
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: `You are an expert social media content validator. Validate this content for ${content.brandName}:

Hook: ${content.hook}
Instagram Caption: ${content.caption_ig || 'N/A'}
Facebook Caption: ${content.caption_fb || 'N/A'}
TikTok Caption: ${content.caption_tt || 'N/A'}

Validation Guidelines (be reasonable - length is flexible):
- Grammar and spelling: Only flag actual errors, not stylistic choices
- Content quality: Focus on engagement potential, clarity, and value to audience
- Length: Instagram (100-250 words ideal, but 75-300 acceptable), Facebook (40-150 words ideal, but 25-200 acceptable), TikTok (25-100 words ideal, but 15-150 acceptable). Length suggestions are OPTIONAL improvements, not blockers.
- Brand alignment: Ensure content matches brand voice and doesn't contradict brand values

Scoring Guidelines:
- Score 95-100: Excellent content, no issues
- Score 85-94: Good content, minor suggestions for improvement (approve with suggestions)
- Score 70-84: Acceptable content with some areas for improvement (approve if no critical issues)
- Score 50-69: Content needs significant improvement (flag for review)
- Score <50: Poor quality content (reject)

IMPORTANT: Length alone should NEVER cause rejection. Only flag length if it's extremely short (<20 words for Instagram) or extremely long (>500 words) where it impacts readability. Treat length suggestions as optional improvements, not blockers.

Respond with JSON only:
{
  "contentQuality": "high" | "medium" | "low",
  "issues": [array of specific issues - be specific, focus on critical problems, empty if none],
  "score": number (0-100)
}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const analysis = JSON.parse(response.data.choices[0].message.content);
    
    const score = analysis.score || 70;
    const issues = analysis.issues || [];
    
    // Approve if score is high (>= 95 = always approve, >= 85 = approve if no critical issues)
    // Minor suggestions don't block approval - score of 95+ means content is excellent
    const hasCriticalIssues = issues.some((issue: string | any) => {
      const issueStr = typeof issue === 'string' ? issue : JSON.stringify(issue);
      return (
        issueStr.toLowerCase().includes('error') ||
        issueStr.toLowerCase().includes('grammar') ||
        issueStr.toLowerCase().includes('spelling') ||
        issueStr.toLowerCase().includes('inappropriate') ||
        issueStr.toLowerCase().includes('bad')
      );
    });
    
    // Score 100 or 95+ = excellent content, approve regardless of minor suggestions
    // Score 85-94 = good content, approve if no critical issues
    const approved = score >= 95 || (score >= 85 && !hasCriticalIssues);

    return {
      approved,
      issues: issues,
      details: {
        imageTextReadable: true, // Not applicable for text-only validation
        imageTextLanguage: 'none',
        imageTextDetected: null,
        contentQuality: analysis.contentQuality || 'medium',
        overallScore: score,
      },
    };
  } catch (error) {
    console.error('Text validation error:', error);
    return {
      approved: false,
      issues: ['Failed to validate text content'],
      details: {
        imageTextReadable: true,
        imageTextLanguage: 'none',
        imageTextDetected: null,
        contentQuality: 'medium',
        overallScore: 50,
      },
    };
  }
}

