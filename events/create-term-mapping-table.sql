-- [2025-12-01] - Create WordPress term_id -> name mapping table
-- This table stores the mapping from WordPress term IDs to category names
-- Used to resolve comma-separated term IDs in event_type field to readable names

CREATE TABLE IF NOT EXISTS wp_term_mapping (
  term_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_wp_term_mapping_name ON wp_term_mapping(name);

-- Function to resolve comma-separated term IDs to names
CREATE OR REPLACE FUNCTION resolve_event_type_names(term_ids TEXT)
RETURNS TEXT AS $$
DECLARE
  term_id_array TEXT[];
  term_name TEXT;
  result_names TEXT[] := '{}';
  single_id TEXT;
BEGIN
  -- Split comma-separated IDs
  term_id_array := string_to_array(term_ids, ',');
  
  -- Loop through each ID and get the name
  FOREACH single_id IN ARRAY term_id_array
  LOOP
    -- Trim whitespace and convert to integer
    single_id := trim(single_id);
    
    -- Skip empty strings
    IF single_id = '' THEN
      CONTINUE;
    END IF;
    
    -- Look up the term name
    SELECT name INTO term_name
    FROM wp_term_mapping
    WHERE term_id = single_id::INTEGER;
    
    -- Add to result array if found
    IF term_name IS NOT NULL THEN
      result_names := array_append(result_names, term_name);
    ELSE
      -- If not found, keep the ID
      result_names := array_append(result_names, single_id);
    END IF;
  END LOOP;
  
  -- Return comma-separated names
  RETURN array_to_string(result_names, ', ');
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT resolve_event_type_names('1827,3975,3765') AS category_names;

COMMENT ON TABLE wp_term_mapping IS 'Maps WordPress term IDs to category names for event_type resolution';
COMMENT ON FUNCTION resolve_event_type_names(TEXT) IS 'Converts comma-separated WordPress term IDs to comma-separated category names';

