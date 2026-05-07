CREATE TABLE public.property_units (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  floor text DEFAULT '',
  area numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  price_per_m2 numeric NOT NULL DEFAULT 0,
  purpose text DEFAULT '',
  status text NOT NULL DEFAULT 'available',
  description text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_units_property_id ON public.property_units(property_id);

ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view units of active properties"
ON public.property_units FOR SELECT
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.is_active = true));

CREATE POLICY "Auth can view all units"
ON public.property_units FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and managers can insert units"
ON public.property_units FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update units"
ON public.property_units FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete units"
ON public.property_units FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_property_units_updated_at
BEFORE UPDATE ON public.property_units
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();