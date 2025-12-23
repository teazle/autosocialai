import { createServiceRoleClient } from '../../lib/supabase/server';
import { postToFacebook, postToInstagram } from '../../lib/social/meta';
import { postToTikTok } from '../../lib/social/tiktok';
import { decrypt } from '../../lib/crypto/encryption';
import { validateContent } from '../../lib/ai/editor';
import type { ContentPipeline } from '../../lib/types/database';

export async function publishContent(post: ContentPipeline) {
  const supabase = createServiceRoleClient();

  if (post.status !== 'pending' || !post.hook || !post.image_url) {
    throw new Error('Post is not ready to publish');
  }

  // Validate content before publishing (double-check)
  // Only publish if validation_status is 'approved' or if it hasn't been validated yet
  if (post.validation_status && post.validation_status !== 'approved') {
    // If validation failed or needs manual review, skip auto-publishing
    if (post.validation_status === 'rejected') {
      throw new Error(`Post rejected by AI editor. Issues: ${post.validation_issues?.join(', ') || 'Unknown issues'}`);
    }
    if (post.validation_status === 'manual_review') {
      throw new Error(`Post requires manual review. Issues: ${post.validation_issues?.join(', ') || 'Quality concerns'}`);
    }
  }

  // Run a final validation check before publishing (in case content was modified)
  try {
    // Get client name for validation
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', post.client_id)
      .single();

    if (client) {
      const finalValidation = await validateContent({
        hook: post.hook || '',
        caption_ig: post.caption_ig,
        caption_fb: post.caption_fb,
        caption_tt: post.caption_tt,
        image_url: post.image_url,
        brandName: client.name,
      });

      if (!finalValidation.approved) {
        // Update validation status and prevent publishing
        await supabase
          .from('content_pipeline')
          .update({
            validation_status: finalValidation.details.overallScore < 50 ? 'rejected' : 'manual_review',
            validation_result: finalValidation.details,
            validation_issues: finalValidation.issues,
            validated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        throw new Error(`Post failed final validation. Issues: ${finalValidation.issues.join(', ')}`);
      }
    }
  } catch (validationError) {
    // If validation fails, don't publish
    console.error('Pre-publish validation error:', validationError);
    throw validationError;
  }

  // Get client's social accounts
  const { data: socialAccounts, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('client_id', post.client_id);

  if (error) {
    throw error;
  }

  if (!socialAccounts || socialAccounts.length === 0) {
    throw new Error('No social accounts connected');
  }

  const postRefs: Record<string, string> = {};
  const errors: string[] = [];

  // Publish to each platform
  for (const account of socialAccounts) {
    try {
      const accessToken = decrypt(account.token_encrypted);

      let postId: string;

      switch (account.platform) {
        case 'facebook':
          postId = await postToFacebook(
            account.page_id!,
            accessToken,
            post.caption_fb || post.hook,
            post.image_url
          );
          break;

        case 'instagram':
          postId = await postToInstagram(
            account.business_id!,
            accessToken,
            post.caption_ig || post.hook,
            post.image_url
          );
          break;

        case 'tiktok':
          // TikTok requires video, not image
          // Generate video from image if video_url doesn't exist
          let videoUrl = post.video_url;
          
          if (!videoUrl && post.image_url) {
            try {
              console.log(`🎬 Generating video from image for TikTok post ${post.id}...`);
              const { generateVideoFromImage } = await import('../../lib/ai/video-generation');
              const videoResult = await generateVideoFromImage(post.image_url);
              videoUrl = videoResult.videoUrl;
              
              // Save video_url to database for future use
              await supabase
                .from('content_pipeline')
                .update({ video_url: videoUrl })
                .eq('id', post.id);
              
              console.log(`✅ Video generated and saved: ${videoUrl.substring(0, 80)}...`);
            } catch (videoError: any) {
              console.error(`❌ Failed to generate video for TikTok:`, videoError?.message);
              throw new Error(`TikTok video generation failed: ${videoError?.message || 'Unknown error'}`);
            }
          }
          
          if (!videoUrl) {
            throw new Error('TikTok post requires video URL (image-to-video conversion failed or no image available)');
          }
          
          postId = await postToTikTok(
            accessToken,
            videoUrl,
            post.caption_tt || post.hook
          );
          break;

        default:
          throw new Error(`Unknown platform: ${account.platform}`);
      }

      postRefs[account.platform] = postId;

      // Log the successful post
      await supabase
        .from('post_logs')
        .insert({
          pipeline_id: post.id,
          platform: account.platform,
          post_id: postId,
          published_at: new Date().toISOString(),
        });
    } catch (error) {
      errors.push(`${account.platform}: ${String(error)}`);
    }
  }

  // Update pipeline status
  if (errors.length === 0) {
    await supabase
      .from('content_pipeline')
      .update({
        status: 'published',
        post_refs: postRefs,
      })
      .eq('id', post.id);
  } else {
    await supabase
      .from('content_pipeline')
      .update({
        status: 'failed',
        error_log: errors.join('; '),
        retry_count: (post.retry_count || 0) + 1,
      })
      .eq('id', post.id);

    // If retry count exceeds 3, don't retry again
    if ((post.retry_count || 0) >= 3) {
      console.error(`Post ${post.id} failed after 3 retries`);
    }
  }
}

