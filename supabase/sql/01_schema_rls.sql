-- ============================================================================
--  LAB 1 - Esquema, roles y RLS (Supabase SQL Editor)
--  Ejecuta este fichero COMPLETO en: Supabase Dashboard > SQL Editor > New query
-- ============================================================================

-- 1. Crear enumeración de roles ------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'user');
  END IF;
END
$$;

-- 2. Crear tabla de perfiles (vinculada a autenticación) ----------------------
CREATE TABLE IF NOT EXISTS public.profiles
(
  id   UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.user_role DEFAULT 'user' NOT NULL
);

-- 3. Crear tabla de clientes ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients
(
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre     TEXT NOT NULL,
  empresa    TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS ------------------------------------------------------------
ALTER TABLE public.clients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para Perfiles (Lectura propia) ---------------------------------
DROP POLICY IF EXISTS "Leer perfil propio" ON public.profiles;
CREATE POLICY "Leer perfil propio"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Un admin puede ver el resto de perfiles (gestión de roles)
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON public.profiles;
CREATE POLICY "Admins pueden ver todos los perfiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Políticas para Clientes (RBAC) -------------------------------------------
-- Lectura: Todos los usuarios autenticados
DROP POLICY IF EXISTS "Lectura para autenticados" ON public.clients;
CREATE POLICY "Lectura para autenticados"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Escritura (Insert, Update, Delete): SOLO Administradores
DROP POLICY IF EXISTS "Escritura solo para admins" ON public.clients;
CREATE POLICY "Escritura solo para admins"
  ON public.clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Trigger: crea automáticamente el perfil 'user' al registrar un usuario ----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Datos de ejemplo (opcional, sólo para admins) ----------------------------
INSERT INTO public.clients (nombre, empresa, email)
VALUES
  ('Lucía Fernández', 'EstudioNova', 'lucia@estudionova.com'),
  ('Marcos Ruiz', 'GrupoAlicante', 'marcos@grupoalicante.com'),
  ('Ana Cortés', 'Café del Puerto', 'ana@cafedelpuerto.com')
ON CONFLICT (email) DO NOTHING;
