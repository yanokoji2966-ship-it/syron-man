-- SYRON Man - AUTOMAÃ‡ÃƒO DE RESTAURAÃ‡ÃƒO DE ESTOQUE
-- Este script garante que o estoque volte ao normal se um pedido for cancelado ou deletado.

-- 1. FUNÃ‡ÃƒO PARA RESTAURAR ESTOQUE AO CANCELAR PEDIDO
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'cancelled' (cancelado)
    IF (NEW.order_status = 'cancelled' OR NEW.payment_status = 'cancelled') AND 
       (OLD.order_status IS DISTINCT FROM 'cancelled' AND OLD.payment_status IS DISTINCT FROM 'cancelled') THEN
        
        -- Aumenta o estoque dos produtos vinculados a este pedido
        UPDATE products p
        SET stock_quantity = p.stock_quantity + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id
        AND p.id = oi.product_id;
        
        RAISE NOTICE 'Estoque restaurado para o pedido % (Status: Cancelado)', NEW.order_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na tabela de pedidos
DROP TRIGGER IF EXISTS tr_restore_stock_on_cancel ON orders;
CREATE TRIGGER tr_restore_stock_on_cancel
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION restore_stock_on_cancel();


-- 2. FUNÃ‡ÃƒO PARA RESTAURAR ESTOQUE AO DELETAR UM ITEM OU PEDIDO
CREATE OR REPLACE FUNCTION restore_stock_on_item_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o item for deletado (ou o pedido inteiro for excluÃ­do), devolve para o estoque
    IF OLD.product_id IS NOT NULL THEN
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE id = OLD.product_id;
        
        RAISE NOTICE 'Estoque devolvido: % unidades do produto ID %', OLD.quantity, OLD.product_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger na tabela de itens do pedido
DROP TRIGGER IF EXISTS tr_restore_stock_on_delete ON order_items;
CREATE TRIGGER tr_restore_stock_on_delete
AFTER DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION restore_stock_on_item_delete();

-- CONFIRMAÃ‡ÃƒO
SELECT 'AutomaÃ§Ã£o de estoque (RestauraÃ§Ã£o) configurada com sucesso!' as status;
