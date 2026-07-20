-- Step 1: add cancelled enum value (run separately, then run 20260721_property_public_id_client_flow.sql)

ALTER TYPE public.property_moderation_status ADD VALUE IF NOT EXISTS 'cancelled';
