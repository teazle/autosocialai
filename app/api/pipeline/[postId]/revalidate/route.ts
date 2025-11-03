import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validateContent } from '@/lib/ai/editor';

// POST - Re-validate a post with improved validation logic
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = createServiceRoleClient();

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('content_pipeline')
      .select('*, clients(name)')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (!post.image_url) {
      return NextResponse.json(
        { error: 'Post has no image URL' },
        { status: 400 }
      );
    }

    // Re-validate with improved logic
    const validationResult = await validateContent({
      hook: post.hook || '',
      caption_ig: post.caption_ig,
      caption_fb: post.caption_fb,
      caption_tt: post.caption_tt,
      image_url: post.image_url,
      brandName: (post.clients as any)?.name || 'Unknown',
    });

    // Determine validation status
    const validationStatus = validationResult.approved 
      ? 'approved' 
      : (validationResult.details.overallScore < 50 ? 'rejected' : 'manual_review');

    // Update post with new validation results
    const { data: updatedPost, error: updateError } = await supabase
      .from('content_pipeline')
      .update({
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
      success: true,
      post: updatedPost,
      validation: {
        approved: validationResult.approved,
        score: validationResult.details.overallScore,
        status: validationStatus,
        issues: validationResult.issues,
      },
    });
  } catch (error: any) {
    console.error('Error re-validating post:', error);
    return NextResponse.json(
      { error: `Failed to re-validate post: ${error?.message || error}` },
      { status: 500 }
    );
  }
}

