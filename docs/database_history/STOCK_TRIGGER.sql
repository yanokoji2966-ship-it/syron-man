-- SYRON Man - CORREÃ‡ÃƒO DO TRIGGER DE ESTOQUE PARA EVITAR ERRO DE UUID
-- Execute este script no SQL Editor do Supabase

-- FunÃ§Ã£o corrigida para decrementar o estoque com validaÃ§Ã£o de tipo UUID
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
    valid_product_id UUID;
BEGIN
    -- SÃ³ tenta decrementar se o product_id nÃ£o for nulo
    IF NEW.product_id IS NOT NULL THEN
        -- CORREÃ‡ÃƒO CRÃTICA: Garantir que product_id seja tratado como UUID
        -- Isso evita o erro "operator does not exist: uuid = character varying"
        BEGIN
            valid_product_id := NEW.product_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            -- Se nÃ£o conseguir converter para UUID, ignora o decremento
            RAISE WARNING 'product_id invÃ¡lido (nÃ£o Ã© UUID): %. Pulando decremento de estoque.', NEW.product_id;
            RETURN NEW;
        END;

        -- Obter estoque atual com trava para evitar condiÃ§Ãµes de corrida (SELECT FOR UPDATE)
        SELECT stock_quantity INTO current_stock
        FROM products
        WHERE id = valid_product_id
        FOR UPDATE;

        -- Se nÃ£o encontrou o produto, apenas avisa mas permite a inserÃ§Ã£o
        IF current_stock IS NULL THEN
            RAISE WARNING 'Produto % nÃ£o encontrado na tabela products. Item serÃ¡ criado sem decremento de estoque.', valid_product_id;
            RETURN NEW;
        END IF;

        -- Verifica estoque suficiente
        IF current_stock < NEW.quantity THEN
            RAISE EXCEPTION 'Estoque insuficiente para o produto % (DisponÃ­vel: %, Solicitado: %)', 
                NEW.product_name, current_stock, NEW.quantity;
        END IF;

        -- Decrementa o estoque
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = valid_product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS tr_decrement_stock ON order_items;
CREATE TRIGGER tr_decrement_stock
BEFORE INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_order();
