import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateContent as generateAI } from '@/lib/ai/groq';
import { generateImage } from '@/lib/ai/replicate';
import { uploadImageToStorage } from '@/lib/storage/image-storage';
import { validateContent, type ValidationResult } from '@/lib/ai/editor';

// Increase timeout for image generation (can take 30-60+ seconds with Ideogram)
export const maxDuration = 300; // 5 minutes

/**
 * Extract image-specific feedback from validation issues
 */
function extractImageFeedback(issues: string[]): string[] {
  const imageIssues: string[] = [];
  
  issues.forEach((issue) => {
    const issueStr = typeof issue === 'string' ? issue : JSON.stringify(issue);
    const lowerIssue = issueStr.toLowerCase();
    
    // Image-specific issues
    if (
      lowerIssue.includes('image') ||
      lowerIssue.includes('gibberish') ||
      lowerIssue.includes('random characters') ||
      lowerIssue.includes('non-english language') ||
      lowerIssue.includes('unreadable text') ||
      lowerIssue.includes('image quality') ||
      lowerIssue.includes('professional standard')
    ) {
      imageIssues.push(issueStr);
    }
  });
  
  return imageIssues;
}

/**
 * Generate feedback message from validation issues for AI regeneration
 */
function generateFeedbackMessage(validationResult: ValidationResult): string {
  const issues = validationResult.issues || [];
  const score = validationResult.details.overallScore;
  const quality = validationResult.details.contentQuality;
  
  let feedback = `Content quality score: ${score}/100 (${quality} quality). `;
  
  if (issues.length === 0) {
    feedback += 'Content met basic requirements but could be improved for higher engagement.';
  } else {
    feedback += 'The following issues were found:\n';
    
    const criticalIssues: string[] = [];
    const mediumIssues: string[] = [];
    const minorIssues: string[] = [];
    
    issues.forEach((issue) => {
      const issueStr = typeof issue === 'string' ? issue : JSON.stringify(issue);
      const lowerIssue = issueStr.toLowerCase();
      
      if (
        lowerIssue.includes('gibberish') ||
        lowerIssue.includes('random characters') ||
        lowerIssue.includes('unreadable') ||
        lowerIssue.includes('non-english') ||
        lowerIssue.includes('error') ||
        lowerIssue.includes('grammar') ||
        lowerIssue.includes('spelling')
      ) {
        criticalIssues.push(issueStr);
      } else if (
        lowerIssue.includes('quality') ||
        lowerIssue.includes('professional') ||
        lowerIssue.includes('length') ||
        lowerIssue.includes('engagement')
      ) {
        mediumIssues.push(issueStr);
      } else {
        minorIssues.push(issueStr);
      }
    });
    
    if (criticalIssues.length > 0) {
      feedback += `\nCRITICAL ISSUES (must fix):\n${criticalIssues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`;
    }
    
    if (mediumIssues.length > 0) {
      feedback += `\n\nIMPORTANT IMPROVEMENTS:\n${mediumIssues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`;
    }
    
    if (minorIssues.length > 0 && criticalIssues.length === 0) {
      feedback += `\n\nSuggestions:\n${minorIssues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`;
    }
  }
  
  feedback += `\n\nPlease generate new content that addresses these issues while maintaining high quality and brand voice.`;
  
  return feedback;
}

// POST - Regenerate post content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = createServiceRoleClient();

    // Get the post and client info
    const { data: post, error: postError } = await supabase
      .from('content_pipeline')
      .select('*, clients(*)')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const client = post.clients;

    // Try to fetch brand assets if they exist (optional)
    let brandAssets = null;
    try {
      const { data } = await supabase
        .from('brand_assets')
        .select('*')
        .eq('client_id', client.id)
        .maybeSingle();
      brandAssets = data;
    } catch (error) {
      console.warn('No brand assets found, continuing without them:', error);
    }

    // Combine validation issues and editor comments as feedback
    let feedback: string | undefined;
    let imageFeedback: string[] = [];
    
    // Start with editor comments if present (manual feedback takes priority)
    const feedbackParts: string[] = [];
    if (post.editor_comments && post.editor_comments.trim().length > 0) {
      feedbackParts.push(`EDITOR FEEDBACK:\n${post.editor_comments.trim()}\n`);
    }
    
    // Add validation issues if present
    if (post.validation_issues && post.validation_issues.length > 0) {
      const validationResult: ValidationResult = {
        approved: post.validation_status === 'approved',
        issues: post.validation_issues,
        details: post.validation_result || {
          overallScore: 50,
          contentQuality: 'medium',
          imageTextReadable: false,
          imageTextLanguage: 'none',
          imageTextDetected: null,
        },
      };
      const validationFeedback = generateFeedbackMessage(validationResult);
      if (validationFeedback) {
        feedbackParts.push(validationFeedback);
      }
      imageFeedback = extractImageFeedback(post.validation_issues);
    }
    
    // Combine all feedback
    if (feedbackParts.length > 0) {
      feedback = feedbackParts.join('\n\n');
    }

    // Generate new content (with feedback if previous validation failed)
    let content = await generateAI({
      brandName: client.name,
      brandVoice: client.brand_voice,
      companyDescription: client.company_description,
      industry: brandAssets?.industry,
      targetAudience: brandAssets?.target_audience,
      feedback: feedback,
      previousAttempt: post.hook ? {
        hook: post.hook,
        caption_ig: post.caption_ig || '',
        caption_fb: post.caption_fb || '',
        caption_tt: post.caption_tt || '',
      } : undefined,
    });

    // Generate new image with image-specific feedback (will use defaults if brand assets missing)
    const imageResult = await generateImage({
      hook: content.hook,
      brandName: client.name,
      brandColors: brandAssets?.color_hex,
      bannedTerms: brandAssets?.banned_terms,
      industry: brandAssets?.industry,
      targetAudience: brandAssets?.target_audience,
      customPromptTemplate: brandAssets?.image_prompt_template,
      customNegativePromptTemplate: brandAssets?.negative_prompt_template,
      imageFeedback: imageFeedback,
    });

    // Validate the new content
    const validationResult = await validateContent({
      hook: content.hook,
      caption_ig: content.caption_ig,
      caption_fb: content.caption_fb,
      caption_tt: content.caption_tt,
      image_url: imageResult.imageUrl,
      brandName: client.name,
    });

    // Determine validation status
    const validationStatus = validationResult.approved 
      ? 'approved' 
      : (validationResult.details.overallScore < 50 ? 'rejected' : 'manual_review');

    // Upload image to Supabase Storage
    let finalImageUrl = imageResult.imageUrl;
    if (imageResult.imageUrl) {
      try {
        console.log(`💾 Uploading image to Supabase Storage...`);
        const supabaseImageUrl = await uploadImageToStorage(imageResult.imageUrl, postId);
        if (supabaseImageUrl) {
          finalImageUrl = supabaseImageUrl;
          console.log(`✅ Image stored in Supabase: ${supabaseImageUrl}`);
        }
      } catch (storageError: any) {
        console.warn(`⚠️  Failed to upload to Supabase Storage:`, storageError?.message);
      }
    }

    // Update post with new content and validation
    const { data: updatedPost, error: updateError } = await supabase
      .from('content_pipeline')
      .update({
        status: 'generated',
        hook: content.hook,
        caption_ig: content.caption_ig,
        caption_fb: content.caption_fb,
        caption_tt: content.caption_tt,
        image_url: finalImageUrl,
        image_model: imageResult.model,
        validation_status: validationStatus,
        validation_result: validationResult.details,
        validation_issues: validationResult.issues.length > 0 ? validationResult.issues : null,
        validated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ 
      post: updatedPost,
      storage: finalImageUrl.includes('supabase') ? 'supabase' : 'replicate',
    });
  } catch (error) {
    console.error('Error regenerating post:', error);
    return NextResponse.json(
      { error: `Failed to regenerate post: ${error}` },
      { status: 500 }
    );
  }
}

