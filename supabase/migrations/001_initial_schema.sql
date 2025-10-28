-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE brand_voice AS ENUM ('Friendly', 'Premium', 'Bold');
CREATE TYPE client_status AS ENUM ('pending', 'active', 'paused', 'suspended');
CREATE TYPE pipeline_status AS ENUM ('pending', 'generated', 'published', 'failed');
CREATE TYPE social_platform AS ENUM ('facebook', 'instagram', 'tiktok');

-- clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  brand_voice brand_voice NOT NULL DEFAULT 'Friendly',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Singapore',
  status client_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- social_accounts table
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  business_id VARCHAR(255),
  page_id VARCHAR(255),
  token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, platform)
);

-- brand_assets table
CREATE TABLE brand_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  logo_url TEXT,
  color_hex TEXT[] DEFAULT ARRAY[]::TEXT[],
  banned_terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  default_hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id)
);

-- content_rules table
CREATE TABLE content_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  posts_per_week INTEGER NOT NULL DEFAULT 1,
  posting_days INTEGER[] DEFAULT ARRAY[1,3,5]::INTEGER[], -- Monday, Wednesday, Friday
  posting_time VARCHAR(5) NOT NULL DEFAULT '09:00', -- HH:MM format
  allow_auto_publish BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id)
);

-- content_pipeline table
CREATE TABLE content_pipeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status pipeline_status NOT NULL DEFAULT 'pending',
  hook TEXT,
  caption_ig TEXT,
  caption_fb TEXT,
  caption_tt TEXT,
  image_url TEXT,
  post_refs JSONB DEFAULT '{}'::JSONB,
  error_log TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- post_logs table
CREATE TABLE post_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES content_pipeline(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  post_id VARCHAR(255) NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metrics JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_social_accounts_client_id ON social_accounts(client_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_brand_assets_client_id ON brand_assets(client_id);
CREATE INDEX idx_content_rules_client_id ON content_rules(client_id);
CREATE INDEX idx_content_pipeline_client_id ON content_pipeline(client_id);
CREATE INDEX idx_content_pipeline_status ON content_pipeline(status);
CREATE INDEX idx_content_pipeline_scheduled_at ON content_pipeline(scheduled_at);
CREATE INDEX idx_post_logs_pipeline_id ON post_logs(pipeline_id);
CREATE INDEX idx_post_logs_platform ON post_logs(platform);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_assets_updated_at BEFORE UPDATE ON brand_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_rules_updated_at BEFORE UPDATE ON content_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pipeline_updated_at BEFORE UPDATE ON content_pipeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

