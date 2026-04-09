-- SYRON Man - CORREÇÃO DE ESTRUTURA E AUTOMAÇÃO DE PAGAMENTO
-- Este script adiciona as colunas faltantes e corrige o trigger de automatização.

-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA ORDERS
DO $$ 
BEGIN 
    -- Coluna para data do pagamento
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_date') THEN
        ALTER TABLE orders ADD COLUMN payment_date TIMESTAMP;
    END IF;

    -- Coluna para lucro estimado (para relatórios)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'lucro_estimado') THEN
        ALTER TABLE orders ADD COLUMN lucro_estimado DECIMAL(10,2) DEFAULT 0.00;
    END IF;

    -- Coluna para dados do Pix (QR Code, etc)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'pix_data') THEN
        ALTER TABLE orders ADD COLUMN pix_data JSONB;
    END IF;

    -- Coluna para Link de Checkou Pro
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'checkout_url') THEN
        ALTER TABLE orders ADD COLUMN checkout_url TEXT;
    END IF;
END $$;

-- 2. FUNÇÃO CORRIGIDA PARA REDUZIR ESTOQUE E ATUALIZAR MÉTRICAS
CREATE OR REPLACE FUNCTION reduce_stock_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_lucro_total DECIMAL(10,2) := 0;
BEGIN
    -- Verifica se o status mudou para 'paid' ou 'pago'
    -- Usamos COALESCE para evitar erros se os campos estiverem nulos
    IF (NEW.payment_status = 'paid' OR NEW.order_status = 'pago') AND 
       (OLD.payment_status IS DISTINCT FROM 'paid' AND OLD.order_status IS DISTINCT FROM 'pago') THEN
        
        -- Garante que a data de pagamento seja registrada
        NEW.payment_date := NOW();

        -- Itera sobre os itens do pedido para baixar estoque e atualizar vendas
        FOR item IN (SELECT product_id, quantity, unit_price, unit_cost FROM order_items WHERE order_id = NEW.id) LOOP
            -- Reduz o estoque e aumenta o total vendido do produto
            UPDATE products 
            SET 
                stock_quantity = GREATEST(stock_quantity - item.quantity, 0),
                total_vendido = COALESCE(total_vendido, 0) + item.quantity
            WHERE id = item.product_id;

            -- Acumula o lucro (Preço de Venda - Custo)
            v_lucro_total := v_lucro_total + ((COALESCE(item.unit_price, 0) - COALESCE(item.unit_cost, 0)) * item.quantity);
        END LOOP;

        -- Salva o lucro estimado no pedido
        NEW.lucro_estimado := v_lucro_total;

        RAISE NOTICE 'Estoque reduzido e lucro calculado para o pedido % (Status: Pago)', NEW.order_number;
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
