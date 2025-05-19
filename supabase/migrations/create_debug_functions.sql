-- Create debugging functions for auth

-- Function to get the current auth.uid()
CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid()
$$;

-- Function to get claims from the JWT
CREATE OR REPLACE FUNCTION public.get_auth_claims()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb
$$;

-- Function to check if a user can access a project
CREATE OR REPLACE FUNCTION public.can_access_project(project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  owner_id uuid;
  user_id uuid;
BEGIN
  user_id := auth.uid();
  
  -- Find the owner_id of the project
  SELECT p.owner_id INTO owner_id
  FROM daw.projects p
  WHERE p.id = project_id;
  
  -- Check if the current user is the owner
  RETURN user_id = owner_id;
END;
$$;

-- Test function to insert a project with explicit user ID
CREATE OR REPLACE FUNCTION public.test_insert_project(
  p_name text,
  p_owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  new_id := uuid_generate_v4();
  
  INSERT INTO daw.projects (id, name, owner_id, created_at)
  VALUES (new_id, p_name, p_owner_id, NOW());
  
  RETURN new_id;
END;
$$;