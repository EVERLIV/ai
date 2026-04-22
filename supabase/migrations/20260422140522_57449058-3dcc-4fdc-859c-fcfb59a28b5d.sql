-- Restore ad_placements mock data for current active properties
DO $$
DECLARE
  prop RECORD;
  ad_count INT;
  i INT;
  ad_types_arr TEXT[] := ARRAY['billboard','pavilion_paint','led_running_line','roof_sign','facade_banner','window_sticker','pillar_wrap','wall_mural','sidewalk_stand','digital_screen','flag_pole'];
  traffic_arr TEXT[] := ARRAY['low','medium','high'];
  avail_arr TEXT[] := ARRAY['available','available','available','occupied','reserved'];
  side_arr TEXT[] := ARRAY['Фасад','Торец','Крыша','Входная группа','Внутри'];
  lighting_arr TEXT[] := ARRAY['day','24/7'];
  chosen_type TEXT;
  chosen_traffic TEXT;
  chosen_avail TEXT;
  chosen_side TEXT;
  chosen_light TEXT;
  type_label TEXT;
  price NUMERIC;
  width_v NUMERIC;
  height_v NUMERIC;
  type_labels_map JSONB := '{
    "billboard": "Билборд 3×6",
    "pavilion_paint": "Фирменная покраска павильона",
    "led_running_line": "Бегущая LED-строка",
    "roof_sign": "Крышная установка",
    "facade_banner": "Фасадный баннер",
    "window_sticker": "Брендирование витрин",
    "pillar_wrap": "Брендирование колонн",
    "wall_mural": "Граффити на стене",
    "sidewalk_stand": "Штендер у входа",
    "digital_screen": "Цифровой экран",
    "flag_pole": "Флагшток"
  }'::jsonb;
BEGIN
  FOR prop IN SELECT id, address FROM public.properties WHERE is_active = true LOOP
    ad_count := 3 + floor(random() * 3)::int; -- 3..5
    FOR i IN 1..ad_count LOOP
      chosen_type := ad_types_arr[1 + floor(random() * array_length(ad_types_arr,1))::int];
      chosen_traffic := traffic_arr[1 + floor(random() * array_length(traffic_arr,1))::int];
      chosen_avail := avail_arr[1 + floor(random() * array_length(avail_arr,1))::int];
      chosen_side := side_arr[1 + floor(random() * array_length(side_arr,1))::int];
      chosen_light := lighting_arr[1 + floor(random() * array_length(lighting_arr,1))::int];
      type_label := type_labels_map->>chosen_type;
      price := (15000 + floor(random() * 75000)::int / 1000 * 1000);
      width_v := round((1 + random() * 9)::numeric, 1);
      height_v := round((1 + random() * 5)::numeric, 1);

      INSERT INTO public.ad_placements (
        property_id, ad_type, title, description, monthly_price,
        traffic, availability, side, lighting, width_m, height_m, is_active
      ) VALUES (
        prop.id,
        chosen_type::ad_type,
        type_label || ' — ' || prop.address,
        'Рекламная позиция на объекте по адресу ' || prop.address || '. Сторона: ' || chosen_side || '.',
        price,
        chosen_traffic::ad_traffic,
        chosen_avail::ad_availability,
        chosen_side,
        chosen_light,
        width_v,
        height_v,
        true
      );
    END LOOP;
  END LOOP;
END $$;