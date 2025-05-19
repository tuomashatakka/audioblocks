-- Simple version of fix_project_permissions.sql without complex logic
-- This script grants all necessary permissions without dynamic SQL

-- Grant permissions to all tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions to all tables in daw schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA daw TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA daw TO service_role;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA daw TO anon;

-- Grant specific permissions to the projects table in public schema (if it exists)
GRANT ALL PRIVILEGES ON TABLE public.projects TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.projects TO service_role;
GRANT SELECT, INSERT ON TABLE public.projects TO anon;

-- Grant specific permissions to the projects table in daw schema (if it exists)
GRANT ALL PRIVILEGES ON TABLE daw.projects TO authenticated;
GRANT ALL PRIVILEGES ON TABLE daw.projects TO service_role;
GRANT SELECT, INSERT ON TABLE daw.projects TO anon;

-- Grant usage on sequences in public schema
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant usage on sequences in daw schema
GRANT USAGE ON ALL SEQUENCES IN SCHEMA daw TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA daw TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA daw TO anon;

-- Set default privileges for future tables in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT ON TABLES TO anon;

-- Set default privileges for future tables in daw schema
ALTER DEFAULT PRIVILEGES IN SCHEMA daw
GRANT ALL ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA daw
GRANT SELECT, INSERT ON TABLES TO anon;

-- Optional: Try to set up RLS policies (these will fail silently if tables don't exist)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'Table public.projects does not exist, skipping RLS setup';
  END;
  
  BEGIN
    ALTER TABLE daw.projects ENABLE ROW LEVEL SECURITY;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'Table daw.projects does not exist, skipping RLS setup';
  END;
END
$$;