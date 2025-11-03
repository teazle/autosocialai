-- Add validation fields to content_pipeline table
ALTER TABLE content_pipeline
ADD COLUMN validation_status TEXT CHECK (validation_status IN ('pending', 'approved', 'rejected', 'manual_review')),
ADD COLUMN validation_result JSONB,
ADD COLUMN validation_issues TEXT[],
ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE;

-- Create index for validation status queries
CREATE INDEX idx_content_pipeline_validation_status ON content_pipeline(validation_status);

-- Update existing posts to have 'pending' validation status
UPDATE content_pipeline
SET validation_status = 'pending'
WHERE validation_status IS NULL;

