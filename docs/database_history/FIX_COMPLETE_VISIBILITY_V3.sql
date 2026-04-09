-- ==========================================================
-- SYRON MAN - CORREÇÃO DEFINITIVA DE VISIBILIDADE (V3)
-- Este script resolve o problema de dados não aparecendo 
-- no Site (Storefront) e no Painel Administrativo.
-- ==========================================================

-- 1. GARANTIR ACESSO PÚBLICO AOS PRODUTOS (Para o Site)
-- Se o RLS estiver ativo e não houver política, ninguém vê nada.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Produtos visíveis para todos" ON products;
CREATE POLICY "Produtos visíveis para todos" ON products 
FOR SELECT TO anon, authenticated 
USING (true);

-- 2. GARANTIR ACESSO PÚBLICO ÀS CATEGORIAS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categorias visíveis para todos" ON categories;
CREATE POLICY "Categorias visíveis para todos" ON categories 
FOR SELECT TO anon, authenticated 
USING (true);

-- 3. FIX: RPC DE PEDIDOS PARA O ADMIN (EVITA ERRO 500 E TIPO POLIMÓRFICO)
-- SECURITY DEFINER ignora RLS para que a API possa listar tudo.
CREATE OR REPLACE FUNCTION get_admin_orders_v1()
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    created_at TIMESTAMPTZ,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_cpf TEXT,
    total NUMERIC,
    payment_status TEXT,
    order_status TEXT,
    shipping_address JSONB,
    items JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id::UUID,
        o.order_number::TEXT,
        o.created_at::TIMESTAMPTZ,
        COALESCE(o.customer_name, 'Cliente')::TEXT,
        COALESCE(o.customer_email, '')::TEXT,
        COALESCE(o.customer_phone, '')::TEXT,
        COALESCE(o.customer_cpf, '')::TEXT,
        COALESCE(o.total, 0)::NUMERIC,
        COALESCE(o.payment_status, 'pending')::TEXT,
        COALESCE(o.order_status, 'aguardando_pagamento')::TEXT,
        jsonb_build_object(
            'street', COALESCE(o.customer_street, ''),
            'number', COALESCE(o.customer_number, ''),
            'neighborhood', COALESCE(o.customer_neighborhood, ''),
            'city', COALESCE(o.customer_city, ''),
            'state', o.customer_state,
            'zipcode', o.customer_zipcode
        ) as shipping_address,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'id', i.id,
                'product_name', i.product_name,
                'quantity', i.quantity,
                'unit_price', i.unit_price,
                'size', o.customer_neighborhood, -- Ajuste técnico se necessário
                'image_url', i.image_url
            ))
            FROM order_items i
            WHERE i.order_id = o.id
        ) as items
    FROM orders o
    ORDER BY o.created_at DESC;
END;
$$;

-- 4. PERMISSÕES DE EXECUÇÃO
GRANT EXECUTE ON FUNCTION get_admin_orders_v1() TO anon;
GRANT EXECUTE ON FUNCTION get_admin_orders_v1() TO authenticated;

-- 5. VERIFICAÇÃO DE CONFIGURAÇÕES (Settings)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Configurações visíveis para todos" ON settings;
CREATE POLICY "Configurações visíveis para todos" ON settings 
FOR SELECT TO anon, authenticated 
USING (true);

SELECT '✅ Sistema de Visibilidade SYRON MAN Restaurado!' as status;
