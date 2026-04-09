-- SYRON MAN - GESTÃO DE PRODUTOS ELITE V2.1
-- Redefinindo assinatura para garantir match com o schema cache do PostgREST.

CREATE OR REPLACE FUNCTION public.manage_products_v2(
    p_data JSONB,
    p_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result_id UUID;
BEGIN
    -- Se p_id for uma string vazia ou inválida, tratar como NULL
    IF p_id IS NOT NULL AND p_id::TEXT = '' THEN
        p_id := NULL;
    END IF;

    IF p_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.products WHERE id = p_id) THEN
        -- OPERAÇÃO: UPDATE
        UPDATE public.products
        SET 
            name = COALESCE((p_data->>'name'), name),
            description = COALESCE((p_data->>'description'), description),
            price = COALESCE((p_data->>'price')::DECIMAL, price),
            cost_price = COALESCE((p_data->>'cost_price')::DECIMAL, cost_price),
            old_price = CASE WHEN p_data ? 'old_price' AND (p_data->>'old_price') != '' THEN (p_data->>'old_price')::DECIMAL ELSE old_price END,
            category_id = COALESCE((p_data->>'category_id')::UUID, category_id),
            category_name = COALESCE((p_data->>'category_name'), category_name),
            image_url = COALESCE((p_data->>'image_url'), image_url),
            gallery = CASE WHEN p_data ? 'gallery' THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'gallery')) ELSE gallery END,
            video_url = COALESCE((p_data->>'video_url'), video_url),
            material = COALESCE((p_data->>'material'), material),
            stock_quantity = COALESCE((p_data->>'stock_quantity')::INTEGER, stock_quantity),
            is_active = COALESCE((p_data->>'is_active')::BOOLEAN, is_active),
            sales_limit = COALESCE((p_data->>'sales_limit')::INTEGER, sales_limit),
            limit_enabled = COALESCE((p_data->>'limit_enabled')::BOOLEAN, limit_enabled),
            updated_at = NOW()
        WHERE id = p_id
        RETURNING id INTO v_result_id;
    ELSE
        -- OPERAÇÃO: INSERT
        INSERT INTO public.products (
            name,
            description,
            price,
            cost_price,
            old_price,
            category_id,
            category_name,
            image_url,
            gallery,
            video_url,
            material,
            stock_quantity,
            is_active,
            sales_limit,
            limit_enabled
        ) VALUES (
            (p_data->>'name'),
            (p_data->>'description'),
            COALESCE((p_data->>'price')::DECIMAL, 0.00),
            COALESCE((p_data->>'cost_price')::DECIMAL, 0.00),
            CASE WHEN (p_data->>'old_price') != '' THEN (p_data->>'old_price')::DECIMAL ELSE NULL END,
            (p_data->>'category_id')::UUID,
            (p_data->>'category_name'),
            (p_data->>'image_url'),
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'gallery', '[]'::jsonb))),
            (p_data->>'video_url'),
            (p_data->>'material'),
            COALESCE((p_data->>'stock_quantity')::INTEGER, 0),
            COALESCE((p_data->>'is_active')::BOOLEAN, true),
            COALESCE((p_data->>'sales_limit')::INTEGER, 0),
            COALESCE((p_data->>'limit_enabled')::BOOLEAN, false)
        )
        RETURNING id INTO v_result_id;
    END IF;

    RETURN (SELECT row_to_json(p) FROM public.products p WHERE id = v_result_id)::JSONB;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao processar produto: %', SQLERRM;
END;
$$;
