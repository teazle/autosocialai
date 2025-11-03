import { createServiceRoleClient } from '../../lib/supabase/server';
import { generateContent as generateAI } from '../../lib/ai/groq';
import { generateImage } from '../../lib/ai/replicate';
import { validateContent, type ValidationResult } from '../../lib/ai/editor';
import { getNextPostingDate } from '../../lib/utils/date';

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

export async function generateContent() {
  const supabase = createServiceRoleClient();

  // Get all active clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*, content_rules!inner(*)')
    .eq('status', 'active');

  if (clientsError) {
    throw clientsError;
  }

  if (!clients || clients.length === 0) {
    return;
  }

  for (const client of clients) {
    try {
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
        console.warn(`No brand assets for client ${client.id}, continuing without them`);
      }

      // Check how many posts are already scheduled for the next 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data: existingPosts } = await supabase
        .from('content_pipeline')
        .select('id')
        .eq('client_id', client.id)
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', sevenDaysFromNow.toISOString());

      const postsNeeded = Math.max(0, client.content_rules.posts_per_week - (existingPosts?.length || 0));

      if (postsNeeded === 0) {
        continue;
      }

      // Generate new posts - schedule them based on client's posting preferences
      // Each client has their own posting_days and posts_per_week settings
      console.log(`Client ${client.name}: Needs ${postsNeeded} post(s), Has ${postsNeeded === 0 ? 'enough' : existingPosts?.length} scheduled`);
      
      for (let i = 0; i < postsNeeded; i++) {
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
        } catch (imgError: any) {
          // If payment required, continue without image
          if (imgError?.statusCode === 402 || imgError?.isPaymentRequired) {
            console.warn(`⚠️  Image generation skipped for ${client.name}: Replicate payment required`);
            imageUrl = null;
          } else {
            console.error(`❌ Image generation failed for ${client.name}:`, imgError?.message);
            imageUrl = null;
          }
        }

        // Validate content using AI editor
        let validationResult: ValidationResult = {
          approved: false,
          issues: [],
          details: {
            imageTextReadable: false,
            imageTextLanguage: 'none' as const,
            imageTextDetected: null,
            contentQuality: 'medium' as const,
            overallScore: 50,
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
              image_url: imageUrl || '', // Empty string if no image
              brandName: client.name,
            });

            if (validationResult.approved) {
              validated = true;
            } else {
              console.warn(`Content validation failed for client ${client.name}. Issues:`, validationResult.issues);
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
                console.log(`📝 Text feedback: ${feedback.substring(0, 200)}...`);
                
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
                
                // Regenerate image with image-specific feedback (optional if payment required)
                let newImageUrl: string | null = null;
                try {
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
                  newImageUrl = newImageResult.imageUrl;
                  imageModel = newImageResult.model;
                } catch (imgError: any) {
                  if (imgError?.statusCode === 402 || imgError?.isPaymentRequired) {
                    console.warn('⚠️  Image regeneration skipped: Replicate payment required');
                  }
                  // Continue without image
                }
                
                content = newContent;
                imageUrl = newImageUrl || imageUrl; // Keep old image URL if new one wasn't generated
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
        const { data: postData, error } = await supabase
          .from('content_pipeline')
          .insert({
            client_id: client.id,
            scheduled_at: nextPostDate.toISOString(),
            status: validationStatus === 'approved' ? 'generated' : 'generated',
            hook: content.hook,
            caption_ig: content.caption_ig,
            caption_fb: content.caption_fb,
            caption_tt: content.caption_tt,
            image_url: imageUrl || null, // Temporary: Replicate URL
            image_model: imageModel || null, // Store the model used to generate the image
            validation_status: validationStatus,
            validation_result: validationResult.details,
            validation_issues: validationResult.issues.length > 0 ? validationResult.issues : null,
            validated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error(`Error creating post for client ${client.id}:`, error);
        } else {
          // Upload image to Supabase Storage if we have one
          if (imageUrl && postData?.id) {
            try {
              const { uploadImageToStorage } = await import('@/lib/storage/image-storage');
              const supabaseImageUrl = await uploadImageToStorage(imageUrl, postData.id);
              
              if (supabaseImageUrl) {
                await supabase
                  .from('content_pipeline')
                  .update({ image_url: supabaseImageUrl })
                  .eq('id', postData.id);
                console.log(`✅ Image stored in Supabase Storage for ${client.name}`);
              }
            } catch (storageError: any) {
              console.warn(`⚠️  Failed to upload to Supabase Storage:`, storageError?.message);
            }
          }
          
          console.log(`✓ Generated and scheduled post for ${client.name} on ${nextPostDate.toLocaleDateString()}`);
        }
      }

      console.log(`Generated ${postsNeeded} post(s) for client ${client.name}`);
    } catch (error) {
      console.error(`Error generating content for client ${client.id}:`, error);
    }
  }
}

