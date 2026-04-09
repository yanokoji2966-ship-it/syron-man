-- SYRON MAN - CONSOLIDAÇÃO AI-READY V5.0
-- Este script unifica as melhorias de banco de dados para garantir compatibilidade total com IA e CRM.

-- 1. EXPANSÃO DE TABELAS CORE
-- Garantir que campos de métricas e histórico financeiro existam
DO $$ 
BEGIN
    -- Campos em Orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_profit') THEN
        ALTER TABLE public.orders ADD COLUMN estimated_profit DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_at') THEN
        ALTER TABLE public.orders ADD COLUMN paid_at TIMESTAMP;
    END IF;

    -- Campos em Products
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'total_sold') THEN
        ALTER TABLE public.products ADD COLUMN total_sold INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. CRIAÇÃO DA TABELA DE CLIENTES (CRM)
-- Centraliza dados para análise de comportamento e IA
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    cpf VARCHAR(20),
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    average_ticket DECIMAL(10, 2) DEFAULT 0.00,
    last_purchase_at TIMESTAMP,
    customer_status VARCHAR(50) DEFAULT 'novo', -- novo, ativo, vip, inativo
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABELAS DE HISTÓRICO (POINT 4)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id),
    change_amount INTEGER,
    reason TEXT, -- 'venda', 'cancelamento', 'ajuste_manual'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. AUTOMAÇÃO DE INTELIGÊNCIA (POINT 2 & 3)

-- A. Cálculo de Lucro Automático
CREATE OR REPLACE FUNCTION calculate_order_profit_v5()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.orders
    SET estimated_profit = (
        SELECT COALESCE(SUM((unit_price - unit_cost) * quantity), 0)
        FROM public.order_items
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_calculate_order_profit_v5 ON public.order_items;
CREATE TRIGGER tr_calculate_order_profit_v5
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION calculate_order_profit_v5();

-- B. Sincronização de Cliente ao Pagar (Automático)
CREATE OR REPLACE FUNCTION sync_customer_and_sold_metrics_v5()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- Se o pagamento foi aprovado agora
    IF (NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid')) THEN
        
        -- 1. Atualizar Paid_at
        NEW.paid_at := NOW();

        -- 2. Incrementar Total Vendido nos Produtos
        FOR v_item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            UPDATE public.products 
            SET total_sold = COALESCE(total_sold, 0) + v_item.quantity 
            WHERE id = v_item.product_id;
            
            -- Registrar Movimentação de Estoque
            INSERT INTO public.stock_movements (product_id, order_id, change_amount, reason)
            VALUES (v_item.product_id, NEW.id, -v_item.quantity, 'venda');
        END LOOP;

        -- 3. Sincronizar CRM (Customers)
        INSERT INTO public.customers (email, name, phone, cpf, last_purchase_at, total_orders, total_spent)
        VALUES (NEW.customer_email, NEW.customer_name, NEW.customer_phone, NEW.customer_cpf, NOW(), 1, NEW.total)
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            cpf = EXCLUDED.cpf,
            last_purchase_at = NOW(),
            total_orders = customers.total_orders + 1,
            total_spent = customers.total_spent + NEW.total,
            average_ticket = (customers.total_spent + NEW.total) / (customers.total_orders + 1),
            customer_status = CASE 
                WHEN (customers.total_spent + NEW.total) > 1000 THEN 'vip'
                ELSE 'ativo'
            END;

        -- 4. Histórico de Status
        INSERT INTO public.order_status_history (order_id, old_status, new_status)
        VALUES (NEW.id, OLD.order_status, NEW.order_status);

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_customer_metrics_v5 ON public.orders;
CREATE TRIGGER tr_sync_customer_metrics_v5
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION sync_customer_and_sold_metrics_v5();

-- 5. PERMISSÕES RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Admins view status history" ON public.order_status_history FOR SELECT USING (true);
CREATE POLICY "Admins full access on stock movements" ON public.stock_movements FOR ALL USING (true);

-- 6. CARGA INICIAL (Sync de clientes baseados em pedidos existentes)
INSERT INTO public.customers (email, name, phone, cpf, last_purchase_at, total_orders, total_spent)
SELECT 
    customer_email, 
    MAX(customer_name), 
    MAX(customer_phone), 
    MAX(customer_cpf), 
    MAX(created_at), 
    COUNT(id), 
    SUM(total)
FROM public.orders
WHERE payment_status = 'paid' AND customer_email IS NOT NULL
GROUP BY customer_email
ON CONFLICT (email) DO NOTHING;

SELECT 'CONSOLIDAÇÃO AI-READY REALIZADA COM SUCESSO!' as status;
