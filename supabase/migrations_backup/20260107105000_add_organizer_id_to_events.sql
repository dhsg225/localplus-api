-- [2026-01-07] - Add organizer_id column to events table
-- This links events to the organizers table

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);

COMMENT ON COLUMN events.organizer_id IS 'Reference to the organizer of this event';
