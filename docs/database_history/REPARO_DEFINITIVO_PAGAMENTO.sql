-- SYRON Man - REPARO TOTAL E DEFINITIVO (ESTRUTURA + PERMISSÕES + TRIGGER)
-- Rode este script para garantir que o sistema de pagamento funcione 100%

-- 1. GARANTIR COLUNAS (Caso alguma tenha falhado antes)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lucro_estimado NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_data JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_vendido INTEGER DEFAULT 0;

-- 2. LIBERAR PERMISSÕES DE ATUALIZAÇÃO (RLS)
-- Isso garante que o site consiga mudar o status do pedido
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
DROP POLICY IF EXISTS "Allow public update for status" ON orders;

-- Criar política que permite atualização (necessário para o painel admin e automação)
CREATE POLICY "Allow update for all" ON orders 
FOR UPDATE USING (true) WITH CHECK (true);

-- 3. TRIGGER DE AUTOMAÇÃO ULTRA-ROBUSTO
CREATE OR REPLACE FUNCTION reduce_stock_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_lucro_total NUMERIC(15,2) := 0;
BEGIN
    -- Verifica se o status mudou para aprovado (aceita 'paid', 'pago' ou 'approved')
    IF (LOWER(NEW.payment_status) IN ('paid', 'pago', 'approved') OR LOWER(NEW.order_status) IN ('paid', 'pago', 'approved')) AND 
       (COALESCE(LOWER(OLD.payment_status), '') NOT IN ('paid', 'pago', 'approved')) THEN
        
        -- Registra a data exata da aprovação
        NEW.payment_date := NOW();

        -- Processa cada item do pedido
        FOR item IN (SELECT product_id, quantity, unit_price, unit_cost FROM order_items WHERE order_id = NEW.id) LOOP
            -- Atualiza estoque e total de vendas do produto
            UPDATE products 
            SET 
                stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - COALESCE(item.quantity, 0), 0),
                total_vendido = COALESCE(total_vendido, 0) + COALESCE(item.quantity, 0)
            WHERE id = item.product_id;

            -- Calcula o lucro acumulado
            v_lucro_total := v_lucro_total + ((COALESCE(item.unit_price, 0) - COALESCE(item.unit_cost, 0)) * COALESCE(item.quantity, 0));
        END LOOP;

        -- Salva o lucro no pedido para relatórios financeiros
        NEW.lucro_estimado := v_lucro_total;

        RAISE NOTICE 'AUTOMAÇÃO: Pedido % aprovado, estoque e lucros atualizados!', NEW.order_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. VINCULAR TRIGGER
DROP TRIGGER IF EXISTS tr_reduce_stock_on_payment ON orders;
CREATE TRIGGER tr_reduce_stock_on_payment
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION reduce_stock_on_payment();

-- BLOCO DE VERIFICAÇÃO FINAL
SELECT 'SISTEMA RESTAURADO!' as status, 
       (SELECT count(*) FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_date') as col_date_ok,
       (SELECT count(*) FROM pg_policies WHERE tablename='orders' AND cmd='UPDATE') as update_policy_ok;
