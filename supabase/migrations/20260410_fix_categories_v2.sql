-- SYRON MAN - CORREÇÃO DE CATEGORIAS V2
-- Adiciona colunas faltantes e centraliza a lógica de gestão via RPC

-- 1. ADICIONAR COLUNAS FALTANTES (SE NÃO EXISTIREM)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='categories' AND COLUMN_NAME='active') THEN
        ALTER TABLE categories ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='categories' AND COLUMN_NAME='order_position') THEN
        ALTER TABLE categories ADD COLUMN order_position INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='categories' AND COLUMN_NAME='slug') THEN
        ALTER TABLE categories ADD COLUMN slug TEXT;
    END IF;
END $$;

-- 2. FUNÇÃO PARA GERAR SLUG AUTOMATICAMENTE (OPCIONAL MAS ÚTIL)
CREATE OR REPLACE FUNCTION generate_category_slug() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_category_slug ON categories;
CREATE TRIGGER trigger_generate_category_slug 
BEFORE INSERT OR UPDATE OF name ON categories
FOR EACH ROW EXECUTE PROCEDURE generate_category_slug();

-- 3. FUNÇÃO RPC: manage_categories_v1
-- Centraliza todas as operações para evitar problemas de concorrência ou falta de colunas no backend antigo
CREATE OR REPLACE FUNCTION manage_categories_v1(
    p_action TEXT,
    p_category_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_id UUID;
    v_active_result BOOLEAN;
BEGIN
    -- Ação: UPSERT (Criar ou Atualizar)
    IF p_action = 'upsert' THEN
        INSERT INTO categories (id, name, active, order_position)
        VALUES (
            COALESCE(p_category_id, uuid_generate_v4()),
            (p_data->>'name')::TEXT,
            COALESCE((p_data->>'active')::BOOLEAN, true),
            COALESCE((p_data->>'order_position')::INTEGER, 0)
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            active = EXCLUDED.active,
            order_position = EXCLUDED.order_position
        RETURNING id INTO v_id;
        
        v_result := jsonb_build_object('id', v_id, 'status', 'success');

    -- Ação: DELETE
    ELSIF p_action = 'delete' THEN
        DELETE FROM categories WHERE id = p_category_id;
        v_result := jsonb_build_object('id', p_category_id, 'status', 'deleted');

    -- Ação: TOGGLE STATUS
    ELSIF p_action = 'toggle' THEN
        UPDATE categories 
        SET active = NOT active 
        WHERE id = p_category_id
        RETURNING active INTO v_active_result;
        
        v_result := jsonb_build_object('id', p_category_id, 'active', v_active_result);

    -- Ação: REORDER
    ELSIF p_action = 'reorder' THEN
        -- p_data deve ser um array de IDs: ["uuid1", "uuid2", ...]
        FOR i IN 0..jsonb_array_length(p_data) - 1 LOOP
            UPDATE categories 
            SET order_position = i 
            WHERE id = (p_data->>i)::UUID;
        END LOOP;
        v_result := jsonb_build_object('status', 'reordered');

    ELSE
        RAISE EXCEPTION 'Ação desconhecida: %', p_action;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GARANTIR RLS (Permitir tudo para autenticados, leitura para todos)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Categories Read" ON categories;
CREATE POLICY "Public Categories Read" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Categories All" ON categories;
CREATE POLICY "Admin Categories All" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. POPULAR SLUGS EXISTENTES (Se houver)
UPDATE categories SET name = name WHERE slug IS NULL;
