-- ============================================================================
--  LAB 3 - Crear el usuario y darle el rol 'admin'
-- ============================================================================
--  PASO 1  Supabase Dashboard > Authentication > Users > "Add user"
--            - Email:        admin@test.com
--            - Password:     123456
--            - ☑ Auto Confirm User
--
--  PASO 2  Copia el UUID del usuario recién creado y ejecútalo aquí:
--            (Dashboard > SQL Editor > New query)

-- Da de alta el perfil si el trigger aún no lo ha creado
INSERT INTO public.profiles (id, role)
VALUES ('PEGA_AQUI_EL_UUID_DEL_USUARIO', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Comprobación: debe aparecer una fila con role = 'admin'
SELECT id, role FROM public.profiles ORDER BY role DESC;
