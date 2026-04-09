-- SYRON Man - REFINAMENTO DO GATILHO DE APROVAÃ‡ÃƒO DE PAGAMENTO
-- Este script torna o processamento de aprovaÃ§Ã£o de pagamento mais robusto.
-- Previne erros se o cliente nÃ£o tiver email ou se o produto nÃ£o tiver ID (produtos legados).

CREATE OR REPLACE FUNCTION handle_payment_approval()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Se o status mudou para 'paid' (pago)
    IF (NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid')) THEN
        
        -- 1. Atualizar Metrics do Produto (total_sold) - APENAS SE TIVER PRODUCT_ID
        BEGIN
            FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
                IF item.product_id IS NOT NULL THEN
                    UPDATE products 
                    SET total_sold = COALESCE(total_sold, 0) + item.quantity 
                    WHERE id = item.product_id;
                END IF;
            END LOOP;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Erro ao atualizar total_sold dos produtos no pedido %. Continuando...', NEW.id;
        END;

        -- 2. Upsert na tabela de Customers - APENAS SE TIVER EMAIL (Not Null no Schema)
        IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
            BEGIN
                INSERT INTO customers (email, name, phone, cpf, last_purchase_at, total_orders, total_spent)
                VALUES (NEW.customer_email, NEW.customer_name, NEW.customer_phone, NEW.customer_cpf, NOW(), 1, NEW.total)
                ON CONFLICT (email) DO UPDATE SET
                    name = COALESCE(EXCLUDED.name, customers.name),
                    phone = COALESCE(EXCLUDED.phone, customers.phone),
                    cpf = COALESCE(EXCLUDED.cpf, customers.cpf),
                    last_purchase_at = NOW(),
                    total_orders = customers.total_orders + 1,
                    total_spent = customers.total_spent + NEW.total,
                    average_ticket = (customers.total_spent + NEW.total) / (customers.total_orders + 1),
                    customer_status = CASE 
                        WHEN (customers.total_spent + NEW.total) > 1000 THEN 'vip'
                        ELSE 'ativo'
                    END;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Erro ao sincronizar cliente % no pedido %. Continuando...', NEW.customer_email, NEW.id;
            END;
        END IF;

        -- 3. Registrar no HistÃ³rico de Status
        BEGIN
            INSERT INTO order_status_history (order_id, old_status, new_status, created_at)
            VALUES (NEW.id, OLD.order_status, NEW.order_status, NOW());
        EXCEPTION WHEN OTHERS THEN
             RAISE WARNING 'Erro ao registrar histÃ³rico de status do pedido %. Continuando...', NEW.id;
        END;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- O trigger jÃ¡ existe, e como usamos CREATE OR REPLACE FUNCTION, 
-- a lÃ³gica serÃ¡ atualizada automaticamente no trigger tr_handle_payment_approval.

SELECT 'Gatilho de pagamento refinado com sucesso!' as status;
