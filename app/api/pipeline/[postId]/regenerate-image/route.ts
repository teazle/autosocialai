import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateImage } from '@/lib/ai/replicate';
import { uploadImageToStorage } from '@/lib/storage/image-storage';
import { ContentPipeline } from '@/lib/types/database';

// Increase timeout for image generation (can take 30-60+ seconds with Ideogram)
export const maxDuration = 300; // 5 minutes

/**
 * Regenerate only the image for a post (without regenerating content)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = createServiceRoleClient();

    // Get the post with client info
    const { data: postData, error: postError } = await supabase
      .from('content_pipeline')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !postData) {
      console.error('Post not found:', postError);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get client info separately
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, brand_voice, company_description')
      .eq('id', postData.client_id)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientError);
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const post = { ...postData, client };

    if (!post.hook) {
      return NextResponse.json(
        { error: 'Post is missing hook content. Cannot generate image without a hook.' },
        { status: 400 }
      );
    }

    // Get brand assets
    let brandAssets = null;
    try {
      const { data } = await supabase
        .from('brand_assets')
        .select('*')
        .eq('client_id', post.client_id)
        .maybeSingle();
      brandAssets = data;
    } catch (error) {
      console.warn(`No brand assets for client ${post.client_id}, continuing with defaults`);
    }

    console.log(`🖼️  Regenerating image for post ${postId}...`);

    // Generate new image
    let imageResult: { imageUrl: string; model: string } | null = null;
    try {
      const result = await generateImage({
        hook: post.hook,
        brandName: client.name || 'Brand',
        brandColors: brandAssets?.color_hex,
        bannedTerms: brandAssets?.banned_terms,
        industry: brandAssets?.industry,
        targetAudience: brandAssets?.target_audience,
        customPromptTemplate: brandAssets?.image_prompt_template,
        customNegativePromptTemplate: brandAssets?.negative_prompt_template,
      });
      imageResult = result;
      console.log(`✅ Image generated with ${result.model}: ${result.imageUrl}`);
    } catch (imgError: any) {
      // If payment required, return helpful error
      if (imgError?.statusCode === 402 || imgError?.isPaymentRequired) {
        return NextResponse.json(
          { 
            error: 'Image generation requires Replicate credits',
            message: 'Add payment method at https://replicate.com/account/billing',
            paymentRequired: true
          },
          { status: 402 }
        );
      }
      throw imgError;
    }

    if (!imageResult || !imageResult.imageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    console.log(`💾 Uploading image to Supabase Storage...`);
    let finalImageUrl = imageResult.imageUrl; // Fallback to Replicate URL
    
    try {
      const supabaseImageUrl = await uploadImageToStorage(imageResult.imageUrl, postId);
      if (supabaseImageUrl) {
        finalImageUrl = supabaseImageUrl;
        console.log(`✅ Image stored in Supabase: ${supabaseImageUrl}`);
      } else {
        console.warn(`⚠️  Failed to upload to Supabase Storage, using Replicate URL`);
      }
    } catch (storageError: any) {
      console.error('Error uploading to Supabase Storage:', storageError?.message);
      // Continue with Replicate URL if storage fails
    }

    // Update the post with new image URL and model (prefer Supabase, fallback to Replicate)
    const { data: updatedPost, error: updateError } = await supabase
      .from('content_pipeline')
      .update({
        image_url: finalImageUrl,
        image_model: imageResult.model,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Post ${postId} updated with new image`);

    return NextResponse.json({
      success: true,
      message: 'Image regenerated and stored successfully',
      post: updatedPost,
      image_url: finalImageUrl,
      image_model: imageResult.model,
      storage: finalImageUrl.includes('supabase') ? 'supabase' : 'replicate',
    });
  } catch (error: any) {
    console.error('Error regenerating image:', error);
    return NextResponse.json(
      { error: `Failed to regenerate image: ${error?.message || String(error)}` },
      { status: 500 }
    );
  }
}

