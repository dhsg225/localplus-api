-- [2025-01-23] Add calendar support to events (inspired by EventON's calendar system)
-- This allows events to belong to different calendars (e.g., "Music/Gigs Calendar", "Food Calendar", etc.)

-- Create calendars table
CREATE TABLE IF NOT EXISTS public.calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT, -- Optional color for calendar display
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add calendar_slug column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS calendar_slug TEXT;

-- Create index for calendar_slug
CREATE INDEX IF NOT EXISTS idx_events_calendar_slug ON public.events(calendar_slug);

-- Add foreign key constraint (optional, allows NULL for backward compatibility)
-- ALTER TABLE public.events 
-- ADD CONSTRAINT fk_events_calendar 
-- FOREIGN KEY (calendar_slug) REFERENCES public.calendars(slug) ON DELETE SET NULL;

-- Insert default calendars based on EventON data
INSERT INTO public.calendars (name, slug, description) VALUES
  ('Music/Gigs Calendar', 'music-gigs-calendar', 'Live music events, gigs, and performances')
ON CONFLICT (slug) DO NOTHING;

-- Update existing events to have default calendar if they don't have one
-- This is a safe default - you can update this later based on your data
UPDATE public.events 
SET calendar_slug = 'music-gigs-calendar' 
WHERE calendar_slug IS NULL;

COMMENT ON TABLE public.calendars IS 'Individual calendar names for organizing events (inspired by EventON event_type_2_slug)';
COMMENT ON COLUMN public.events.calendar_slug IS 'Slug of the calendar this event belongs to (maps to EventON event_type_2_slug)';

