import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateContent as generateAI } from '@/lib/ai/groq';
import { generateImage } from '@/lib/ai/replicate';
import { validateContent, type ValidationResult } from '@/lib/ai/editor';
import { getNextPostingDate } from '@/lib/utils/date';

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
    
    // Group and prioritize issues
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

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get client with content rules
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*, content_rules!inner(*)')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found or content rules not set' },
        { status: 404 }
      );
    }

    // Fetch brand assets if they exist (optional)
    let brandAssets = null;
    try {
      const { data } = await supabase
        .from('brand_assets')
        .select('*')
        .eq('client_id', client.id)
        .maybeSingle();
      brandAssets = data;
    } catch (error) {
      console.warn(`No brand assets for client ${client.id}, continuing without them`);
    }

    // Get how many posts are already scheduled for the next 4 weeks (28 days)
    const fourWeeksFromNow = new Date();
    fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28);

    const { data: existingPosts } = await supabase
      .from('content_pipeline')
      .select('id')
      .eq('client_id', client.id)
      .gte('scheduled_at', new Date().toISOString())
      .lte('scheduled_at', fourWeeksFromNow.toISOString());

    const postsNeeded = Math.max(0, (client.content_rules.posts_per_week * 4) - (existingPosts?.length || 0));

    if (postsNeeded === 0) {
      console.log(`ℹ️ Client ${client.name} already has ${existingPosts?.length || 0} posts scheduled for next 4 weeks`);
      return NextResponse.json({ 
        success: true, 
        message: `Already have enough posts scheduled (${existingPosts?.length || 0} posts for next 4 weeks)`,
        postsScheduled: existingPosts?.length || 0,
        postsNeeded: 0
      });
    }

    console.log(`📝 Generating ${postsNeeded} post(s) for client ${client.name} (${client.content_rules.posts_per_week} per week × 4 weeks)`);

    const createdPosts = [];

    // Generate posts for the next 4 weeks
    for (let i = 0; i < postsNeeded; i++) {
      console.log(`\n🔄 Generating post ${i + 1}/${postsNeeded}...`);
      
      // Generate content
      let content = await generateAI({
        brandName: client.name,
        brandVoice: client.brand_voice,
        companyDescription: client.company_description,
        industry: brandAssets?.industry,
        targetAudience: brandAssets?.target_audience,
      });

      // Generate image (optional - continue without image if payment required)
      let imageUrl: string | null = null;
      let imageModel: string | null = null;
      try {
        const imageResult = await generateImage({
          hook: content.hook,
          brandName: client.name,
          brandColors: brandAssets?.color_hex,
          bannedTerms: brandAssets?.banned_terms,
          industry: brandAssets?.industry,
          targetAudience: brandAssets?.target_audience,
          customPromptTemplate: brandAssets?.image_prompt_template,
          customNegativePromptTemplate: brandAssets?.negative_prompt_template,
        });
        imageUrl = imageResult.imageUrl;
        imageModel = imageResult.model;
        console.log(`✅ Image generated for post ${i + 1} with ${imageResult.model}`);
      } catch (imgError: any) {
        // If payment required, continue without image
        if (imgError?.statusCode === 402 || imgError?.isPaymentRequired) {
          console.warn(`⚠️  Image generation skipped for post ${i + 1}: Replicate payment required`);
          imageUrl = null;
        } else {
          console.error(`❌ Image generation failed for post ${i + 1}:`, imgError?.message);
          imageUrl = null;
        }
      }

      // Validate content using AI editor (handle case where image wasn't generated)
      let validationResult: ValidationResult = {
        approved: false,
        issues: imageUrl ? [] : ['Image not generated (Replicate payment required)'],
        details: {
          imageTextReadable: false,
          imageTextLanguage: 'none',
          imageTextDetected: null,
          contentQuality: 'medium',
          overallScore: imageUrl ? 50 : 70, // Higher baseline if no image to validate
        },
      };
      let maxRetries = 3;
      let validated = false;

      while (!validated && maxRetries > 0) {
        try {
          validationResult = await validateContent({
            hook: content.hook,
            caption_ig: content.caption_ig,
            caption_fb: content.caption_fb,
            caption_tt: content.caption_tt,
            image_url: imageUrl || '', // Empty string if no image (validation handles this gracefully)
            brandName: client.name,
          });

          if (validationResult.approved) {
            validated = true;
          } else {
            console.warn(`Content validation failed. Issues:`, validationResult.issues);
            console.warn(`Validation score: ${validationResult.details.overallScore}`);
            
            // Generate feedback message from validation issues
            const feedback = generateFeedbackMessage(validationResult);
            
            // Decide if we should regenerate based on issue severity
            const hasCriticalIssue = validationResult.issues.some(issue => {
              const issueStr = typeof issue === 'string' ? issue : JSON.stringify(issue);
              return (
                issueStr.includes('gibberish') || 
                issueStr.includes('random characters') ||
                issueStr.includes('non-English language') ||
                issueStr.includes('unreadable') ||
                validationResult.details.overallScore < 50
              );
            });

            // Regenerate if: critical issue OR score < 70 (but only if we have retries left)
            const shouldRegenerate = (hasCriticalIssue || validationResult.details.overallScore < 70) && maxRetries > 1;

            if (shouldRegenerate) {
              console.log(`🔄 Regenerating content based on AI editor feedback (attempt ${maxRetries - 1}/${maxRetries})...`);
              console.log(`📝 Text feedback: ${feedback.substring(0, 150)}...`);
              
              // Extract image-specific feedback
              const imageFeedback = extractImageFeedback(validationResult.issues);
              if (imageFeedback.length > 0) {
                console.log(`🖼️ Image feedback: ${imageFeedback.join(', ')}`);
              }
              
              // Regenerate content with feedback
              const newContent = await generateAI({
                brandName: client.name,
                brandVoice: client.brand_voice,
                companyDescription: client.company_description,
                industry: brandAssets?.industry,
                targetAudience: brandAssets?.target_audience,
                feedback: feedback,
                previousAttempt: content,
              });
              
              // Regenerate image with image-specific feedback
              const newImageResult = await generateImage({
                hook: newContent.hook,
                brandName: client.name,
                brandColors: brandAssets?.color_hex,
                bannedTerms: brandAssets?.banned_terms,
                industry: brandAssets?.industry,
                targetAudience: brandAssets?.target_audience,
                customPromptTemplate: brandAssets?.image_prompt_template,
                customNegativePromptTemplate: brandAssets?.negative_prompt_template,
                imageFeedback: imageFeedback,
              });
              
              content = newContent;
              imageUrl = newImageResult.imageUrl;
              imageModel = newImageResult.model;
              maxRetries--;
              continue;
            } else {
              // If score is acceptable (70+) but not perfect, or retries exhausted, mark for review
              validated = true;
            }
          }
        } catch (validationError: any) {
          console.error(`Error validating content:`, validationError?.message || validationError);
          // On validation error, try to get a basic validation result
          // Don't immediately mark for review - let the validation function handle graceful degradation
          try {
            // Retry once with a simpler validation approach
            const fallbackValidation = await validateContent({
              hook: content.hook,
              caption_ig: content.caption_ig,
              caption_fb: content.caption_fb,
              caption_tt: content.caption_tt,
              image_url: imageUrl || '', // Empty string if no image
              brandName: client.name,
            });
            validationResult = fallbackValidation;
            validated = true;
          } catch (retryError: any) {
            // If retry also fails, then mark for manual review
            console.error(`Retry validation also failed:`, retryError?.message || retryError);
            validationResult = {
              approved: false,
              issues: ['Validation system error - needs manual review'],
              details: {
                imageTextReadable: false,
                imageTextLanguage: 'none' as const,
                imageTextDetected: null,
                contentQuality: 'medium' as const,
                overallScore: 50,
              },
            };
            validated = true;
          }
        }
      }

      // Determine validation status
      const validationStatus = validationResult.approved 
        ? 'approved' 
        : (validationResult.details.overallScore < 50 ? 'rejected' : 'manual_review');

      // Calculate next posting date based on client's posting_days (with timezone)
      const nextPostDate = getNextPostingDate(
        client.content_rules.posting_days, 
        client.content_rules.posting_time,
        client.timezone || 'Asia/Singapore'
      );

      // Save to database with validation results
      const { data: post, error: insertError } = await supabase
        .from('content_pipeline')
        .insert({
          client_id: client.id,
          scheduled_at: nextPostDate.toISOString(),
          status: 'generated',
          hook: content.hook,
          caption_ig: content.caption_ig,
          caption_fb: content.caption_fb,
          caption_tt: content.caption_tt,
          image_url: imageUrl || null, // Allow null if image wasn't generated
          image_model: imageModel || null, // Store the model used to generate the image
          validation_status: validationStatus,
          validation_result: validationResult.details,
          validation_issues: validationResult.issues.length > 0 ? validationResult.issues : null,
          validated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting post:', insertError);
        continue;
      }

      // Upload image to Supabase Storage if we have one
      if (imageUrl && post.id) {
        try {
          console.log(`💾 Uploading image to Supabase Storage for post ${post.id}...`);
          const { uploadImageToStorage } = await import('@/lib/storage/image-storage');
          const supabaseImageUrl = await uploadImageToStorage(imageUrl, post.id);
          
          if (supabaseImageUrl) {
            // Update post with Supabase Storage URL
            await supabase
              .from('content_pipeline')
              .update({ image_url: supabaseImageUrl })
              .eq('id', post.id);
            
            console.log(`✅ Image stored in Supabase: ${supabaseImageUrl}`);
            // Update local reference
            post.image_url = supabaseImageUrl;
          } else {
            console.warn(`⚠️  Failed to upload to Supabase Storage, keeping Replicate URL`);
          }
        } catch (storageError: any) {
          console.error('Error uploading to Supabase Storage:', storageError?.message);
          // Continue with Replicate URL if storage fails
        }
      }

      createdPosts.push(post);
      console.log(`✅ Post ${i + 1}/${postsNeeded} created successfully (ID: ${post.id})`);
    }

    console.log(`\n🎉 Successfully generated ${createdPosts.length} post(s) for ${client.name}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully generated ${createdPosts.length} post(s)`,
      postsCreated: createdPosts.length,
      totalScheduled: (existingPosts?.length || 0) + createdPosts.length
    });
  } catch (error: any) {
    console.error('Error generating posts:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: `Failed to generate posts: ${error?.message || String(error)}`,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

