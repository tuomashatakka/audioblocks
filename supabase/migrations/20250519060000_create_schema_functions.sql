-- Function to create a schema if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_schema_if_not_exists(schema_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
END;
$$;

-- Function to create a table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_table_if_not_exists(
  schema_name text,
  table_name text,
  table_definition text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = schema_name 
    AND table_name = table_name
  ) THEN
    EXECUTE format('CREATE TABLE %I.%I (%s)', schema_name, table_name, table_definition);
  END IF;
END;
$$;

-- Function to execute raw SQL (admin only)
CREATE OR REPLACE FUNCTION public.exec_sql(sql_string text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_string;
END;
$$;