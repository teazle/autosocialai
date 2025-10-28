import { createServiceRoleClient } from '../../lib/supabase/server';
import { publishContent } from '../utils/publisher';

export async function checkDuePosts() {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  // Fetch pending posts that are due
  const { data: duePosts, error } = await supabase
    .from('content_pipeline')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now);

  if (error) {
    throw error;
  }

  if (!duePosts || duePosts.length === 0) {
    return;
  }

  console.log(`Found ${duePosts.length} due post(s)`);

  // Process each due post
  for (const post of duePosts) {
    try {
      await publishContent(post);
    } catch (error) {
      console.error(`Error publishing post ${post.id}:`, error);
      // Update status to failed
      await supabase
        .from('content_pipeline')
        .update({
          status: 'failed',
          error_log: String(error),
        })
        .eq('id', post.id);
    }
  }
}

