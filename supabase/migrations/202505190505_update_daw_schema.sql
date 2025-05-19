-- First, enable the hstore extension
CREATE EXTENSION IF NOT EXISTS hstore;

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS daw;

-- Update the projects table to reference our new users table
ALTER TABLE IF EXISTS daw.projects
  DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;

-- Create users table
CREATE TABLE IF NOT EXISTS daw.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Update projects table to reference our users table
ALTER TABLE IF EXISTS daw.projects
  ADD CONSTRAINT projects_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES daw.users(id) ON DELETE CASCADE;

-- Make sure tracks table exists
CREATE TABLE IF NOT EXISTS daw.tracks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES daw.projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Make sure blocks table exists
CREATE TABLE IF NOT EXISTS daw.blocks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id uuid REFERENCES daw.tracks (id) ON DELETE CASCADE,
  start_time integer NOT NULL,
  end_time integer NOT NULL,
  audio_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);