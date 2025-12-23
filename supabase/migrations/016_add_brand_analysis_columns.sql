-- Add brand analysis columns to brand_assets table
-- These columns store URLs for brand analysis and the AI analysis results

-- Add website_url column
ALTER TABLE brand_assets
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add instagram_url column
ALTER TABLE brand_assets
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Add youtube_url column
ALTER TABLE brand_assets
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add brand_pdf_url column (URL to uploaded PDF file in storage)
ALTER TABLE brand_assets
ADD COLUMN IF NOT EXISTS brand_pdf_url TEXT;

-- Add ai_analysis column (JSONB to store AI analysis results)
ALTER TABLE brand_assets
ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Add comments explaining the columns
COMMENT ON COLUMN brand_assets.website_url IS 'Website URL for brand analysis';
COMMENT ON COLUMN brand_assets.instagram_url IS 'Instagram URL for brand analysis';
COMMENT ON COLUMN brand_assets.youtube_url IS 'YouTube URL for brand analysis';
COMMENT ON COLUMN brand_assets.brand_pdf_url IS 'URL to uploaded brand PDF file in Supabase Storage';
COMMENT ON COLUMN brand_assets.ai_analysis IS 'JSONB field storing AI analysis results including suggested colors, voice, brand summary, guidelines, and writing style';

