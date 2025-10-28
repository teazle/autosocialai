import { createServiceRoleClient } from '../../lib/supabase/server';
import { refreshMetaToken, refreshTikTokToken } from '../../lib/social';
import { decrypt, encrypt } from '../../lib/crypto/encryption';

export async function refreshTokens() {
  const supabase = createServiceRoleClient();

  // Check tokens expiring in less than 7 days
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const { data: tokens, error } = await supabase
    .from('social_accounts')
    .select('*')
    .lte('token_expires_at', sevenDaysFromNow.toISOString())
    .not('refresh_token_encrypted', 'is', null);

  if (error) {
    throw error;
  }

  if (!tokens || tokens.length === 0) {
    return;
  }

  console.log(`Refreshing ${tokens.length} token(s)`);

  for (const token of tokens) {
    try {
      const refreshToken = decrypt(token.refresh_token_encrypted!);
      let newAccessToken: string;
      let newRefreshToken: string | undefined;
      let expiresAt: string | undefined;

      if (token.platform === 'tiktok') {
        const refreshed = await refreshTikTokToken(refreshToken);
        newAccessToken = refreshed.accessToken;
        newRefreshToken = refreshed.refreshToken;
        expiresAt = new Date(Date.now() + 720 * 60 * 60 * 1000).toISOString(); // 30 days
      } else if (token.platform === 'facebook' || token.platform === 'instagram') {
        newAccessToken = await refreshMetaToken(refreshToken);
        expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days
      } else {
        continue;
      }

      // Update in database
      await supabase
        .from('social_accounts')
        .update({
          token_encrypted: encrypt(newAccessToken),
          ...(newRefreshToken && { refresh_token_encrypted: encrypt(newRefreshToken) }),
          token_expires_at: expiresAt,
        })
        .eq('id', token.id);

      console.log(`Refreshed token for ${token.platform} (account ${token.id})`);
    } catch (error) {
      console.error(`Error refreshing token for ${token.platform} (account ${token.id}):`, error);
    }
  }
}

