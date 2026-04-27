-- Dar admin a un usuario local por email
-- Reemplazá el email si querés promover otro usuario.

INSERT INTO public.admin_users (user_id)
SELECT id
FROM auth.users
WHERE email = 'tu-email@ejemplo.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verificación rápida:
SELECT u.email, au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
ORDER BY au.created_at DESC;
