export type BrandVoice = 'Friendly' | 'Premium' | 'Bold';
export type ClientStatus = 'pending' | 'active' | 'paused' | 'suspended';
export type PipelineStatus = 'pending' | 'generated' | 'published' | 'failed';
export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok';

export interface Client {
  id: string;
  name: string;
  brand_voice: BrandVoice;
  timezone: string;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  client_id: string;
  platform: SocialPlatform;
  business_id?: string;
  page_id?: string;
  token_encrypted: string;
  refresh_token_encrypted?: string;
  token_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BrandAssets {
  id: string;
  client_id: string;
  logo_url?: string;
  color_hex: string[];
  banned_terms: string[];
  default_hashtags: string[];
  created_at: string;
  updated_at: string;
}

export interface ContentRules {
  id: string;
  client_id: string;
  posts_per_week: number;
  posting_days: number[];
  posting_time: string; // HH:mm format
  allow_auto_publish: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentPipeline {
  id: string;
  client_id: string;
  scheduled_at: string;
  status: PipelineStatus;
  hook?: string;
  caption_ig?: string;
  caption_fb?: string;
  caption_tt?: string;
  image_url?: string;
  post_refs: Record<string, string>; // { fb: "123", ig: "456", tt: "789" }
  error_log?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostLog {
  id: string;
  pipeline_id: string;
  platform: SocialPlatform;
  post_id: string;
  published_at: string;
  metrics: Record<string, any>;
  created_at: string;
}

