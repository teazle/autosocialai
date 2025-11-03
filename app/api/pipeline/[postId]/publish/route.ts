import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { postToFacebook, postToInstagram } from '@/lib/social/meta';
import { postToTikTok } from '@/lib/social/tiktok';
import { decrypt } from '@/lib/crypto/encryption';
import { validateContent } from '@/lib/ai/editor';

// POST - Publish post immediately
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = createServiceRoleClient();

    // Get the post
    const { data: post, error } = await supabase
      .from('content_pipeline')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check kill switch
    try {
      const killSwitchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/killswitch`);
      const killSwitchData = await killSwitchResponse.json();
      
      if (killSwitchData.enabled) {
        return NextResponse.json(
          { error: 'Kill switch is enabled. Auto-posting is paused.' },
          { status: 403 }
        );
      }
    } catch (e) {
      // Kill switch check failed, continue anyway
      console.log('Kill switch check failed, continuing...');
    }

    // Validate content before publishing (double-check)
    if (post.validation_status && post.validation_status !== 'approved') {
      // If validation failed or needs manual review, block publishing
      if (post.validation_status === 'rejected') {
        return NextResponse.json(
          { 
            error: 'Post rejected by AI editor', 
            issues: post.validation_issues || ['Unknown validation issues'] 
          },
          { status: 400 }
        );
      }
      if (post.validation_status === 'manual_review') {
        return NextResponse.json(
          { 
            error: 'Post requires manual review', 
            issues: post.validation_issues || ['Quality concerns'] 
          },
          { status: 400 }
        );
      }
    }

    // Run a final validation check before publishing
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
          image_url: post.image_url || '',
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
            .eq('id', postId);

          return NextResponse.json(
            { 
              error: 'Post failed final validation', 
              issues: finalValidation.issues 
            },
            { status: 400 }
          );
        }
      }
    } catch (validationError) {
      console.error('Pre-publish validation error:', validationError);
      return NextResponse.json(
        { error: `Validation error: ${validationError}` },
        { status: 500 }
      );
    }

    // Get social accounts
    const { data: socialAccounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('client_id', post.client_id);

    if (accountsError) throw accountsError;

    if (!socialAccounts || socialAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No social accounts connected' },
        { status: 400 }
      );
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
              post.image_url!
            );
            break;
          case 'instagram':
            postId = await postToInstagram(
              account.business_id!,
              accessToken,
              post.caption_ig || post.hook,
              post.image_url!
            );
            break;
          case 'tiktok':
            postId = await postToTikTok(
              accessToken,
              post.image_url!,
              post.caption_tt || post.hook
            );
            break;
          default:
            throw new Error(`Unknown platform: ${account.platform}`);
        }

        postRefs[account.platform] = postId;
      } catch (error) {
        errors.push(`${account.platform}: ${String(error)}`);
      }
    }

    // Update post status
    const { data: updatedPost, error: updateError } = await supabase
      .from('content_pipeline')
      .update({
        status: errors.length === 0 ? 'published' : 'failed',
        post_refs: postRefs,
        error_log: errors.length > 0 ? errors.join('; ') : null,
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ 
      post: updatedPost, 
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    return NextResponse.json(
      { error: `Failed to publish post: ${error}` },
      { status: 500 }
    );
  }
}

