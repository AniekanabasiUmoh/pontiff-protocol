# Supabase Storage Bucket Setup - Quick Guide

**Time Required:** 5 minutes  
**Project:** The Pontiff Protocol  
**Bucket Name:** `confession-images`

---

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Log in if needed
3. Select your project: **`rwilifqotgmqkbzkzudh`**

---

### Step 2: Navigate to Storage

1. Look at the **left sidebar**
2. Click the **Storage** icon (looks like a cabinet/folder)
3. You should see a list of buckets (if any exist)

---

### Step 3: Create New Bucket

1. Click the **"New bucket"** button (top right)

2. Fill in the form:
   - **Name:** `confession-images` (EXACT spelling, no spaces)
   - **Public bucket:** ✅ **Turn ON** (toggle switch)
   - **File size limit:** `5242880` (5MB in bytes)
   - **Allowed MIME types:** Leave empty or add:
     - `image/svg+xml`
     - `image/png`
     - `image/jpeg`

3. Click **"Create bucket"**

---

### Step 4: Set Security Policies

1. In the Storage sidebar, find **`confession-images`** bucket
2. Click on it to expand
3. Click the **"Policies"** tab
4. Click **"New policy"**

#### Policy 1: Public Read Access

```
Policy name: Public Read Access
Operation: SELECT
Target roles: public (or leave as anon)
```

**Using SQL Editor:**
```sql
CREATE POLICY "Public  read access for confession images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'confession-images' );
```

#### Policy 2: Service Role Upload

```
Policy name: Service Role Upload
Operation: INSERT
Target roles: service_role
```

**Using SQL Editor:**
```sql
CREATE POLICY "Service role can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'confession-images' 
  AND auth.role() = 'service_role'
);
```

---

## Verification

### Test Bucket Access

After creating the bucket, test it:

```bash
curl -X POST http://localhost:3001/api/confess \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"0x1234567890123456789012345678901234567890\"}"
```

**Look for in response:**
```json
{
  "writImageUrl": "https://rwilifqotgmqkbzkzudh.supabase.co/storage/v1/object/public/confession-images/writs/writ-abc123.svg"
}
```

If you see a URL instead of `null`, it worked! ✅

### View the Image

1. Copy the `writImageUrl` from the response
2. Paste it in your browser
3. You should see the medieval Writ of Indulgence!

---

## Troubleshooting

### Problem: Bucket already exists error

**Solution:** The bucket name is taken. Either:
- Delete the existing bucket
- Or update `apps/api/src/services/storage.ts` to use a different name

### Problem: writImageUrl is still null

**Possible causes:**
1. Bucket not created → Check dashboard
2. Bucket is private → Make sure "Public bucket" is ON
3. Wrong bucket name → Must be exactly `confession-images`
4. Policies not set → Go to Policies tab and add them

### Problem: Can't access image URL

**Solution:** Bucket must be public. Check:
1. Storage → confession-images → Settings
2. "Public bucket" toggle should be ON (green)

---

## Quick Visual Guide

```
Dashboard Homepage
  ↓
Select Project (rwilifqotgmqkbzkzudh)
  ↓
Left Sidebar → Storage
  ↓
New Bucket Button
  ↓
Name: confession-images
Public: ON
  ↓
Create Bucket
  ↓
Policies Tab → New Policy
  ↓
Add SELECT (public read)
  ↓
Add INSERT (service role upload)
  ↓
✅ Done!
```

---

## Expected Folder Structure

Once writs start uploading:

```
confession-images/
  └── writs/
      ├── writ-abc123.svg
      ├── writ-def456.svg
      └── writ-ghi789.svg
```

The API automatically creates the `writs/` subfolder.

---

## Storage Limits (Free Tier)

- **Storage:** 1 GB free
- **Bandwidth:** 2 GB/month free
- **Requests:** Unlimited

**Your usage (estimated):**
- Each writ: ~50-100 KB
- 1000 writs ≈ 100 MB storage
- **Well within free tier!** ✅

---

## After Setup

Once the bucket is created, the API will automatically:
1. Generate medieval writ images
2. Upload them to `confession-images/writs/`
3. Return public URLs in `/api/confess` response
4. Images are shareable on social media

No code changes needed - it's plug and play! 🎉

---

**Need help?** Check:
- Supabase docs: https://supabase.com/docs/guides/storage
- Or ask me if you hit any issues!
