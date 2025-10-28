import { createServiceRoleClient } from '../../lib/supabase/server';
import { generateContent as generateAI } from '../../lib/ai/groq';
import { generateImage } from '../../lib/ai/replicate';
import { getPostingSchedule } from '../../lib/utils/date';

export async function generateContent() {
  const supabase = createServiceRoleClient();

  // Get all active clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*, content_rules!inner(*), brand_assets(*)')
    .eq('status', 'active');

  if (clientsError) {
    throw clientsError;
  }

  if (!clients || clients.length === 0) {
    return;
  }

  for (const client of clients) {
    try {
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

      // Generate new posts
      const postingSchedule = getPostingSchedule(
        postsNeeded,
        client.content_rules.posting_days
      );

      for (const scheduledAt of postingSchedule) {
        // Generate content
        const content = await generateAI({
          brandName: client.name,
          brandVoice: client.brand_voice,
        });

        // Generate image
        const imageUrl = await generateImage({
          hook: content.hook,
          brandName: client.name,
          brandColors: client.brand_assets?.color_hex,
          bannedTerms: client.brand_assets?.banned_terms,
        });

        // Save to database
        const { error } = await supabase
          .from('content_pipeline')
          .insert({
            client_id: client.id,
            scheduled_at: scheduledAt.toISOString(),
            status: 'generated',
            hook: content.hook,
            caption_ig: content.caption_ig,
            caption_fb: content.caption_fb,
            caption_tt: content.caption_tt,
            image_url: imageUrl,
          });

        if (error) {
          console.error(`Error creating post for client ${client.id}:`, error);
        }
      }

      console.log(`Generated ${postsNeeded} post(s) for client ${client.name}`);
    } catch (error) {
      console.error(`Error generating content for client ${client.id}:`, error);
    }
  }
}

