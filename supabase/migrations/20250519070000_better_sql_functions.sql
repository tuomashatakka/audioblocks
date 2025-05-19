-- Better SQL execution function with error handling
CREATE OR REPLACE FUNCTION public.execute_safe_sql(sql_string text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  BEGIN
    EXECUTE sql_string;
    result := 'SQL executed successfully';
  EXCEPTION WHEN OTHERS THEN
    result := 'Error: ' || SQLERRM;
  END;
  
  RETURN result;
END;
$$;

-- Create schema safely
CREATE OR REPLACE FUNCTION public.safe_create_schema(schema_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    result := 'Schema created successfully';
  EXCEPTION WHEN OTHERS THEN
    result := 'Error creating schema: ' || SQLERRM;
  END;
  
  RETURN result;
END;
$$;

-- Create table safely
CREATE OR REPLACE FUNCTION public.safe_create_table(schema_name text, table_name text, table_def text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  BEGIN
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.%I (%s)', schema_name, table_name, table_def);
    result := 'Table created successfully';
  EXCEPTION WHEN OTHERS THEN
    result := 'Error creating table: ' || SQLERRM;
  END;
  
  RETURN result;
END;
$$;

-- Create demo user safely
CREATE OR REPLACE FUNCTION public.create_demo_user(username text, password_hash text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
  user_exists boolean;
  user_id uuid := gen_random_uuid();
BEGIN
  -- Check if user exists
  BEGIN
    SELECT EXISTS(
      SELECT 1 FROM daw.users WHERE username = $1
    ) INTO user_exists;
    
    IF user_exists THEN
      result := 'User already exists';
    ELSE
      -- Insert user
      INSERT INTO daw.users (id, username, password_hash)
      VALUES (user_id, username, password_hash);
      result := 'User created successfully';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    result := 'Error creating user: ' || SQLERRM;
  END;
  
  RETURN result;
END;
$$;