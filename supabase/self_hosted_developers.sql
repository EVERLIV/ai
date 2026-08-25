-- =============================================================================
-- Developers (застройщики): org, members, projects, layouts, media, docs, events
-- Apply after self_hosted_agencies.sql + self_hosted_signup_roles.sql
-- =============================================================================

SET search_path = public;

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE public.developer_member_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.developer_subtype AS ENUM (
    'apartment_developer',
    'frame_house_builder'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.developer_project_kind AS ENUM (
    'residential_complex',
    'house_series'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.developer_project_status AS ENUM (
    'planned',
    'under_construction',
    'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.developer_media_kind AS ENUM (
    'photo',
    'plan',
    'render',
    'progress'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.developer_doc_status AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'profile_account_type' AND e.enumlabel = 'developer'
  ) THEN
    BEGIN
      ALTER TYPE public.profile_account_type ADD VALUE 'developer';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 2) Developers org
CREATE TABLE IF NOT EXISTS public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  about TEXT NOT NULL DEFAULT '',
  subtype public.developer_subtype NOT NULL DEFAULT 'apartment_developer',
  city TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  inn TEXT,
  phone TEXT NOT NULL DEFAULT '',
  website TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  verification_requested_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  avg_rating NUMERIC(3,2),
  reviews_count INTEGER NOT NULL DEFAULT 0,
  promotions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS promotions JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_developers_verification
  ON public.developers (verification_status);
CREATE INDEX IF NOT EXISTS idx_developers_subtype_verification
  ON public.developers (subtype, verification_status);

-- 3) Members (one user → one developer)
CREATE TABLE IF NOT EXISTS public.developer_members (
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.developer_member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (developer_id, user_id),
  CONSTRAINT developer_members_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_developer_members_user
  ON public.developer_members (user_id);

-- 4) Projects
CREATE TABLE IF NOT EXISTS public.developer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  slug TEXT,
  project_kind public.developer_project_kind NOT NULL DEFAULT 'residential_complex',
  status public.developer_project_status NOT NULL DEFAULT 'planned',
  housing_class TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL DEFAULT '',
  delivery_quarter SMALLINT,
  delivery_year INTEGER,
  address TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  description TEXT NOT NULL DEFAULT '',
  cover_photo TEXT,
  mortgage_terms TEXT NOT NULL DEFAULT '',
  installment_terms TEXT NOT NULL DEFAULT '',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  moderation_status public.property_moderation_status NOT NULL DEFAULT 'draft',
  views_count INTEGER NOT NULL DEFAULT 0,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_developer_projects_slug
  ON public.developer_projects (slug) WHERE slug IS NOT NULL AND slug <> '';
CREATE INDEX IF NOT EXISTS idx_developer_projects_developer
  ON public.developer_projects (developer_id, is_published);
CREATE INDEX IF NOT EXISTS idx_developer_projects_status_year
  ON public.developer_projects (status, delivery_year);
CREATE INDEX IF NOT EXISTS idx_developer_projects_published
  ON public.developer_projects (created_at DESC)
  WHERE is_published AND moderation_status = 'published';
CREATE INDEX IF NOT EXISTS idx_developer_projects_search
  ON public.developer_projects USING GIN (search_vector);

CREATE OR REPLACE FUNCTION public.developer_projects_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.address, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.district, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_developer_projects_search ON public.developer_projects;
CREATE TRIGGER trg_developer_projects_search
  BEFORE INSERT OR UPDATE OF title, address, district, description
  ON public.developer_projects
  FOR EACH ROW
  EXECUTE PROCEDURE public.developer_projects_search_vector_update();

-- 5) Phases (очереди / корпуса)
CREATE TABLE IF NOT EXISTS public.project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.developer_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  delivery_quarter SMALLINT,
  delivery_year INTEGER,
  status public.developer_project_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_phases_project
  ON public.project_phases (project_id, sort_order);

-- 6) Unit types (планировки)
CREATE TABLE IF NOT EXISTS public.project_unit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.developer_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  rooms TEXT NOT NULL DEFAULT '',
  area_from NUMERIC,
  area_to NUMERIC,
  floors TEXT NOT NULL DEFAULT '',
  price_from NUMERIC,
  price_to NUMERIC,
  plan_image_url TEXT,
  extras JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_unit_types_project
  ON public.project_unit_types (project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_project_unit_types_rooms_area
  ON public.project_unit_types (rooms, area_from);

-- 7) Construction stages
CREATE TABLE IF NOT EXISTS public.construction_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.developer_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  stage_date DATE,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_construction_stages_project
  ON public.construction_stages (project_id, sort_order);

-- 8) Project media
CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.developer_projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.construction_stages(id) ON DELETE SET NULL,
  kind public.developer_media_kind NOT NULL DEFAULT 'photo',
  url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_media_project_kind
  ON public.project_media (project_id, kind);
CREATE INDEX IF NOT EXISTS idx_project_media_stage
  ON public.project_media (stage_id);

-- 9) Documents
CREATE TABLE IF NOT EXISTS public.developer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL DEFAULT 'license',
  title TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  issued_at DATE,
  expires_at DATE,
  status public.developer_doc_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_developer_documents_developer
  ON public.developer_documents (developer_id, status);

-- 10) Properties linkage
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS developer_project_id UUID REFERENCES public.developer_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS developer_unit_type_id UUID REFERENCES public.project_unit_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_developer
  ON public.properties (developer_id) WHERE developer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_developer_project
  ON public.properties (developer_project_id) WHERE developer_project_id IS NOT NULL;

-- 11) Analytics events (append-only; monthly partitions)
CREATE TABLE IF NOT EXISTS public.developer_analytics_events (
  id BIGSERIAL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.developer_projects(id) ON DELETE SET NULL,
  unit_type_id UUID REFERENCES public.project_unit_types(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  source_page TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE IF NOT EXISTS public.developer_analytics_events_default
  PARTITION OF public.developer_analytics_events DEFAULT;

CREATE TABLE IF NOT EXISTS public.developer_analytics_events_2026_08
  PARTITION OF public.developer_analytics_events
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS public.developer_analytics_events_2026_09
  PARTITION OF public.developer_analytics_events
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE INDEX IF NOT EXISTS idx_dev_events_occurred
  ON public.developer_analytics_events (occurred_at);
CREATE INDEX IF NOT EXISTS idx_dev_events_developer_time
  ON public.developer_analytics_events (developer_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_events_type_time
  ON public.developer_analytics_events (event_type, occurred_at DESC);

-- 12) Webhooks (schema now, worker later)
CREATE TABLE IF NOT EXISTS public.outbound_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT '',
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbound_webhooks_developer
  ON public.outbound_webhooks (developer_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.outbound_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook
  ON public.webhook_deliveries (webhook_id, created_at DESC);

-- 13) Helpers
CREATE OR REPLACE FUNCTION public.is_developer_member(
  p_developer_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_members m
    WHERE m.developer_id = p_developer_id AND m.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_developer_admin(
  p_developer_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_members m
    WHERE m.developer_id = p_developer_id
      AND m.user_id = p_user_id
      AND m.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.my_developer_id(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT m.developer_id FROM public.developer_members m
  WHERE m.user_id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.protect_developer_verification_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $fn$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  ) THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      IF OLD.verification_status IN ('unverified', 'rejected')
         AND NEW.verification_status = 'pending'
         AND public.is_developer_admin(OLD.id) THEN
        NEW.verification_requested_at := now();
      ELSE
        NEW.verification_status := OLD.verification_status;
      END IF;
    END IF;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_protect_developer_verification ON public.developers;
CREATE TRIGGER trg_protect_developer_verification
  BEFORE UPDATE ON public.developers
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_developer_verification_fields();

-- 14) RLS
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_unit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- developers
DROP POLICY IF EXISTS developers_public_select ON public.developers;
CREATE POLICY developers_public_select ON public.developers
  FOR SELECT USING (
    verification_status = 'verified'
    OR public.is_developer_member(id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS developers_member_update ON public.developers;
CREATE POLICY developers_member_update ON public.developers
  FOR UPDATE USING (
    public.is_developer_admin(id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS developers_admin_insert ON public.developers;
CREATE POLICY developers_admin_insert ON public.developers
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR auth.uid() IS NOT NULL
  );

-- members
DROP POLICY IF EXISTS developer_members_select ON public.developer_members;
CREATE POLICY developer_members_select ON public.developer_members
  FOR SELECT USING (
    public.is_developer_member(developer_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS developer_members_admin_all ON public.developer_members;
CREATE POLICY developer_members_admin_all ON public.developer_members
  FOR ALL USING (
    public.is_developer_admin(developer_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- projects
DROP POLICY IF EXISTS developer_projects_public_select ON public.developer_projects;
CREATE POLICY developer_projects_public_select ON public.developer_projects
  FOR SELECT USING (
    (is_published AND moderation_status = 'published')
    OR public.is_developer_member(developer_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS developer_projects_member_write ON public.developer_projects;
CREATE POLICY developer_projects_member_write ON public.developer_projects
  FOR ALL USING (
    public.is_developer_member(developer_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- child tables: public read if parent published; members write
DROP POLICY IF EXISTS project_phases_select ON public.project_phases;
CREATE POLICY project_phases_select ON public.project_phases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.developer_projects p
      WHERE p.id = project_id
        AND (
          (p.is_published AND p.moderation_status = 'published')
          OR public.is_developer_member(p.developer_id)
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

DROP POLICY IF EXISTS project_phases_write ON public.project_phases;
CREATE POLICY project_phases_write ON public.project_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.developer_projects p
      WHERE p.id = project_id
        AND (
          public.is_developer_member(p.developer_id)
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

DROP POLICY IF EXISTS project_unit_types_select ON public.project_unit_types;
CREATE POLICY project_unit_types_select ON public.project_unit_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.developer_projects p
      WHERE p.id = project_id
        AND (
          (p.is_published AND p.moderation_status = 'published' AND is_active)
          OR public.is_developer_member(p.developer_id)
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

DROP POLICY IF EXISTS project_unit_types_write ON public.project_unit_types;
CREATE POLICY project_unit_types_write ON public.project_unit_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.developer_projects p
      WHERE p.id = project_id
        AND (
          public.is_developer_member(p.developer_id)
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

DROP POLICY IF EXISTS construction_stages_select ON public.construction_stages;
CREATE POLICY construction_stages_select ON public.construction_stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.developer_projects p
      WHERE p.id = project_id
        AND (
          (p.is_published AND p.moderation_status = 'published' AND is_published)
          OR public.is_developer_member(p.developer_id)
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

DROP POLICY IF EXISTS construction_stages_write ON public.construction_stages;
CREATE POLICY construction_stages_write ON public.construction_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.developer_projects p
      WHERE p.id = project_id
        AND (
          public.is_developer_member(p.developer_id)
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

DROP POLICY IF EXISTS project_media_select ON public.project_media;
CREATE POLICY project_media_select ON public.project_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.developer_projects p
      WHERE p.id = project_id
        AND (
          (p.is_published AND p.moderation_status = 'published')
          OR public.is_developer_member(p.developer_id)
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

DROP POLICY IF EXISTS project_media_write ON public.project_media;
CREATE POLICY project_media_write ON public.project_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.developer_projects p
      WHERE p.id = project_id
        AND (
          public.is_developer_member(p.developer_id)
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

DROP POLICY IF EXISTS developer_documents_select ON public.developer_documents;
CREATE POLICY developer_documents_select ON public.developer_documents
  FOR SELECT USING (
    public.is_developer_member(developer_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR status = 'approved'
  );

DROP POLICY IF EXISTS developer_documents_write ON public.developer_documents;
CREATE POLICY developer_documents_write ON public.developer_documents
  FOR ALL USING (
    public.is_developer_member(developer_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- analytics: anyone can insert; members/admins read own
DROP POLICY IF EXISTS developer_events_insert ON public.developer_analytics_events;
CREATE POLICY developer_events_insert ON public.developer_analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS developer_events_select ON public.developer_analytics_events;
CREATE POLICY developer_events_select ON public.developer_analytics_events
  FOR SELECT USING (
    (developer_id IS NOT NULL AND public.is_developer_member(developer_id))
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS outbound_webhooks_member ON public.outbound_webhooks;
CREATE POLICY outbound_webhooks_member ON public.outbound_webhooks
  FOR ALL USING (
    public.is_developer_admin(developer_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS webhook_deliveries_member ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_member ON public.webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.outbound_webhooks w
      WHERE w.id = webhook_id
        AND (
          public.is_developer_admin(w.developer_id)
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.developers TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_members TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_projects TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_phases TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_unit_types TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construction_stages TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_media TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_documents TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.developer_analytics_events TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbound_webhooks TO authenticated, service_role;
GRANT SELECT ON public.webhook_deliveries TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.developer_analytics_events_id_seq TO anon, authenticated, service_role;

COMMENT ON TABLE public.developers IS 'Застройщики: apartment_developer | frame_house_builder';
COMMENT ON TABLE public.developer_analytics_events IS
  'Append-only events for BI export (ClickHouse/Metabase); partitioned by month';
COMMENT ON COLUMN public.developer_projects.search_vector IS
  'tsvector for future full-text search; maintained by trigger';
