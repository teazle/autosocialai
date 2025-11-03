-- Add replicate_model column to brand_assets table
-- This allows clients to select which Replicate model to use for image generation
ALTER TABLE brand_assets
ADD COLUMN replicate_model VARCHAR(255);

-- Add comment explaining the options
COMMENT ON COLUMN brand_assets.replicate_model IS 'Replicate model for image generation: ideogram-ai/ideogram-v3-turbo (best for text + humans), black-forest-labs/flux-1.1-pro (best quality), black-forest-labs/flux-schnell (best value)';

