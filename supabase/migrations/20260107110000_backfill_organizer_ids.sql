-- [2026-01-07] - Link existing legacy organizer data
-- Extracts organizer details from metadata and populates the organizers table

DO $$
DECLARE
    org_record RECORD;
    new_org_id UUID;
BEGIN
    -- Temporary table to deduplicate organizers from metadata
    -- We use COALESCE and empty string to ensure DISTINCT works correctly with NULLs
    CREATE TEMP TABLE temp_orgs AS
    SELECT DISTINCT 
        metadata->>'organizer_name' as name,
        metadata->>'organizer_description' as description,
        metadata->>'organizer_address' as address,
        metadata->>'organizer_contact' as contact,
        metadata->>'organizer_image' as image_url
    FROM events
    WHERE metadata->>'organizer_name' IS NOT NULL 
      AND (metadata->>'organizer_name') != '';

    FOR org_record IN SELECT * FROM temp_orgs LOOP
        -- Check if organizer already exists (by name)
        SELECT id INTO new_org_id FROM organizers WHERE name = org_record.name;
        
        IF new_org_id IS NULL THEN
            INSERT INTO organizers (name, description, address, contact, image_url)
            VALUES (
                org_record.name, 
                org_record.description, 
                org_record.address, 
                org_record.contact, 
                org_record.image_url
            )
            RETURNING id INTO new_org_id;
        END IF;

        -- Update events that match this organizer name
        UPDATE events 
        SET organizer_id = new_org_id
        WHERE metadata->>'organizer_name' = org_record.name;
    END LOOP;

    DROP TABLE temp_orgs;
END $$;
