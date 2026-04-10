-- SYRON MAN - REPARO TOTAL DE BANCO DE DADOS V2
-- Consolida segurança, permissões e visualização de pedidos

-- 1. TABELAS DE SEGURANÇA
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
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ASSINATURA V6 (MASTER)
INSERT INTO public.system_signature (signature_key, owner)
VALUES ('U1lST04tQ09SRS1TRUNVUkUtMjAyNg==', 'SYRON CORE MASTER')
ON CONFLICT (signature_key) DO UPDATE SET owner = 'SYRON CORE MASTER';

INSERT INTO public.licenses (license_key, client_name, status, expires_at, domain)
VALUES ('SYRON-DEV-MASTER-2026', 'AMBIENTE DESENVOLVIMENTO', 'active', '2099-12-31 23:59:59+00', 'localhost')
ON CONFLICT (license_key) DO UPDATE SET status = 'active', expires_at = '2099-12-31 23:59:59+00';

-- 3. RPC: get_my_role_v6 (Autenticação)
CREATE OR REPLACE FUNCTION get_my_role_v6()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    user_email := auth.email();
    
    -- Admin Master (Hardcoded for emergency)
    IF user_email = 'otacilio2966@gmail.com' THEN
        RETURN 'admin_master';
    END IF;

    SELECT role INTO user_role FROM public.admin_users WHERE email = user_email;
    RETURN COALESCE(user_role, 'client');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: get_admin_orders_v1 (Visualização de Pedidos)
CREATE OR REPLACE FUNCTION get_admin_orders_v1()
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    customer_name TEXT,
    customer_email TEXT,
    total DECIMAL,
    order_status TEXT,
    payment_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    item_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.total,
        o.order_status,
        o.payment_status,
        o.created_at,
        (SELECT COUNT(*) FROM public.order_items oi WHERE oi.order_id = o.id) as item_count
    FROM public.orders o
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. PERMISSÕES RLS
ALTER TABLE public.system_signature ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global Read Security" ON public.system_signature;
CREATE POLICY "Global Read Security" ON public.system_signature FOR SELECT USING (true);

DROP POLICY IF EXISTS "Global Read License" ON public.licenses;
CREATE POLICY "Global Read License" ON public.licenses FOR SELECT USING (true);

-- Garantir que a tabela orders e order_items permitam leitura pelo administrador
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders" ON public.orders 
    FOR SELECT USING (auth.role() = 'authenticated');
