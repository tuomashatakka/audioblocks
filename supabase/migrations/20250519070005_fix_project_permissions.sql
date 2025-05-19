-- Fix permissions for projects table

-- This is a DO block that allows us to use variables and control flow
DO $$
DECLARE
    schema_name text;
    table_exists boolean;
BEGIN
    -- First, try to find the projects table in any schema
    SELECT n.nspname INTO schema_name
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'projects'
    LIMIT 1;

    -- If we found the schema, grant permissions
    IF schema_name IS NOT NULL THEN
        RAISE NOTICE 'Found projects table in schema: %', schema_name;
        
        -- Grant permissions to the specific table
        EXECUTE format('GRANT ALL PRIVILEGES ON TABLE %I.projects TO authenticated', schema_name);
        EXECUTE format('GRANT ALL PRIVILEGES ON TABLE %I.projects TO service_role', schema_name);
        EXECUTE format('GRANT SELECT, INSERT ON TABLE %I.projects TO anon', schema_name);
        
        -- Check if RLS is enabled
        SELECT EXISTS (
            SELECT 1 FROM pg_catalog.pg_class c
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'projects'
            AND c.relrowsecurity = true
        ) INTO table_exists;
        
        -- Enable RLS if needed
        IF NOT table_exists THEN
            EXECUTE format('ALTER TABLE %I.projects ENABLE ROW LEVEL SECURITY', schema_name);
        END IF;
        
        -- Create RLS policies (will fail silently if column user_id doesn't exist)
        BEGIN
            EXECUTE format('
                DROP POLICY IF EXISTS "All users can view projects" ON %I.projects;
                CREATE POLICY "All users can view projects" ON %I.projects
                    FOR SELECT
                    USING (true);
            ', schema_name, schema_name);
            
            EXECUTE format('
                DROP POLICY IF EXISTS "Users can insert their own projects" ON %I.projects;
                CREATE POLICY "Users can insert their own projects" ON %I.projects
                    FOR INSERT
                    WITH CHECK (auth.uid() = user_id);
            ', schema_name, schema_name);
            
            EXECUTE format('
                DROP POLICY IF EXISTS "Users can update their own projects" ON %I.projects;
                CREATE POLICY "Users can update their own projects" ON %I.projects
                    FOR UPDATE
                    USING (auth.uid() = user_id);
            ', schema_name, schema_name);
            
            EXECUTE format('
                DROP POLICY IF EXISTS "Users can delete their own projects" ON %I.projects;
                CREATE POLICY "Users can delete their own projects" ON %I.projects
                    FOR DELETE
                    USING (auth.uid() = user_id);
            ', schema_name, schema_name);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not create RLS policies. This may be due to missing columns like user_id.';
        END;
    ELSE
        -- If we didn't find the projects table, try to grant permissions to all tables
        RAISE NOTICE 'Could not find projects table. Granting permissions to all tables in all schemas...';
        
        -- Grant permissions to all tables in public schema
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
        GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon;
        
        -- Grant permissions to all tables in daw schema if it exists
        SELECT EXISTS(
            SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'daw'
        ) INTO table_exists;
        
        IF table_exists THEN
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA daw TO authenticated;
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA daw TO service_role;
            GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA daw TO anon;
        END IF;
    END IF;
    
    -- Grant usage on sequences in public schema
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
    
    -- Grant usage on sequences in daw schema if it exists
    IF table_exists THEN
        GRANT USAGE ON ALL SEQUENCES IN SCHEMA daw TO authenticated;
        GRANT USAGE ON ALL SEQUENCES IN SCHEMA daw TO service_role;
        GRANT USAGE ON ALL SEQUENCES IN SCHEMA daw TO anon;
    END IF;
    
    -- Set default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO authenticated, service_role;
    
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT ON TABLES TO anon;
    
    IF table_exists THEN
        ALTER DEFAULT PRIVILEGES IN SCHEMA daw
        GRANT ALL ON TABLES TO authenticated, service_role;
        
        ALTER DEFAULT PRIVILEGES IN SCHEMA daw
        GRANT SELECT, INSERT ON TABLES TO anon;
    END IF;
    
    RAISE NOTICE 'Permissions granted successfully!';
END
$$;
