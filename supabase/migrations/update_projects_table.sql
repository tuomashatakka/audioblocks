-- Update projects table to ensure necessary columns exist

-- First, let's check if the projects table exists in daw schema
DO $$ 
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'daw'
        AND tablename = 'projects'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating projects table in daw schema';
        
        -- Create the table
        CREATE TABLE IF NOT EXISTS daw.projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            owner_id UUID NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
        
        -- Set up RLS
        ALTER TABLE daw.projects ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own projects" ON daw.projects
            FOR SELECT
            USING (auth.uid() = owner_id);
            
        CREATE POLICY "Users can insert their own projects" ON daw.projects
            FOR INSERT
            WITH CHECK (auth.uid() = owner_id);
            
        CREATE POLICY "Users can update their own projects" ON daw.projects
            FOR UPDATE
            USING (auth.uid() = owner_id);
            
        CREATE POLICY "Users can delete their own projects" ON daw.projects
            FOR DELETE
            USING (auth.uid() = owner_id);
    ELSE
        -- Check if columns exist, add them if they don't
        
        -- Check for id column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'daw'
            AND table_name = 'projects'
            AND column_name = 'id'
        ) THEN
            ALTER TABLE daw.projects ADD COLUMN id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
        END IF;
        
        -- Check for name column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'daw'
            AND table_name = 'projects'
            AND column_name = 'name'
        ) THEN
            ALTER TABLE daw.projects ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Project';
        END IF;
        
        -- Check for owner_id column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'daw'
            AND table_name = 'projects'
            AND column_name = 'owner_id'
        ) THEN
            ALTER TABLE daw.projects ADD COLUMN owner_id UUID NOT NULL;
        END IF;
        
        -- Check for created_at column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'daw'
            AND table_name = 'projects'
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE daw.projects ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        END IF;
        
        -- Check for updated_at column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'daw'
            AND table_name = 'projects'
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE daw.projects ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        END IF;
    END IF;
END $$;