-- Add name column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Add comment
COMMENT ON COLUMN profiles.name IS 'User full name (required for profile completion)';
