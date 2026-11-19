-- Editable shipping settings (admin → Cilësimet → Transporti)
insert into public.app_settings (key, value) values
  ('shipping', '{"cost": 3, "free_threshold": 30}'::jsonb)
on conflict (key) do nothing;
