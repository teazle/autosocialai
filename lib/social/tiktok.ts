import axios from 'axios';
import { decrypt } from '../crypto/encryption';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

export interface TikTokPostResult {
  publish_id: string;
  upload_url: string;
}

/**
 * Post to TikTok
 */
export async function postToTikTok(
  accessToken: string,
  videoUrl: string,
  caption: string,
  privacyLevel: 'PUBLIC' | 'PRIVATE' = 'PUBLIC'
): Promise<string> {
  try {
    // Step 1: Initialize upload
    const initResponse = await axios.post(
      `${TIKTOK_API_BASE}/post/publish/content/init/`,
      {
        post_info: {
          title: caption,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: 0,
          chunk_size: 0,
          total_chunk_count: 0,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const publishId = initResponse.data.data.publish_id;
    const uploadUrl = initResponse.data.data.upload_url;

    // Step 2: Upload video content
    // Note: This is simplified - you may need to handle multipart upload
    // For now, we'll assume the video is already accessible via URL
    await axios.put(uploadUrl, {
      video_url: videoUrl,
    });

    // Step 3: Publish
    const publishResponse = await axios.post(
      `${TIKTOK_API_BASE}/post/publish/`,
      {
        post_id: publishId,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return publishResponse.data.data.publish_id;
  } catch (error) {
    console.error('TikTok posting error:', error);
    throw new Error('Failed to post to TikTok');
  }
}

/**
 * Refresh TikTok access token
 */
export async function refreshTikTokToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new Error('TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET must be configured');
  }

  try {
    const response = await axios.post(
      `${TIKTOK_API_BASE}/oauth/token/`,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: clientKey,
          password: clientSecret,
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  } catch (error) {
    console.error('TikTok token refresh error:', error);
    throw new Error('Failed to refresh TikTok token');
  }
}

