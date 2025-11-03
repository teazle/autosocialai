import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateContent as generateAI } from '@/lib/ai/groq';
import { validateContent, type ValidationResult } from '@/lib/ai/editor';

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
      
      // Focus on content issues, not image issues
      if (
        lowerIssue.includes('gibberish') ||
        lowerIssue.includes('random characters') ||
        lowerIssue.includes('unreadable') ||
        lowerIssue.includes('non-english') ||
        lowerIssue.includes('error') ||
        lowerIssue.includes('grammar') ||
        lowerIssue.includes('spelling') ||
        lowerIssue.includes('hook') ||
        lowerIssue.includes('caption') ||
        lowerIssue.includes('length') ||
        lowerIssue.includes('engagement')
      ) {
        criticalIssues.push(issueStr);
      } else if (
        lowerIssue.includes('quality') ||
        lowerIssue.includes('professional') ||
        lowerIssue.includes('brand voice')
      ) {
        mediumIssues.push(issueStr);
      } else if (!lowerIssue.includes('image')) {
        // Exclude image-specific issues
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

/**
 * Regenerate only the content (text/captions) for a post (without regenerating image)
 */
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

    // Combine editor comments and validation issues as feedback (excluding image issues)
    let feedback: string | undefined;
    
    // Start with editor comments if present (manual feedback takes priority)
    const feedbackParts: string[] = [];
    if (post.editor_comments && post.editor_comments.trim().length > 0) {
      feedbackParts.push(`EDITOR FEEDBACK:\n${post.editor_comments.trim()}\n`);
    }
    
    // Add validation issues if present (filter out image-specific issues)
    if (post.validation_issues && post.validation_issues.length > 0) {
      // Filter out image-specific issues for content regeneration
      const contentIssues = post.validation_issues.filter((issue: string) => {
        const issueStr = typeof issue === 'string' ? issue : JSON.stringify(issue);
        const lowerIssue = issueStr.toLowerCase();
        return !(
          lowerIssue.includes('image') ||
          lowerIssue.includes('image quality') ||
          lowerIssue.includes('professional standard') ||
          lowerIssue.includes('visual')
        );
      });

      if (contentIssues.length > 0) {
        const validationResult: ValidationResult = {
          approved: post.validation_status === 'approved',
          issues: contentIssues,
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
      }
    }
    
    // Combine all feedback
    if (feedbackParts.length > 0) {
      feedback = feedbackParts.join('\n\n');
    }

    console.log(`📝 Regenerating content for post ${postId}...`);

    // Generate new content (with feedback if previous validation failed)
    const content = await generateAI({
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

    // Validate the new content (using existing image)
    const validationResult = await validateContent({
      hook: content.hook,
      caption_ig: content.caption_ig,
      caption_fb: content.caption_fb,
      caption_tt: content.caption_tt,
      image_url: post.image_url, // Keep existing image
      brandName: client.name,
    });

    // Determine validation status
    const validationStatus = validationResult.approved 
      ? 'approved' 
      : (validationResult.details.overallScore < 50 ? 'rejected' : 'manual_review');

    // Update post with new content and validation (keep existing image)
    const { data: updatedPost, error: updateError } = await supabase
      .from('content_pipeline')
      .update({
        status: 'generated',
        hook: content.hook,
        caption_ig: content.caption_ig,
        caption_fb: content.caption_fb,
        caption_tt: content.caption_tt,
        // Keep existing image_url
        validation_status: validationStatus,
        validation_result: validationResult.details,
        validation_issues: validationResult.issues.length > 0 ? validationResult.issues : null,
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`✅ Content regenerated for post ${postId}`);

    return NextResponse.json({ 
      success: true,
      message: 'Content regenerated successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error regenerating content:', error);
    return NextResponse.json(
      { error: `Failed to regenerate content: ${error}` },
      { status: 500 }
    );
  }
}

