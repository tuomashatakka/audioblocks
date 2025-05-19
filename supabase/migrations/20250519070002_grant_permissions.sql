-- Grant permissions to the 'daw' schema for authenticated users

-- Grant usage on the schema
GRANT USAGE ON SCHEMA daw TO authenticated;
GRANT USAGE ON SCHEMA daw TO anon;
GRANT USAGE ON SCHEMA daw TO service_role;

-- Grant all permissions on all tables in the schema
GRANT ALL ON ALL TABLES IN SCHEMA daw TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA daw TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA daw TO service_role;

-- Grant permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA daw
GRANT ALL ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA daw
GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA daw
GRANT ALL ON TABLES TO service_role;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA daw TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA daw TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA daw TO service_role;

-- Grant future sequence usage
ALTER DEFAULT PRIVILEGES IN SCHEMA daw
GRANT USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA daw
GRANT USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA daw
GRANT USAGE ON SEQUENCES TO service_role;
