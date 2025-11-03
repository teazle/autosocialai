-- Create system_settings table for global configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_system_settings_key ON system_settings(key);

-- Insert default replicate model setting
INSERT INTO system_settings (key, value, description)
VALUES (
  'replicate_model',
  'ideogram-ai/ideogram-v3-turbo',
  'Replicate model for image generation: ideogram-ai/ideogram-v3-turbo (best for text + humans), black-forest-labs/flux-1.1-pro (best quality), black-forest-labs/flux-schnell (best value)'
)
ON CONFLICT (key) DO NOTHING;

