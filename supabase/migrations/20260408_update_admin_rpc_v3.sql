-- ==========================================================
-- SYRON MAN - UPGRADE DE VISIBILIDADE ADMINISTRATIVA (V3)
-- Adicionando métricas de lucro e data de pagamento ao RPC de Admin.
-- ==========================================================

-- 1. Remover a versão anterior para evitar conflito de assinatura
DROP FUNCTION IF EXISTS get_admin_orders_v1();

-- 2. Recriar com suporte a métricas AI-Ready
CREATE OR REPLACE FUNCTION get_admin_orders_v1()
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    created_at TIMESTAMPTZ,
    paid_at TIMESTAMP,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_cpf TEXT,
    total NUMERIC,
    estimated_profit NUMERIC,
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
        o.paid_at::TIMESTAMP,
        o.customer_name::TEXT,
        o.customer_email::TEXT,
        o.customer_phone::TEXT,
        o.customer_cpf::TEXT,
        o.total::NUMERIC,
        o.estimated_profit::NUMERIC,
        o.payment_status::TEXT,
        o.order_status::TEXT,
        -- Monta o endereço como JSON para o frontend
        COALESCE(jsonb_build_object(
            'street', o.customer_street,
            'number', o.customer_number,
            'neighborhood', o.customer_neighborhood,
            'city', o.customer_city,
            'state', o.customer_state,
            'zipcode', o.customer_zipcode
        ), '{}'::jsonb) as shipping_address,
        -- Agrega os itens como um array JSON
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', i.id,
                'product_name', i.product_name,
                'quantity', i.quantity,
                'unit_price', i.unit_price,
                'unit_cost', i.unit_cost,
                'size', i.size,
                'image_url', i.image_url
            ))
            FROM order_items i
            WHERE i.order_id = o.id
        ), '[]'::jsonb) as items
    FROM orders o
    ORDER BY o.created_at DESC;
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION get_admin_orders_v1() TO anon;
GRANT EXECUTE ON FUNCTION get_admin_orders_v1() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_orders_v1() TO service_role;

SELECT 'RPC get_admin_orders_v1 atualizado para V3 (AI-Analytics Ready)' as status;
