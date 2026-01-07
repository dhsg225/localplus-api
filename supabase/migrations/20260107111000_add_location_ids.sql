-- [2026-01-07] - Add location_id column to events table
-- This links events to the locations table

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);

COMMENT ON COLUMN events.location_id IS 'Reference to the structured location/venue of this event';

-- Backfill locations from existing event data
DO $$
DECLARE
    loc_record RECORD;
    new_loc_id UUID;
BEGIN
    -- Temporary table to deduplicate locations from events
    CREATE TEMP TABLE temp_locations AS
    SELECT DISTINCT 
        location as name,
        venue_area as description,
        venue_map_url as map_url
    FROM events
    WHERE location IS NOT NULL AND location != '';

    FOR loc_record IN SELECT * FROM temp_locations LOOP
        -- Check if location already exists
        SELECT id INTO new_loc_id FROM locations WHERE name = loc_record.name;
        
        IF new_loc_id IS NULL THEN
            INSERT INTO locations (name, description, map_url)
            VALUES (loc_record.name, loc_record.description, loc_record.map_url)
            RETURNING id INTO new_loc_id;
        END IF;

        -- Update events that match this location name
        UPDATE events 
        SET location_id = new_loc_id
        WHERE location = loc_record.name;
    END LOOP;

    DROP TABLE temp_locations;
END $$;
