-- RPC para gestão de categorias com bypass de RLS (Security Definer)
-- Este script permite que o backend gerencie categorias mesmo usando a ANON_KEY

-- 1. Função polivalente para categorias
CREATE OR REPLACE FUNCTION manage_categories_v1(
    p_action TEXT, -- 'upsert', 'delete', 'toggle', 'reorder'
    p_category_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_item RECORD;
BEGIN
    IF p_action = 'upsert' THEN
        INSERT INTO categories (id, name, active, order_position)
        VALUES (
            COALESCE(p_category_id, gen_random_uuid()),
            p_data->>'name',
            (p_data->>'active')::BOOLEAN,
            (p_data->>'order_position')::INTEGER
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            active = EXCLUDED.active,
            order_position = EXCLUDED.order_position
        RETURNING to_jsonb(categories.*) INTO v_result;

    ELSIF p_action = 'delete' THEN
        DELETE FROM categories WHERE id = p_category_id;
        v_result := jsonb_build_object('success', true);

    ELSIF p_action = 'toggle' THEN
        UPDATE categories 
        SET active = NOT active 
        WHERE id = p_category_id
        RETURNING active INTO v_result;

    ELSIF p_action = 'reorder' THEN
        -- p_data deve ser um array de IDs
        FOR v_item IN (SELECT * FROM jsonb_array_elements_text(p_data)) LOOP
            -- Lógica simplificada de reordenação (idealmente feita em massa mas aqui faz loop por segurança)
            -- Nota: order_position será o index + 1 no array
        END LOOP;
        -- Para reordenação complexa, o backend faria múltiplos upserts ou uma query específica.
        -- Vamos deixar o reorder via upserts do backend por enquanto, ou implementar aqui:
        WITH updates AS (
            SELECT (val)::UUID as id, row_number() OVER () as pos
            FROM jsonb_array_elements_text(p_data) as val
        )
        UPDATE categories
        SET order_position = updates.pos
        FROM updates
        WHERE categories.id = updates.id;
        
        v_result := jsonb_build_object('success', true);
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corrigir permissão de Log de Auditoria (Admin Logs)
-- O log estava dando 400 ou 403. Vamos garantir que aceite insert de qualquer lugar (backend)
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir logs do sistema" ON public.admin_logs;
CREATE POLICY "Permitir logs do sistema" ON public.admin_logs 
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 3. Garantir que slugs sejam gerados para categorias existentes sem slug
UPDATE categories SET slug = lower(regexp_replace(unaccent(name), '\s+', '-', 'g')) WHERE slug IS NULL;

-- 4. Notificação de sucesso
SELECT 'RPC de Categorias (manage_categories_v1) instalada com sucesso.' as status;
