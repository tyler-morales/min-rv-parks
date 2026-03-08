-- Listing photos bucket: public read; authenticated upload/delete (app enforces host ownership).
-- Create bucket if not present (idempotent).
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload to listing-photos (API verifies host owns listing).
CREATE POLICY "Hosts can upload listing photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-photos');

-- Public read for listing images (anyone can view).
CREATE POLICY "Public can read listing photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'listing-photos');

-- Authenticated users can delete only objects in folders that are their listing ids.
CREATE POLICY "Hosts can delete own listing photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.listings WHERE host_id = auth.uid()
    )
  );
