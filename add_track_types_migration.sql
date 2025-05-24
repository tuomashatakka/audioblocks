-- Migration: Add track types and bus/master track support
-- This migration adds support for different track types (audio, bus, master)
-- and routing information for bus tracks

-- Add track_type column to tracks table
ALTER TABLE tracks 
ADD COLUMN track_type VARCHAR(10) DEFAULT 'audio' 
CHECK (track_type IN ('audio', 'bus', 'master'));

-- Add routing columns for bus functionality
ALTER TABLE tracks 
ADD COLUMN receives TEXT[], -- JSON array of track IDs that send to this bus
ADD COLUMN sends JSONB; -- JSON object with send amounts to other tracks

-- Update existing tracks to be audio type
UPDATE tracks SET track_type = 'audio' WHERE track_type IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_type ON tracks(track_type);
CREATE INDEX IF NOT EXISTS idx_tracks_receives ON tracks USING GIN(receives);

-- Add comments for documentation
COMMENT ON COLUMN tracks.track_type IS 'Type of track: audio (regular), bus (return/send), or master (main output)';
COMMENT ON COLUMN tracks.receives IS 'Array of track IDs that send audio to this bus track';
COMMENT ON COLUMN tracks.sends IS 'JSON object defining send amounts to other tracks/buses';

-- Create a function to ensure only one master track per project
CREATE OR REPLACE FUNCTION check_single_master_track()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.track_type = 'master' THEN
        -- Check if there's already a master track for this project
        IF EXISTS (
            SELECT 1 FROM tracks 
            WHERE project_id = NEW.project_id 
            AND track_type = 'master' 
            AND id != COALESCE(NEW.id, '')
        ) THEN
            RAISE EXCEPTION 'Only one master track allowed per project';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single master track rule
DROP TRIGGER IF EXISTS trigger_check_single_master_track ON tracks;
CREATE TRIGGER trigger_check_single_master_track
    BEFORE INSERT OR UPDATE ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION check_single_master_track();

-- Create a view for easy querying of track routing
CREATE OR REPLACE VIEW track_routing AS
SELECT 
    t.id,
    t.name,
    t.track_type,
    t.project_id,
    t.receives,
    t.sends,
    -- Count of tracks sending to this track (for bus tracks)
    CASE 
        WHEN t.receives IS NOT NULL 
        THEN array_length(t.receives, 1) 
        ELSE 0 
    END as receive_count,
    -- Extract send count from sends JSON
    CASE 
        WHEN t.sends IS NOT NULL 
        THEN jsonb_array_length(jsonb_path_query_array(t.sends, '$.*'))
        ELSE 0 
    END as send_count
FROM tracks t;

COMMENT ON VIEW track_routing IS 'Simplified view of track routing information for bus and master tracks';