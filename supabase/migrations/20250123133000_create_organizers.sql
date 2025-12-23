-- [2025-01-23] Create organizers table for event organizer records
CREATE TABLE IF NOT EXISTS public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contact TEXT,
  address TEXT,
  image_url TEXT,
  website_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizers_name ON public.organizers USING btree (name);
CREATE INDEX IF NOT EXISTS idx_organizers_created_by ON public.organizers USING btree (created_by);

COMMENT ON TABLE public.organizers IS 'Reusable event organizer records for events';
