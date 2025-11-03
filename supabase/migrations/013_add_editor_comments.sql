-- Add editor_comments column to allow manual feedback for regeneration
ALTER TABLE content_pipeline
ADD COLUMN editor_comments TEXT;

-- Add comment for documentation
COMMENT ON COLUMN content_pipeline.editor_comments IS 'Manual feedback/comments from editor that will be used to guide content regeneration';

