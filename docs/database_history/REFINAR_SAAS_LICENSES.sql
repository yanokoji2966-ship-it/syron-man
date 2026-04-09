-- 1. Add fingerprint to licenses
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS fingerprint TEXT;

-- 2. Add ip_address and user_agent to license_logs
ALTER TABLE public.license_logs 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 3. Initial fingerprint for existing licenses (optional)
UPDATE public.licenses 
SET fingerprint = encode(digest(client_name || domain || 'SYRON-SECRET-SALT', 'sha256'), 'hex')
WHERE fingerprint IS NULL AND client_name IS NOT NULL AND domain IS NOT NULL;
