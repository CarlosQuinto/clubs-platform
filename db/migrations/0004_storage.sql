-- Bucket público «media» para imágenes (antes Cloud Storage + storage.rules).
-- Rutas: platform/<carpeta>/<archivo> y clubs/<clubId>/<carpeta>/<archivo>. Lectura pública;
-- escritura y borrado solo con sesión, en esas dos carpetas raíz. Máximo 5 MB, solo jpeg/png/webp.
-- Quién puede enlazar una imagen a un club lo decide la mutación, no Storage (igual que antes).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "media: lectura publica" ON storage.objects;
CREATE POLICY "media: lectura publica" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media: subida con sesion" ON storage.objects;
CREATE POLICY "media: subida con sesion" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] IN ('platform', 'clubs'));

DROP POLICY IF EXISTS "media: reemplazo con sesion" ON storage.objects;
CREATE POLICY "media: reemplazo con sesion" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] IN ('platform', 'clubs'))
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] IN ('platform', 'clubs'));

DROP POLICY IF EXISTS "media: borrado con sesion" ON storage.objects;
CREATE POLICY "media: borrado con sesion" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] IN ('platform', 'clubs'));
