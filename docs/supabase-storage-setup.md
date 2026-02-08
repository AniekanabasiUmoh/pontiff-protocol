# Phase 4: Supabase Storage Setup

## Storage Bucket Configuration

Phase 4 requires a Supabase Storage bucket to store generated Writ images.

### Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `rwilifqotgmqkbzkzudh`

2. **Create New Bucket**
   - Go to **Storage** → **New bucket**
   - Bucket name: `confession-images`
   - **Public bucket**: ✅ YES (images need to be publicly accessible)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: 
     - `image/svg+xml`
     - `image/png`
     - `image/jpeg`

3. **Set Bucket Policies** (Security)
   
   Navigate to **Storage** → **Policies** → **confession-images**

   **Policy 1: Public Read Access**
   ```sql
   CREATE POLICY "Public read access for confession images"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'confession-images' );
   ```

   **Policy 2: Service Role Upload**
   ```sql
   CREATE POLICY "Service role can upload"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'confession-images' 
     AND auth.role() = 'service_role'
   );
   ```

   **Policy 3: Service Role Delete**
   ```sql
   CREATE POLICY "Service role can delete"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'confession-images'
     AND auth.role() = 'service_role'
   );
   ```

4. **Create Folder Structure** (Optional)
   - In the bucket, create a folder: `writs/`
   - This keeps images organized

### Bucket Structure

```
confession-images/
  └── writs/
      ├── writ-{confession-id-1}.svg
      ├── writ-{confession-id-2}.svg
      └── writ-{confession-id-3}.svg
```

### Public URL Pattern

Images will be accessible at:
```
https://rwilifqotgmqkbzkzudh.supabase.co/storage/v1/object/public/confession-images/writs/writ-{id}.svg
```

### Verification

Test bucket access with curl:
```bash
# After creating bucket, test upload works
curl -X POST http://localhost:3001/api/confess \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x1234567890123456789012345678901234567890"}'
```

Response should include:
```json
{
  "writImageUrl": "https://rwilifqotgmqkbzkzudh.supabase.co/storage/v1/object/public/confession-images/writs/writ-123.svg"
}
```

### Troubleshooting

**Error: "Bucket not found"**
- Make sure you created the `confession-images` bucket
- Check bucket name spelling

**Error: "Permission denied"**
- Verify policies are set correctly
- Check that `SUPABASE_SERVICE_ROLE_KEY` is in .env

**Error: "File too large"**
- SVG images should be < 1MB
- Check file size limit in bucket settings

### Storage Costs (Supabase Free Tier)

- **Storage**: 1 GB free
- **Bandwidth**: 2 GB/month free
- **Requests**: Unlimited

**Estimated usage:**
- Each SVG writ: ~50-100 KB
- 1000 writs: ~100 MB storage
- Well within free tier limits!

### Alternative: Skip Storage for MVP

If you don't want to set up Supabase Storage yet, the API will still work:
- Images will be generated
- Upload will fail gracefully
- `writImageUrl` will be `null` in response
- Roast text still works perfectly

You can add storage later without breaking existing code.

---

**Status:** ⏳ Manual setup required  
**Time:** ~5 minutes  
**Required for:** Image persistence (optional for Phase 4 MVP)
