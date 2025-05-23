-- Create timeline_markers table
CREATE TABLE IF NOT EXISTS timeline_markers (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position REAL NOT NULL, -- beat position (can be fractional)
  color TEXT NOT NULL,
  icon TEXT NOT NULL CHECK (icon IN ('bookmark', 'flag', 'star', 'record', 'mic', 'music', 'zap', 'comment')),
  label TEXT,
  created_by TEXT NOT NULL, -- user id who created the marker
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timeline_markers_project_id ON timeline_markers(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_markers_position ON timeline_markers(project_id, position);

-- Add RLS policies (if using Supabase Row Level Security)
-- ALTER TABLE timeline_markers ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can read markers for projects they have access to
-- CREATE POLICY "Users can view timeline markers" ON timeline_markers
--   FOR SELECT USING (TRUE); -- Adjust based on your access control needs

-- Example policy: Users can create/update/delete their own markers
-- CREATE POLICY "Users can manage their own timeline markers" ON timeline_markers
--   FOR ALL USING (auth.uid()::text = created_by);