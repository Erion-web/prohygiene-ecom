-- Run this in: Supabase Dashboard > SQL Editor
-- Then sign OUT and sign back IN so your JWT refreshes with the new role.

-- 1. Set role in app_metadata (goes into the JWT — no profiles table needed)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'erion@gen-z.digital';

-- 2. Upsert profile row (needed for admin UI features)
INSERT INTO public.profiles (id, email, full_name, role, customer_type)
SELECT id, email, email, 'admin', 'individual'
FROM auth.users
WHERE email = 'erion@gen-z.digital'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verify:
SELECT id, email, raw_app_meta_data FROM auth.users WHERE email = 'erion@gen-z.digital';
