-- Examine database structure to find the projects table and related tables

-- List all schemas
SELECT nspname FROM pg_catalog.pg_namespace;

-- Find the schema that contains the projects table
SELECT n.nspname as schema_name, c.relname as table_name
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'projects';

-- List all columns in the projects table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects';

-- List all tables in the database
SELECT n.nspname as schema_name, c.relname as table_name
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' -- r = regular table
AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name, table_name;

-- Show existing RLS (Row Level Security) policies on projects table
SELECT *
FROM pg_policies
WHERE tablename = 'projects';
