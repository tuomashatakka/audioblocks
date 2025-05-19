-- Create or update the users and projects tables with proper relationships

-- First, make sure we have the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create projects table in public schema (not daw schema)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.users(id),  -- Foreign key to users
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Set up permissive RLS policies for debugging
DROP POLICY IF EXISTS "Users can access their own data" ON public.users;
CREATE POLICY "Users can access their own data" ON public.users
    USING (true)  -- Allow all reads for debugging
    WITH CHECK (auth.uid() = id);  -- Only allow writing own data

DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;
CREATE POLICY "Users can view all projects" ON public.projects
    FOR SELECT USING (true);  -- Allow all reads 

DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
CREATE POLICY "Users can manage their own projects" ON public.projects
    USING (auth.uid() = owner_id)  -- Only owner can modify
    WITH CHECK (auth.uid() = owner_id);  -- Only owner can create

-- Function to sync auth users to our users table
CREATE OR REPLACE FUNCTION public.sync_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user if they don't exist
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync users
DROP TRIGGER IF EXISTS sync_user_from_auth_trigger ON auth.users;
CREATE TRIGGER sync_user_from_auth_trigger
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_from_auth();

-- Function to create a project via RPC (properly handling user sync)
CREATE OR REPLACE FUNCTION public.create_project(
    project_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    new_project_id UUID;
    current_user_id UUID;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- Make sure user exists in the users table
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    SELECT 
        au.id, 
        au.email, 
        COALESCE(au.raw_user_meta_data->>'full_name', au.email),
        NOW(),
        NOW()
    FROM 
        auth.users au
    WHERE 
        au.id = current_user_id
    ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW();
        
    -- Create the project
    INSERT INTO public.projects (id, name, owner_id, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        project_name,
        current_user_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO new_project_id;
    
    RETURN new_project_id;
END;
$$;