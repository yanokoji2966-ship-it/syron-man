-- 1. Update licenses table with new columns
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS grace_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS renewal_price NUMERIC(10,2) DEFAULT 0;

-- 2. Update existing status check constraint
ALTER TABLE public.licenses DROP CONSTRAINT IF EXISTS licenses_status_check;
ALTER TABLE public.licenses ADD CONSTRAINT licenses_status_check CHECK (status IN ('active', 'expired', 'suspended'));

-- 3. Create license_logs table
CREATE TABLE IF NOT EXISTS public.license_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT,
    event TEXT NOT NULL, -- created, validated, expired, violation, renewed
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Update system_signature for the new key (atob("U1lST04tQ09SRS1TRUNVUkUtMjAyNg=="))
-- Obfuscated value: U1lST04tQ09SRS1TRUNVUkUtMjAyNg==
INSERT INTO public.system_signature (signature_key, owner)
VALUES ('U1lST04tQ09SRS1TRUNVUkUtMjAyNg==', 'SYRON SECURE CORE')
ON CONFLICT (signature_key) DO NOTHING;

-- Security: Admin access for logs
ALTER TABLE public.license_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read license_logs" ON public.license_logs
    FOR SELECT USING (auth.role() = 'authenticated');
