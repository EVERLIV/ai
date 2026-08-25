-- Подтянуть карточку застройщика на уже опубликованных квартирах
-- (название, лого, about, тип аккаунта). Безопасно повторять.

UPDATE public.properties p
SET
  developer_id = COALESCE(p.developer_id, d.id),
  extras = COALESCE(p.extras, '{}'::jsonb) || jsonb_build_object(
    'agent_account_type', 'developer',
    'developer_id', d.id,
    'agent_company', d.name,
    'agent_name', d.name,
    'agent_avatar_url', COALESCE(NULLIF(d.logo_url, ''), p.extras->>'agent_avatar_url', ''),
    'agent_agency_about', COALESCE(d.about, ''),
    'agent_phone', COALESCE(d.phone, ''),
    'agent_verified', (d.verification_status = 'verified')
  )
FROM public.developers d
WHERE p.developer_id = d.id
   OR (p.extras->>'developer_id') = d.id::text
   OR (
     p.submitted_by IN (
       SELECT user_id FROM public.developer_members WHERE developer_id = d.id
     )
     AND COALESCE(p.extras->>'agent_account_type', '') IN ('', 'owner', 'developer')
     AND p.agency_id IS NULL
   );
