-- Add image_model column to track which Replicate model generated each image
ALTER TABLE content_pipeline
ADD COLUMN image_model TEXT;

-- Add comment for documentation
COMMENT ON COLUMN content_pipeline.image_model IS 'Replicate model used to generate the image (e.g., ideogram-ai/ideogram-v3-turbo, black-forest-labs/flux-1.1-pro, black-forest-labs/flux-schnell)';

