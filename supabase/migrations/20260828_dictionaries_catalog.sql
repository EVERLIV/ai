-- Catalog admin: metadata + hierarchy on dictionaries
ALTER TABLE dictionaries
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES dictionaries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_dict_category_slug
  ON dictionaries(category, slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dict_parent_id ON dictionaries(parent_id);

CREATE OR REPLACE FUNCTION dictionaries_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dictionaries_updated_at ON dictionaries;
CREATE TRIGGER trg_dictionaries_updated_at
  BEFORE UPDATE ON dictionaries
  FOR EACH ROW EXECUTE FUNCTION dictionaries_set_updated_at();
