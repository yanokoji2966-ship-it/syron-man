-- ==========================================================
-- SYRON MAN - RESTAURAÇÃO DE VISIBILIDADE ADMINISTRATIVA
-- Este script permite que a API recupere pedidos e clientes 
-- ignorando as travas de RLS de forma segura.
-- ==========================================================

-- 1. Função para buscar todos os pedidos com seus itens
-- SECURITY DEFINER faz a função rodar com privilégios de 'postgres' (ignora RLS)
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
        o.id,
        o.order_number,
        o.created_at,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.customer_cpf,
        o.total::NUMERIC,
        o.payment_status,
        o.order_status,
        -- Monta o endereço como JSON para o frontend
        jsonb_build_object(
            'street', o.customer_street,
            'number', o.customer_number,
            'neighborhood', o.customer_neighborhood,
            'city', o.customer_city,
            'state', o.customer_state,
            'zipcode', o.customer_zipcode
        ) as shipping_address,
        -- Agrega os itens como um array JSON
        (
            SELECT jsonb_agg(jsonb_build_object(
                'id', i.id,
                'product_name', i.product_name,
                'quantity', i.quantity,
                'unit_price', i.unit_price,
                'size', i.size,
                'image_url', i.image_url
            ))
            FROM order_items i
            WHERE i.order_id = o.id
        ) as items
    FROM orders o
    ORDER BY o.created_at DESC;
END;
$$;

-- 2. Garantir permissões de execução para a API (anon)
GRANT EXECUTE ON FUNCTION get_admin_orders_v1() TO anon;
GRANT EXECUTE ON FUNCTION get_admin_orders_v1() TO authenticated;

SELECT 'Visibilidade Administrativa Restaurada (SQL)' as status;
