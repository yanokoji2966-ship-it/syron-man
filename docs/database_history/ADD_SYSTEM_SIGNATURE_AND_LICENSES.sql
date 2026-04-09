-- Step 1: Create system_signature table
CREATE TABLE IF NOT EXISTS public.system_signature (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signature_key TEXT NOT NULL UNIQUE,
    owner TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 3: Insert initial signature (SYRON-CORE-2026)
-- Obfuscated value: U1lROU4tQ09SRS0yMDI2
INSERT INTO public.system_signature (signature_key, owner)
VALUES ('U1lROU4tQ09SRS0yMDI2', 'SYRON CORE')
ON CONFLICT (signature_key) DO NOTHING;

-- Step 4: Insert a test license (valid for 1 year)
INSERT INTO public.licenses (license_key, client_name, status, expires_at)
VALUES ('SRN-PRO-2026-TRIAL', 'Trial Client', 'active', now() + interval '1 year')
ON CONFLICT (license_key) DO NOTHING;

-- Enable RLS for security (only admins should see this)
ALTER TABLE public.system_signature ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Simple policy: only authenticated users can read (further restriction might be needed based on existing RBAC)
CREATE POLICY "Admins can read system_signature" ON public.system_signature
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can read licenses" ON public.licenses
    FOR SELECT USING (auth.role() = 'authenticated');
