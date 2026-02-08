-- Migration: Storage Bucket Policies (Audit Remediation)

-- Enable RLS on storage.objects if not already enabled (usually is, but good to be safe)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Confession Images (Authenticated Uploads)
-- Allow authenticated users to upload files to 'confession-images' bucket
-- Restriction: User can only upload to a folder named after their UID (or just robust RLS)
-- For simplicity in this context, we allow authenticated uploads to the bucket.
CREATE POLICY "Authenticated Upload Confessions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'confession-images' 
    AND auth.role() = 'authenticated'
  );

-- 2. Certificates (Service Role Only for now, or specific logic)
-- Keeping certificates generation to backend (Service Role)

-- 3. Service Role Delete (Cleanup)
CREATE POLICY "Service Role Delete" ON storage.objects
  FOR DELETE USING (auth.role() = 'service_role');
