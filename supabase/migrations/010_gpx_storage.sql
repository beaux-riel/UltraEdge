-- Migration: 010_gpx_storage
-- Description: Private storage bucket for course GPX files so routes follow
--   the account across devices. Objects are stored at {user_id}/{event_id}.gpx
--   and every policy is scoped to the caller's own folder.
-- Created: 2026-07-01

-- ============================================================================
-- 1. BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gpx-files',
  'gpx-files',
  false,
  10485760, -- 10 MB; GPX is text, real course files are well under this
  ARRAY['application/gpx+xml', 'application/xml', 'text/xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. POLICIES (storage.objects)
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own gpx files" ON storage.objects;
CREATE POLICY "Users can read own gpx files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'gpx-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can upload own gpx files" ON storage.objects;
CREATE POLICY "Users can upload own gpx files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gpx-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own gpx files" ON storage.objects;
CREATE POLICY "Users can update own gpx files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gpx-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'gpx-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own gpx files" ON storage.objects;
CREATE POLICY "Users can delete own gpx files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'gpx-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
