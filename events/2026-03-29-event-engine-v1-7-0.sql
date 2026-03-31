-- [2026-03-29] - Event Engine v1.7.0 Upgrade
-- Goals: Temporal Isolation, Atomic Instances, RSVP Registration, Soft Deletes, Timezone Support.

-- 1. Enum for Instance Source
DO $$ BEGIN
    CREATE TYPE event_instance_source AS ENUM ('generated', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Upgrade core events table
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
    ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id),
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Bangkok' NOT NULL,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Create Event Instances table (Temporal Occurrence Layer)
CREATE TABLE IF NOT EXISTS public.event_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    
    -- Temporal Range
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Operational Status: scheduled, active, completed, cancelled
    status VARCHAR(20) DEFAULT 'scheduled' NOT NULL,
    
    -- Capacity tracking
    current_rsvp_count INTEGER DEFAULT 0 NOT NULL,
    max_capacity INTEGER DEFAULT NULL, -- Overridable from global rsvp_config
    
    -- Source Tracking
    source_type event_instance_source DEFAULT 'generated' NOT NULL,
    
    -- Soft Delete
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Event Registrations table (RSVP/Ticketing Lifecycle)
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.event_instances(id) ON DELETE CASCADE NOT NULL,
    
    -- Guest Info
    user_id UUID DEFAULT NULL, -- Link to auth.users if logged in
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) DEFAULT NULL,
    
    -- Metadata
    plus_one_count INTEGER DEFAULT 0 NOT NULL,
    registration_data JSONB DEFAULT '{}' NOT NULL, -- Custom form field results
    
    -- Status: confirmed, cancelled, attended, no-show
    status VARCHAR(20) DEFAULT 'confirmed' NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies for Instances
ALTER TABLE public.event_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instances are viewable by everyone if parent event is published" 
    ON public.event_instances FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = event_instances.event_id 
            AND status = 'published' 
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "Owners can manage instances" 
    ON public.event_instances FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = event_instances.event_id 
            AND (created_by = auth.uid() OR organization_id IN (
                SELECT organization_id FROM public.partners WHERE user_id = auth.uid()
            ))
        )
    );

-- 6. RLS Policies for Registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registrations viewable by owners" 
    ON public.event_registrations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.event_instances i
            JOIN public.events e ON e.id = i.event_id
            WHERE i.id = event_registrations.instance_id
            AND (e.created_by = auth.uid() OR e.organization_id IN (
                SELECT organization_id FROM public.partners WHERE user_id = auth.uid()
            ))
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_instances_event_time ON public.event_instances(event_id, start_time);
CREATE INDEX IF NOT EXISTS idx_registrations_instance ON public.event_registrations(instance_id);
CREATE INDEX IF NOT EXISTS idx_events_org ON public.events(organization_id);
