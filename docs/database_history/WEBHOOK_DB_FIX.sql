-- SYRON Man - FIX PARA WEBHOOK (SEGURANÇA E AUTOMAÇÃO)
-- Execute este script para permitir que o Webhook atualize os pedidos sem erros de RLS.

-- 1. FUNÇÃO SEGURA PARA ATUALIZAR STATUS DE PAGAMENTO (SECURITY DEFINER)
-- Esta função ignora as regras de RLS do usuário logado, permitindo que o servidor atualize o banco.
CREATE OR REPLACE FUNCTION update_order_payment_webhook(
    p_order_number TEXT,
    p_status TEXT,
    p_payment_id TEXT
)
RETURNS void AS $$
DECLARE
    v_order_id UUID;
    v_current_status TEXT;
BEGIN
    -- 1. Buscar ID e status atual
    SELECT id, payment_status INTO v_order_id, v_current_status 
    FROM orders 
    WHERE order_number = p_order_number;

    IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'Pedido % não encontrado.', p_order_number;
    END IF;

    -- 2. Idempotência: Só atualiza se não estiver pago
    IF v_current_status = 'paid' THEN
        RETURN; -- Já processado
    END IF;

    -- 3. Atualizar Status do Pedido
    IF p_status = 'approved' THEN
        UPDATE orders 
        SET 
            payment_status = 'paid',
            order_status = 'pago',
            paid_at = NOW()
        WHERE id = v_order_id;

        -- O trigger tr_reduce_stock_on_payment cuidará da baixa de estoque automaticamente
        
        -- 4. Registrar Log de Auditoria
        INSERT INTO admin_logs (admin_email, action, details)
        VALUES (
            'SYSTEM_WEBHOOK', 
            'PAYMENT_APPROVED_AUTO', 
            jsonb_build_object(
                'order_number', p_order_number, 
                'payment_id', p_payment_id, 
                'source', 'MercadoPago'
            )
        );
    ELSE
        -- Outros status (rejected, cancelled, etc)
        UPDATE orders 
        SET payment_status = p_status
        WHERE id = v_order_id;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Feedback
SELECT 'Função de Webhook configurada com sucesso!' as status;
