-- Create users table in daw schema
CREATE TABLE IF NOT EXISTS daw.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add reference to users table in projects table
ALTER TABLE daw.projects 
DROP CONSTRAINT IF EXISTS projects_owner_id_fkey,
ADD CONSTRAINT projects_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES daw.users(id) ON DELETE CASCADE;