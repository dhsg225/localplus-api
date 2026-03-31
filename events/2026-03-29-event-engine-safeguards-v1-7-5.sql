-- [2026-03-29] - Event Engine v1.7.5 Safeguards
-- Goals: Duplication Protection, Idempotency, and Temporal Constraints.

-- 1. Unique Constraint for Instance Duplication Protection
ALTER TABLE public.event_instances
    ADD CONSTRAINT unique_event_instance_per_start UNIQUE (event_id, start_time);

-- 2. Idempotency Support for the Event Engine
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS idempotency_key UUID DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_idempotency ON public.events(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 3. Optimization: Index for future-only instance wiping
CREATE INDEX IF NOT EXISTS idx_instances_future_generated 
ON public.event_instances(event_id, start_time, source_type) 
WHERE deleted_at IS NULL;
