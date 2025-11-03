import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateContent as generateAI } from '@/lib/ai/groq';
import { generateImage } from '@/lib/ai/replicate';
import { validateContent, type ValidationResult } from '@/lib/ai/editor';
import { getNextPostingDate } from '@/lib/utils/date';

// Increase timeout for image generation (can take 30-60+ seconds with Ideogram)
export const maxDuration = 300; // 5 minutes

/**
 * TEST ENDPOINT: Generate exactly 1 post (for testing purposes)
 * This bypasses the "already have enough posts" check
 */
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

    // Fetch brand assets
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

    console.log('🧪 TEST MODE: Generating 1 post for testing...');

    // Generate content
    console.log('📝 Step 1: Generating content...');
    let content = await generateAI({
      brandName: client.name,
      brandVoice: client.brand_voice,
      companyDescription: client.company_description,
      industry: brandAssets?.industry,
      targetAudience: brandAssets?.target_audience,
    });

    console.log(`✅ Content generated - Hook: "${content.hook}"`);

    // Generate image (optional - continue without image if payment required)
    console.log('🖼️  Step 2: Generating image...');
    let imageUrl: string | null = null;
    let imageModel: string | null = null;
    let imageError: string | null = null;
    let finalImageUrl: string | null = null;
    
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
      console.log(`✅ Image generated with ${imageResult.model}: ${imageResult.imageUrl}`);
    
    // Upload to Supabase Storage
    finalImageUrl = imageUrl;
    if (imageUrl) {
      try {
        console.log(`💾 Uploading image to Supabase Storage...`);
        const { uploadImageToStorage } = await import('@/lib/storage/image-storage');
        const supabaseImageUrl = await uploadImageToStorage(imageUrl, 'temp-' + Date.now());
        
        if (supabaseImageUrl) {
          finalImageUrl = supabaseImageUrl;
          console.log(`✅ Image stored in Supabase: ${supabaseImageUrl}`);
        }
      } catch (storageError: any) {
        console.warn(`⚠️  Failed to upload to Supabase Storage:`, storageError?.message);
      }
    }
    } catch (imgError: any) {
      // If payment is required, continue without image but note it
      if (imgError?.statusCode === 402 || imgError?.isPaymentRequired) {
        console.warn('⚠️  Image generation skipped: Payment required on Replicate');
        imageError = 'Image generation requires Replicate credits. Content generated without image.';
      } else {
        console.error('❌ Image generation failed:', imgError);
        // Extract user-friendly error message
        const errorMsg = imgError?.message || 'Unknown error';
        
        // Provide helpful context for common errors
        if (errorMsg.includes('No image returned from Replicate')) {
          imageError = 'Image generation failed: Replicate did not return an image. This might be due to invalid parameters, model failure, or API issues. Try again or check your Replicate account.';
        } else if (errorMsg.includes('empty result')) {
          imageError = 'Image generation failed: Replicate returned an empty result. This might indicate a generation failure or API quota issue.';
        } else if (errorMsg.includes('Could not extract image URL')) {
          imageError = 'Image generation completed but failed to extract the image URL. The response format might have changed.';
        } else {
          imageError = `Image generation failed: ${errorMsg}`;
        }
      }
    }

    // Validate content (skip image validation if no image was generated)
    console.log('✅ Step 3: Validating content...');
    let validationResult: ValidationResult;
    try {
      if (imageUrl) {
        validationResult = await validateContent({
          hook: content.hook,
          caption_ig: content.caption_ig,
          caption_fb: content.caption_fb,
          caption_tt: content.caption_tt,
          image_url: imageUrl,
          brandName: client.name,
        });
      } else {
        // Validate text-only if no image
        validationResult = await validateContent({
          hook: content.hook,
          caption_ig: content.caption_ig,
          caption_fb: content.caption_fb,
          caption_tt: content.caption_tt,
          image_url: '', // Empty URL for text-only validation
          brandName: client.name,
        });
        // Note that validation will skip image checks if URL is empty
        validationResult.issues = [
          ...(validationResult.issues || []),
          'Image not generated (Replicate payment required)'
        ];
      }
      console.log(`✅ Validation complete - Score: ${validationResult.details.overallScore}/100, Approved: ${validationResult.approved}`);
    } catch (validationError: any) {
      console.error('Validation error:', validationError);
      validationResult = {
        approved: false,
        issues: ['Validation error', ...(imageError ? [imageError] : [])],
        details: {
          overallScore: imageUrl ? 50 : 70, // Higher score if only text (no image to check)
          contentQuality: 'medium' as const,
          imageTextReadable: false,
          imageTextLanguage: 'none' as const,
          imageTextDetected: null,
        },
      };
    }

    const validationStatus = validationResult.approved 
      ? 'approved' 
      : (validationResult.details.overallScore < 50 ? 'rejected' : 'manual_review');

    // Calculate next posting date
    const nextPostDate = getNextPostingDate(
      client.content_rules.posting_days, 
      client.content_rules.posting_time,
      client.timezone || 'Asia/Singapore'
    );

    // Save to database (with temporary post ID for storage)
    console.log('💾 Step 4: Saving to database...');
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
        image_url: typeof finalImageUrl === 'string' ? finalImageUrl : (finalImageUrl ? String(finalImageUrl) : null), // Ensure it's always a string URL
        image_model: imageModel || null, // Store the model used to generate the image
        validation_status: validationStatus,
        validation_result: validationResult.details,
        validation_issues: validationResult.issues.length > 0 ? validationResult.issues : null,
        validated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // If we used a temp ID, re-upload with actual post ID
    // Use a mutable variable to track the final post state (post is const)
    let finalPost = post;
    if (finalImageUrl && typeof finalImageUrl === 'string' && finalImageUrl.includes('supabase') && imageUrl) {
      try {
        const { uploadImageToStorage } = await import('@/lib/storage/image-storage');
        const correctSupabaseUrl = await uploadImageToStorage(imageUrl, post.id);
        if (correctSupabaseUrl) {
          const { data: updatedPost, error: updateError } = await supabase
            .from('content_pipeline')
            .update({ image_url: correctSupabaseUrl })
            .eq('id', post.id)
            .select()
            .single();
          
          if (updateError) {
            console.error('❌ Failed to update post with correct Supabase URL:', updateError);
          } else {
            console.log(`✅ Post updated with correct Supabase URL: ${correctSupabaseUrl}`);
            finalPost = updatedPost; // Update the final post reference
          }
          finalImageUrl = correctSupabaseUrl;
        }
      } catch (error) {
        console.error('❌ Error re-uploading with correct post ID:', error);
        // Ignore, already have a working URL
      }
    }
    
    // Final verification - fetch the post again to ensure image_url is saved
    const { data: verifyPost, error: verifyError } = await supabase
      .from('content_pipeline')
      .select('image_url')
      .eq('id', post.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Failed to verify post image_url:', verifyError);
    } else {
      console.log(`✅ Verified image_url in database: ${verifyPost.image_url || 'none'}`);
    }

    console.log('✅ Post saved successfully!');
    console.log(`📸 Image URL saved to database: ${finalImageUrl || 'none'}`);
    console.log(`📸 Post image_url from database: ${finalPost.image_url || 'none'}`);

    const response: any = {
      success: true, 
      message: finalImageUrl 
        ? 'Test post generated successfully!' 
        : 'Content generated successfully! (Image generation skipped - Replicate payment required)',
      post: {
        id: finalPost.id,
        hook: finalPost.hook,
        scheduled_at: finalPost.scheduled_at,
        validation_score: validationResult.details.overallScore,
        validation_status: validationStatus,
        image_url: finalImageUrl, // Return the final URL (Supabase or Replicate)
      },
      content_preview: {
        hook: content.hook,
        caption_ig_length: content.caption_ig?.length || 0,
        caption_fb_length: content.caption_fb?.length || 0,
        caption_tt_length: content.caption_tt?.length || 0,
      }
    };

    if (imageError) {
      response.warning = imageError;
      response.billing_note = 'To enable image generation, add payment method at https://replicate.com/account/billing';
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error generating test post:', error);
    return NextResponse.json(
      { 
        error: `Failed to generate test post: ${error?.message || String(error)}`,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

