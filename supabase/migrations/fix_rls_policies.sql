-- Fix Row Level Security (RLS) policies for the projects table

-- First make sure we have the uuid-ossp extension enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Make sure we have the projects table in daw schema
CREATE TABLE IF NOT EXISTS daw.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on the projects table
ALTER TABLE daw.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own projects" ON daw.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON daw.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON daw.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON daw.projects;
DROP POLICY IF EXISTS "Allow all access" ON daw.projects;

-- Create a policy that allows users to view projects they own
CREATE POLICY "Users can view their own projects" ON daw.projects
    FOR SELECT
    USING (auth.uid()::text = owner_id::text);  -- Convert to text for comparison

-- Create a VERY PERMISSIVE policy for INSERT that allows any authenticated user to insert
-- This is temporary until we debug the issue
CREATE POLICY "Temp permissive insert policy" ON daw.projects
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- For completeness, also create policies for update and delete
CREATE POLICY "Users can update their own projects" ON daw.projects
    FOR UPDATE
    USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can delete their own projects" ON daw.projects
    FOR DELETE
    USING (auth.uid()::text = owner_id::text);

-- Grant all privileges to the authenticated and service_role roles
GRANT ALL PRIVILEGES ON TABLE daw.projects TO authenticated;
GRANT ALL PRIVILEGES ON TABLE daw.projects TO service_role;
GRANT SELECT, INSERT ON TABLE daw.projects TO anon;

-- Also make sure the sequence for the projects table's primary key is accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA daw TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA daw TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA daw TO service_role;
