-- Migration: FR-15 Founder Video, FR-16 DD Checklist, FR-17 Comparison Tool, FR-18 Q&A Board

-- FR-15: Founder video introduction on startup profiles
ALTER TABLE public.startup_profiles
  ADD COLUMN IF NOT EXISTS founder_video_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS founder_video_thumbnail_url VARCHAR(500);

-- FR-16: Due diligence checklist per connection
CREATE TABLE IF NOT EXISTS public.dd_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  shared_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT dd_checklists_pkey PRIMARY KEY (id),
  CONSTRAINT dd_checklists_connection_unique UNIQUE (connection_id)
);

CREATE INDEX IF NOT EXISTS idx_dd_checklists_connection
  ON public.dd_checklists (connection_id);

DO $$ BEGIN
  CREATE TYPE public.dd_item_status_enum AS ENUM ('REQUESTED', 'IN_REVIEW', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.dd_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.dd_checklists(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (char_length(description) >= 1 AND char_length(description) <= 2000),
  status public.dd_item_status_enum NOT NULL DEFAULT 'REQUESTED',
  due_date DATE,
  response_document_url TEXT,
  response_document_name VARCHAR(255),
  response_submitted_at TIMESTAMP WITHOUT TIME ZONE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT dd_checklist_items_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_dd_checklist_items_checklist
  ON public.dd_checklist_items (checklist_id, sort_order ASC, created_at ASC);

-- FR-17: Saved startup comparison snapshots
CREATE TABLE IF NOT EXISTS public.comparison_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  startup_profile_ids UUID[] NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT comparison_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT comparison_snapshots_startup_count CHECK (
    array_length(startup_profile_ids, 1) >= 1
    AND array_length(startup_profile_ids, 1) <= 4
  )
);

CREATE INDEX IF NOT EXISTS idx_comparison_snapshots_investor
  ON public.comparison_snapshots (investor_user_id, created_at DESC);

-- FR-18: Confidential investor Q&A per connection
DO $$ BEGIN
  CREATE TYPE public.qa_category_enum AS ENUM (
    'MARKET',
    'PRODUCT',
    'TEAM',
    'FINANCIALS',
    'LEGAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.connection_qa_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  asked_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category public.qa_category_enum NOT NULL,
  question TEXT NOT NULL CHECK (char_length(question) >= 1 AND char_length(question) <= 4000),
  asked_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answer TEXT CHECK (answer IS NULL OR (char_length(answer) >= 1 AND char_length(answer) <= 4000)),
  answered_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT connection_qa_threads_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_connection_qa_threads_connection
  ON public.connection_qa_threads (connection_id, asked_at DESC);
