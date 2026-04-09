-- SYRON Man - REPARO TOTAL DA ESTRUTURA DE PEDIDOS
-- Este script força a criação das colunas e atualiza a lógica de automação.

-- 1. ADICIONAR COLUNAS (Sem blocos complexos para garantir execução)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lucro_estimado NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_data JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_url TEXT;

-- ADICIONAR COLUNA EM PRODUCTS
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_vendido INTEGER DEFAULT 0;

-- 2. FUNÇÃO DE AUTOMAÇÃO CORRIGIDA
CREATE OR REPLACE FUNCTION reduce_stock_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_lucro_total NUMERIC(15,2) := 0;
BEGIN
    -- Verifica se o pagamento foi aprovado (status muda para paid ou pago)
    IF (NEW.payment_status = 'paid' OR NEW.order_status = 'pago') AND 
       (COALESCE(OLD.payment_status, '') NOT IN ('paid', 'pago') AND COALESCE(OLD.order_status, '') NOT IN ('paid', 'pago', 'pago')) THEN
        
        -- Define a data do pagamento no momento da aprovação
        NEW.payment_date := NOW();

        -- Baixa o estoque e calcula o lucro para cada item
        FOR item IN (SELECT product_id, quantity, unit_price, unit_cost FROM order_items WHERE order_id = NEW.id) LOOP
            -- Atualiza estoque e total vendido
            UPDATE products 
            SET 
                stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - COALESCE(item.quantity, 0), 0),
                total_vendido = COALESCE(total_vendido, 0) + COALESCE(item.quantity, 0)
            WHERE id = item.product_id;

            -- Calcula lucro: (Preço - Custo) * Qtd
            v_lucro_total := v_lucro_total + ((COALESCE(item.unit_price, 0) - COALESCE(item.unit_cost, 0)) * COALESCE(item.quantity, 0));
        END LOOP;

        -- Grava o lucro calculado no pedido
        NEW.lucro_estimado := v_lucro_total;

        RAISE NOTICE 'Sucesso: Pedido % processado e estoque atualizado.', NEW.order_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. RE-VINCULAR O TRIGGER
DROP TRIGGER IF EXISTS tr_reduce_stock_on_payment ON orders;
CREATE TRIGGER tr_reduce_stock_on_payment
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION reduce_stock_on_payment();

-- Feedback de verificação
SELECT 'As colunas foram verificadas e o trigger foi atualizado!' as msg;
