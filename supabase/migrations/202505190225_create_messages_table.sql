CREATE TABLE IF NOT EXISTS daw.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content text NOT NULL,
  role text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);