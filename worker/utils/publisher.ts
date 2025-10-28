import { createServiceRoleClient } from '../../lib/supabase/server';
import { postToFacebook, postToInstagram } from '../../lib/social/meta';
import { postToTikTok } from '../../lib/social/tiktok';
import { decrypt } from '../../lib/crypto/encryption';
import type { ContentPipeline } from '../../lib/types/database';

export async function publishContent(post: ContentPipeline) {
  const supabase = createServiceRoleClient();

  if (post.status !== 'pending' || !post.hook || !post.image_url) {
    throw new Error('Post is not ready to publish');
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
          postId = await postToTikTok(
            accessToken,
            post.image_url, // Note: TikTok requires video, not image
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

