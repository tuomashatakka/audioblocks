-- Script to create master tracks for existing projects
-- This should be run after the track types migration

-- Create master tracks for projects that don't have one
INSERT INTO tracks (project_id, name, track_type, color, volume, muted, solo, armed, created_at, updated_at)
SELECT 
    p.id as project_id,
    'Master' as name,
    'master' as track_type,
    '#22c55e' as color,
    COALESCE(p.master_volume, 80) as volume,
    false as muted,
    false as solo,
    false as armed,
    NOW() as created_at,
    NOW() as updated_at
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM tracks t 
    WHERE t.project_id = p.id 
    AND t.track_type = 'master'
);

-- Verify the results
SELECT 
    p.name as project_name,
    t.name as track_name,
    t.track_type,
    t.volume
FROM projects p
LEFT JOIN tracks t ON p.id = t.project_id AND t.track_type = 'master'
ORDER BY p.name;

-- Count master tracks per project (should be 1 for each)
SELECT 
    p.name as project_name,
    COUNT(t.id) as master_track_count
FROM projects p
LEFT JOIN tracks t ON p.id = t.project_id AND t.track_type = 'master'
GROUP BY p.id, p.name
ORDER BY p.name;