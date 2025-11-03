export type BrandVoice = 'Friendly' | 'Premium' | 'Bold' | 'Luxury';
export type ClientStatus = 'pending' | 'active' | 'paused' | 'suspended';
export type PipelineStatus = 'pending' | 'generated' | 'published' | 'failed';
export type ValidationStatus = 'pending' | 'approved' | 'rejected' | 'manual_review';
export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok';

export interface Client {
  id: string;
  name: string;
  brand_voice: BrandVoice;
  company_description?: string;
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
  image_prompt_template?: string;
  negative_prompt_template?: string;
  industry?: string;
  target_audience?: string;
  replicate_model?: string; // Replicate model preference: ideogram-ai/ideogram-v3-turbo, black-forest-labs/flux-1.1-pro, black-forest-labs/flux-schnell
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
  image_model?: string; // Replicate model used to generate the image
  post_refs: Record<string, string>; // { fb: "123", ig: "456", tt: "789" }
  error_log?: string;
  retry_count: number;
  validation_status?: ValidationStatus;
  validation_result?: Record<string, any>; // Full validation result JSON
  validation_issues?: string[]; // Array of validation issues
  validated_at?: string;
  editor_comments?: string; // Manual feedback/comments from editor for regeneration
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

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

