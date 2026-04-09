-- SYRON MAN - IDEMPOTÊNCIA DE WEBHOOKS (SEGURANÇA V4) 🛡️
-- Este script previne processamentos duplicados de pagamentos.

-- 1. TABELA DE CONTROLE DE EVENTOS
-- Registra cada transação processada para evitar repetição.
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
    id SERIAL PRIMARY KEY,
    event_id TEXT NOT NULL,
    event_status TEXT NOT NULL,
    order_number TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, event_status) -- Chave de idempotência dupla
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_event_id ON public.processed_webhooks(event_id);

-- 2. FUNÇÃO SQL DE ATUALIZAÇÃO V4 (ROBUSTA)
-- Esta função é chamada pela API Node.js.
CREATE OR REPLACE FUNCTION update_order_payment_webhook_v4(
    p_order_number TEXT,
    p_status TEXT,
    p_payment_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_actual_number TEXT;
    v_already_processed BOOLEAN;
BEGIN
    -- 1. Verificar idempotência na tabela de controle
    SELECT EXISTS (
        SELECT 1 FROM processed_webhooks 
        WHERE event_id = p_payment_id AND event_status = p_status
    ) INTO v_already_processed;

    IF v_already_processed THEN
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Evento já processado anteriormente (ignorado)', 
            'idempotent', true
        );
    END IF;

    -- 2. Buscar o pedido
    SELECT id, order_number INTO v_order_id, v_actual_number 
    FROM orders 
    WHERE TRIM(order_number) = TRIM(p_order_number)
    LIMIT 1;

    IF v_order_id IS NULL THEN
        -- Se o pedido não existe, registramos a falha de tentativa mas não bloqueamos o webhook
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Pedido não encontrado no banco de dados',
            'order_number', p_order_number
        );
    END IF;

    -- 3. Registrar início do processamento na tabela de idempotência
    INSERT INTO processed_webhooks (event_id, event_status, order_number)
    VALUES (p_payment_id, p_status, v_actual_number);

    -- 4. Executar atualização lógica (Isso dispara o trigger de estoque reduce_stock_on_payment_v3)
    IF p_status = 'approved' THEN
        UPDATE orders 
        SET 
            payment_status = 'paid', 
            order_status = 'pago', 
            paid_at = NOW()
        WHERE id = v_order_id;

        -- Log Central de Auditoria
        INSERT INTO admin_logs (admin_email, action, details)
        VALUES (
            'SYSTEM_WEBHOOK', 
            'PAYMENT_APPROVED_V4', 
            jsonb_build_object(
                'order_number', v_actual_number, 
                'payment_id', p_payment_id,
                'method', 'idempotent_flow'
            )
        );
    ELSE
        -- Outros status (rejected, in_process, etc)
        UPDATE orders SET payment_status = p_status WHERE id = v_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Pagamento processado com sucesso', 
        'status', p_status,
        'order', v_actual_number
    );

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro crítico, o banco faz ROLLBACK e nós retornamos o erro
    RETURN jsonb_build_object(
        'success', false, 
        'message', SQLERRM,
        'hint', 'Erro interno no processamento SQL'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PERMISSÕES
ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sistema gerencia webhooks" ON public.processed_webhooks;
CREATE POLICY "Sistema gerencia webhooks" ON public.processed_webhooks FOR ALL USING (true);

-- Feedback
SELECT 'SISTEMA DE IDEMPOTÊNCIA V4 INSTALADO COM SUCESSO! 🛡️' as msg;
