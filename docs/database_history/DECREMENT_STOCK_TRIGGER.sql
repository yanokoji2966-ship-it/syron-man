-- SYRON Man - AUTOMAÇÃO: DECREMENTAR ESTOQUE AO FAZER PEDIDO
-- Execute este script no SQL Editor do Supabase (painel online)
-- Este script deduz o estoque automaticamente quando um item é inserido em order_items

-- 1. FUNÇÃO PARA DIMINUIR ESTOQUE AO CRIAR ITENS DO PEDIDO
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Só deduz se o produto existir e tiver estoque
    IF NEW.product_id IS NOT NULL THEN
        UPDATE products
        SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
        WHERE id = NEW.product_id;

        RAISE NOTICE 'Estoque deduzido: % unidades do produto %', NEW.quantity, NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TRIGGER: dispara ao inserir item de pedido
DROP TRIGGER IF EXISTS tr_decrement_stock_on_order ON order_items;
CREATE TRIGGER tr_decrement_stock_on_order
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_order();

-- 3. RPC para uso pelo frontend (chamada via supabase.rpc)
CREATE OR REPLACE FUNCTION decrement_product_stock(product_id UUID, qty INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET stock_quantity = GREATEST(0, stock_quantity - qty)
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CONFIRMAR
SELECT 'Automação de dedução de estoque ativada com sucesso!' AS status;
