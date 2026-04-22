-- Типы рекламы
CREATE TYPE public.ad_type AS ENUM (
  'billboard',
  'pavilion_paint',
  'led_running_line',
  'roof_sign',
  'facade_banner',
  'window_sticker',
  'pillar_wrap',
  'wall_mural',
  'sidewalk_stand',
  'digital_screen',
  'flag_pole'
);

CREATE TYPE public.ad_traffic AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.ad_availability AS ENUM ('available', 'occupied', 'reserved');

CREATE TABLE public.ad_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  ad_type public.ad_type NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  traffic public.ad_traffic NOT NULL DEFAULT 'medium',
  side TEXT DEFAULT '',
  lighting TEXT DEFAULT 'day',
  width_m NUMERIC DEFAULT 0,
  height_m NUMERIC DEFAULT 0,
  availability public.ad_availability NOT NULL DEFAULT 'available',
  photo TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_placements_property ON public.ad_placements(property_id);
CREATE INDEX idx_ad_placements_type ON public.ad_placements(ad_type);
CREATE INDEX idx_ad_placements_active ON public.ad_placements(is_active);

ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active placements"
ON public.ad_placements FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated can view all placements"
ON public.ad_placements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and managers can insert placements"
ON public.ad_placements FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update placements"
ON public.ad_placements FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete placements"
ON public.ad_placements FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ad_placements_updated_at
BEFORE UPDATE ON public.ad_placements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Сидинг мок-данных: 3–5 случайных позиций на каждый активный объект
DO $$
DECLARE
  prop RECORD;
  types public.ad_type[] := ARRAY['billboard','pavilion_paint','led_running_line','roof_sign','facade_banner','window_sticker','pillar_wrap','wall_mural','sidewalk_stand','digital_screen','flag_pole']::public.ad_type[];
  traffics public.ad_traffic[] := ARRAY['low','medium','high']::public.ad_traffic[];
  sides TEXT[] := ARRAY['Фасад','Торец','Крыша','Входная группа','Внутри'];
  lights TEXT[] := ARRAY['day','24/7'];
  count_per INT;
  i INT;
  t public.ad_type;
  base_price NUMERIC;
BEGIN
  FOR prop IN SELECT id FROM public.properties WHERE is_active = true LOOP
    count_per := 3 + floor(random() * 3)::int; -- 3..5
    FOR i IN 1..count_per LOOP
      t := types[1 + floor(random() * array_length(types,1))::int];
      base_price := CASE t
        WHEN 'billboard' THEN 35000 + floor(random()*40000)
        WHEN 'pavilion_paint' THEN 80000 + floor(random()*120000)
        WHEN 'led_running_line' THEN 25000 + floor(random()*30000)
        WHEN 'roof_sign' THEN 45000 + floor(random()*60000)
        WHEN 'facade_banner' THEN 30000 + floor(random()*40000)
        WHEN 'window_sticker' THEN 8000 + floor(random()*12000)
        WHEN 'pillar_wrap' THEN 18000 + floor(random()*22000)
        WHEN 'wall_mural' THEN 60000 + floor(random()*80000)
        WHEN 'sidewalk_stand' THEN 6000 + floor(random()*10000)
        WHEN 'digital_screen' THEN 70000 + floor(random()*60000)
        WHEN 'flag_pole' THEN 12000 + floor(random()*15000)
      END;
      INSERT INTO public.ad_placements (
        property_id, ad_type, title, description, monthly_price,
        traffic, side, lighting, width_m, height_m, availability
      ) VALUES (
        prop.id,
        t,
        '',
        '',
        base_price,
        traffics[1 + floor(random()*3)::int],
        sides[1 + floor(random()*array_length(sides,1))::int],
        lights[1 + floor(random()*array_length(lights,1))::int],
        round((1 + random()*8)::numeric, 1),
        round((1 + random()*5)::numeric, 1),
        CASE WHEN random() < 0.75 THEN 'available'::public.ad_availability
             WHEN random() < 0.9 THEN 'reserved'::public.ad_availability
             ELSE 'occupied'::public.ad_availability END
      );
    END LOOP;
  END LOOP;
END $$;