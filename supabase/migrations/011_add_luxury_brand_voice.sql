-- Add Luxury brand voice option
-- This allows users to select "Luxury" as a brand voice when creating or editing clients

ALTER TYPE brand_voice ADD VALUE IF NOT EXISTS 'Luxury';

-- Note: This migration adds the Luxury brand voice enum value.
-- The AI will treat Luxury as: exclusive, prestigious, aspirational, opulent
-- This is more elevated than Premium, which is: sophisticated, refined, elegant, high-end
