-- Examine the structure of the projects table to see available columns

-- Check if projects table exists in public schema
SELECT EXISTS (
   SELECT FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename = 'projects'
);

-- Check if projects table exists in daw schema
SELECT EXISTS (
   SELECT FROM pg_tables
   WHERE schemaname = 'daw'
   AND tablename = 'projects'
);

-- Show all columns in public.projects (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'projects'
ORDER BY ordinal_position;

-- Show all columns in daw.projects (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'daw'
AND table_name = 'projects'
ORDER BY ordinal_position;
