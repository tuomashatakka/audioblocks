CREATE SCHEMA IF NOT EXISTS daw;

CREATE TABLE IF NOT EXISTS daw.projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  owner_id uuid REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daw.tracks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES daw.projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS daw.blocks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id uuid REFERENCES daw.tracks (id) ON DELETE CASCADE,
  start_time integer NOT NULL,
  end_time integer NOT NULL,
  audio_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
