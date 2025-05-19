-- Grant explicit permissions for the projects table

-- First, let's identify which schema contains the projects table
-- Check if it's in the public schema
GRANT ALL PRIVILEGES ON TABLE public.projects TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.projects TO service_role;
GRANT SELECT, INSERT ON TABLE public.projects TO anon;

-- Check if it's in the daw schema
GRANT ALL PRIVILEGES ON TABLE daw.projects TO authenticated;
GRANT ALL PRIVILEGES ON TABLE daw.projects TO service_role;
GRANT SELECT, INSERT ON TABLE daw.projects TO anon;

-- Grant permissions for the sequence if it exists
-- GRANT USAGE ON SEQUENCE public.projects_id_seq TO authenticated, anon, service_role;
-- GRANT USAGE ON SEQUENCE daw.projects_id_seq TO authenticated, anon, service_role;

-- Additional permissions for related tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT ON TABLES TO anon;

-- In case the table has RLS (Row Level Security) policies, make sure they're set correctly
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daw.projects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to see all projects
DROP POLICY IF EXISTS "All users can view projects" ON public.projects;
CREATE POLICY "All users can view projects" ON public.projects
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "All users can view projects" ON daw.projects;
CREATE POLICY "All users can view projects" ON daw.projects
    FOR SELECT
    USING (true);

-- Create a policy that allows authenticated users to insert their own projects
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects" ON daw.projects;
CREATE POLICY "Users can insert their own projects" ON daw.projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows authenticated users to update their own projects
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON daw.projects;
CREATE POLICY "Users can update their own projects" ON daw.projects
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create a policy that allows authenticated users to delete their own projects
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON daw.projects;
CREATE POLICY "Users can delete their own projects" ON daw.projects
    FOR DELETE
    USING (auth.uid() = user_id);
