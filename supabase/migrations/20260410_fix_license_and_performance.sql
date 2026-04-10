-- SYRON MAN - ESTABILIZAÇÃO DE LICENÇA E ASSINATURA V6
-- Resolve erro de Assinatura Inválida e previne timeouts de boot

-- 1. Garantir tabelas de segurança
CREATE TABLE IF NOT EXISTS public.system_signature (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signature_key TEXT NOT NULL UNIQUE,
    owner TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'grace', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    grace_until TIMESTAMP WITH TIME ZONE,
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.license_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key TEXT,
    event TEXT NOT NULL,
    message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Inserir a Assinatura V6 Correta (U1lST04-Q09SRS1TRUNVUkUtMjAyNg==)
INSERT INTO public.system_signature (signature_key, owner)
VALUES ('U1lST04tQ09SRS1TRUNVUkUtMjAyNg==', 'SYRON CORE MASTER')
ON CONFLICT (signature_key) DO UPDATE SET owner = 'SYRON CORE MASTER';

-- 3. Garantir Licença Ativa (VITALÍCIA PARA DEV)
INSERT INTO public.licenses (license_key, client_name, status, expires_at, domain)
VALUES ('SYRON-DEV-MASTER-2026', 'AMBIENTE DESENVOLVIMENTO', 'active', '2099-12-31 23:59:59+00', 'localhost')
ON CONFLICT (license_key) DO UPDATE SET status = 'active', expires_at = '2099-12-31 23:59:59+00';

-- 4. Permissões RLS (Blindagem Básica)
ALTER TABLE public.system_signature ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read system_signature" ON public.system_signature;
CREATE POLICY "Admins can read system_signature" ON public.system_signature
    FOR SELECT USING (true); -- Permitido leitura para validação de boot

DROP POLICY IF EXISTS "Admins can read licenses" ON public.licenses;
CREATE POLICY "Admins can read licenses" ON public.licenses
    FOR SELECT USING (true); -- Permitido leitura para validação de boot
