-- Add video_url column to content_pipeline table
-- This stores the generated video URL for TikTok posts (converted from image)
ALTER TABLE content_pipeline
ADD COLUMN video_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN content_pipeline.video_url IS 'Video URL for TikTok posts (generated from image using Replicate image-to-video models)';

