-- [2026-03-31] - Ingestion Module Staging Tables
-- Purpose: Support temporary storage of parsed external event data for human validation.

-- 1. Ingestion Batches: Metadata for a single ingestion session
CREATE TABLE IF NOT EXISTS public.ingestion_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id),
    source_name VARCHAR(255) NOT NULL, -- e.g., "Terry Feed", "Facebook Group Export"
    raw_content TEXT NOT NULL, -- The original input text
    
    -- [CORRECTION] Ingestion Mode Selector
    mode VARCHAR(50) DEFAULT 'terry' NOT NULL,
    
    -- [CORRECTION] Global Date Context: Primary date for the entire batch
    global_date DATE, 
    
    -- Status: processing, pending_validation, completed, failed
    status VARCHAR(50) DEFAULT 'processing' NOT NULL,
    
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ingestion Queue: The "Messy" staging table
-- Stores parsed results before they are moved to production event_instances
CREATE TABLE IF NOT EXISTS public.ingestion_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.ingestion_batches(id) ON DELETE CASCADE NOT NULL,
    
    -- [CORRECTION] Grouping Layer: same venue + same day in the batch
    ingestion_group_id UUID, 
    
    -- Parsed Temporal Data (Raw from AI/Regex)
    raw_date VARCHAR(100),
    raw_time VARCHAR(100),
    raw_venue VARCHAR(255),
    raw_performer VARCHAR(255),
    
    -- Validated/Calculated Data (Ready for Commit)
    extracted_title VARCHAR(255),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    -- Matching Lookups
    matched_venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    matching_confidence DECIMAL(5,2), -- 0.00 to 100.00
    
    -- [CORRECTION] Dedupe Upgrade
    dedupe_fingerprint TEXT, -- SHA256(venue_id + date + 15min_rounded_time + fuzzy_performer)
    duplicate_warning BOOLEAN DEFAULT false,
    existing_instance_id UUID REFERENCES public.event_instances(id) ON DELETE SET NULL,
    
    -- [CORRECTION] Time Normalization
    is_inferred_duration BOOLEAN DEFAULT false,
    
    -- Row Status: pending, approved, rejected, error
    validation_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    error_message TEXT,
    
    -- Source Attribution for UI
    raw_snippet_context TEXT, 
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS Policies
ALTER TABLE public.ingestion_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_queues ENABLE ROW LEVEL SECURITY;

-- Owners/Partners can manage their own batches
CREATE POLICY "Users can manage their organization batches"
    ON public.ingestion_batches FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.partners WHERE user_id = auth.uid()
    ));

-- Access to queue rows depends on batch access
CREATE POLICY "Users can manage their organization queue items"
    ON public.ingestion_queues FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.ingestion_batches
        WHERE id = ingestion_queues.batch_id
        AND organization_id IN (
            SELECT organization_id FROM public.partners WHERE user_id = auth.uid()
        )
    ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ingestion_queue_batch ON public.ingestion_queues(batch_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_queue_status ON public.ingestion_queues(validation_status);
CREATE INDEX IF NOT EXISTS idx_ingestion_queue_venue ON public.ingestion_queues(matched_venue_id);
