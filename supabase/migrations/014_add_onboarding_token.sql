-- Add onboarding_token column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS onboarding_token TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_token ON clients(onboarding_token);

