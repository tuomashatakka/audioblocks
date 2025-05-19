-- Fix UUID conversion issue for projects table
-- This script will help convert Google IDs to proper UUIDs

-- Make sure the uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to convert Google IDs to valid UUIDs
CREATE OR REPLACE FUNCTION public.google_id_to_uuid(google_id text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    namespace_uuid uuid := '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; -- UUID namespace (using DNS namespace)
    result uuid;
BEGIN
    -- Use uuid_generate_v5 to create a deterministic UUID from the Google ID
    SELECT uuid_generate_v5(namespace_uuid, google_id) INTO result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback to a random UUID if there's an error
        RETURN uuid_generate_v4();
END;
$$;

-- Create a function to check if string is a valid UUID
CREATE OR REPLACE FUNCTION public.is_valid_uuid(str text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN str ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Now let's examine the projects table structure
DO $$
DECLARE
    schema_name text;
    user_id_type text;
BEGIN
    -- Find schema containing projects table
    SELECT n.nspname INTO schema_name
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'projects'
    LIMIT 1;
    
    IF schema_name IS NULL THEN
        RAISE NOTICE 'Could not find projects table in any schema';
        RETURN;
    END IF;
    
    -- Check data type of user_id column
    SELECT data_type INTO user_id_type
    FROM information_schema.columns
    WHERE table_schema = schema_name
    AND table_name = 'projects'
    AND column_name = 'user_id';
    
    RAISE NOTICE 'Found projects table in schema: %, user_id column type: %', schema_name, user_id_type;
END
$$;

-- Advice for handling this in your application code:
/*
When creating a project, if user_id is expected to be a UUID:
1. Generate a UUID from the Google ID using v5 UUID generation
2. This creates a deterministic UUID based on the Google ID
3. Example (in TypeScript):

import { v5 as uuidv5 } from 'uuid';

// Use a fixed namespace (this is the DNS namespace UUID)
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// Convert Google ID to UUID
function googleIdToUuid(googleId: string): string {
  return uuidv5(googleId, NAMESPACE);
}

// Then use this converted UUID when inserting into projects table
const userId = googleIdToUuid('102169462898509022468');
*/