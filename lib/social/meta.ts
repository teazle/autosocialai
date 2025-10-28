import axios from 'axios';
import { decrypt } from '../crypto/encryption';

const META_API_BASE = 'https://graph.facebook.com/v20.0';

export interface MetaTokens {
  accessToken: string;
  pageId: string;
  igBusinessId: string;
}

/**
 * Post to Facebook
 */
export async function postToFacebook(
  pageId: string,
  accessToken: string,
  message: string,
  imageUrl: string
): Promise<string> {
  try {
    // First, download the image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    
    // Upload photo to Facebook
    const formData = new FormData();
    const blob = new Blob([imageResponse.data], { type: 'image/jpeg' });
    formData.append('url', imageUrl);
    formData.append('message', message);
    formData.append('published', 'true');

    const response = await axios.post(
      `${META_API_BASE}/${pageId}/photos`,
      formData,
      {
        params: { access_token: accessToken },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.id;
  } catch (error) {
    console.error('Facebook posting error:', error);
    throw new Error('Failed to post to Facebook');
  }
}

/**
 * Post to Instagram
 */
export async function postToInstagram(
  igBusinessId: string,
  accessToken: string,
  caption: string,
  imageUrl: string
): Promise<string> {
  try {
    // Step 1: Create media container
    const containerResponse = await axios.post(
      `${META_API_BASE}/${igBusinessId}/media`,
      {
        image_url: imageUrl,
        caption,
      },
      {
        params: { access_token: accessToken },
      }
    );

    const creationId = containerResponse.data.id;

    // Step 2: Publish the media
    const publishResponse = await axios.post(
      `${META_API_BASE}/${igBusinessId}/media_publish`,
      {
        creation_id: creationId,
      },
      {
        params: { access_token: accessToken },
      }
    );

    return publishResponse.data.id;
  } catch (error) {
    console.error('Instagram posting error:', error);
    throw new Error('Failed to post to Instagram');
  }
}

/**
 * Refresh Meta access token
 */
export async function refreshMetaToken(refreshToken: string): Promise<string> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('META_APP_ID and META_APP_SECRET must be configured');
  }

  try {
    const response = await axios.get(
      `${META_API_BASE}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: refreshToken,
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Meta token refresh error:', error);
    throw new Error('Failed to refresh Meta token');
  }
}

