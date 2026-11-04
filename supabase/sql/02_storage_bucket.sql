-- ============================================================================
--  LAB 2 - Storage Bucket "galeria" + políticas de RLS sobre storage.objects
--  Ejecuta este fichero en: Supabase Dashboard > SQL Editor > New query
-- ============================================================================

-- 1. Crear el bucket (público para poder mostrar las imágenes en cards) --------
INSERT INTO storage.buckets (id, name, public)
VALUES ('galeria', 'galeria', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permisos de Storage sobre storage.objects --------------------------------

-- Ver las imágenes del bucket (usuarios autenticados)
DROP POLICY IF EXISTS "Ver imagenes del bucket galeria" ON storage.objects;
CREATE POLICY "Ver imagenes del bucket galeria"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'galeria');

-- Subir imágenes (SOLO admins)
DROP POLICY IF EXISTS "Subir imagenes al bucket galeria" ON storage.objects;
CREATE POLICY "Subir imagenes al bucket galeria"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'galeria'
    AND (
      SELECT p.role FROM public.profiles p
      WHERE p.id = auth.uid()
    ) = 'admin'
  );

-- Actualizar/sobrescribir imágenes (SOLO admins)
DROP POLICY IF EXISTS "Actualizar imagenes del bucket galeria" ON storage.objects;
CREATE POLICY "Actualizar imagenes del bucket galeria"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'galeria'
    AND (
      SELECT p.role FROM public.profiles p
      WHERE p.id = auth.uid()
    ) = 'admin'
  )
  WITH CHECK (
    bucket_id = 'galeria'
    AND (
      SELECT p.role FROM public.profiles p
      WHERE p.id = auth.uid()
    ) = 'admin'
  );

-- Eliminar imágenes (SOLO admins)
DROP POLICY IF EXISTS "Eliminar imagenes del bucket galeria" ON storage.objects;
CREATE POLICY "Eliminar imagenes del bucket galeria"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'galeria'
    AND (
      SELECT p.role FROM public.profiles p
      WHERE p.id = auth.uid()
    ) = 'admin'
  );
