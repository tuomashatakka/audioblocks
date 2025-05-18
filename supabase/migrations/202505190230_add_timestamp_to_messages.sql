-- This migration adds the timestamp column to the daw.messages table.

ALTER TABLE daw.messages
ADD COLUMN timestamp timestamp with time zone DEFAULT now();