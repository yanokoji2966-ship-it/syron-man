-- SYRON Man - MIGRRAÃ‡ÃƒO PARA ESTRUTURA "PREPARADA PARA IA" (AI-READY)
-- Este script implementa os requisitos de infraestrutura e dados detalhados no "documento pra o futuro.txt"

-- 1. EXPANSÃƒO DA TABELA DE PRODUTOS
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS total_sold INTEGER DEFAULT 0;

-- 2. EXPANSÃƒO DA TABELA DE PEDIDOS
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS estimated_profit DECIMAL(10, 2) DEFAULT 0.00;

-- 3. CRIAÃ‡ÃƒO DA TABELA DE CLIENTES (CENTRALIZADA)
CREATE TABLE IF NOT EXISTS customers (
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

-- 4. TABELAS DE HISTÃ“RICO E LOGS
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    old_cost DECIMAL(10, 2),
    new_cost DECIMAL(10, 2),
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    change_amount INTEGER,
    reason TEXT, -- 'venda', 'cancelamento', 'ajuste_manual'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id),
    action VARCHAR(100),
    table_name VARCHAR(100),
    record_id UUID,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. AUTOMAÃ‡Ã•ES (GATILHOS / FUNCTIONS)

-- A. Atualizar Lucro Estimado no Pedido
CREATE OR REPLACE FUNCTION calculate_order_profit()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET estimated_profit = (
        SELECT COALESCE(SUM((unit_price - unit_cost) * quantity), 0)
        FROM order_items
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_calculate_order_profit ON order_items;
CREATE TRIGGER tr_calculate_order_profit
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION calculate_order_profit();


-- B. Sincronizar Dados do Cliente e Total de Vendas do Produto ao Aprovar Pagamento
CREATE OR REPLACE FUNCTION handle_payment_approval()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Se o status mudou para 'paid' (pago)
    IF (NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid')) THEN
        
        -- 1. Atualizar Metrics do Produto (total_sold)
        FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            UPDATE products 
            SET total_sold = total_sold + item.quantity 
            WHERE id = item.product_id;
        END LOOP;

        -- 2. Upsert na tabela de Customers
        INSERT INTO customers (email, name, phone, cpf, last_purchase_at, total_orders, total_spent)
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

        -- 3. Registrar no HistÃ³rico de Status
        INSERT INTO order_status_history (order_id, old_status, new_status, created_at)
        VALUES (NEW.id, OLD.order_status, NEW.order_status, NOW());

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_handle_payment_approval ON orders;
CREATE TRIGGER tr_handle_payment_approval
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION handle_payment_approval();


-- C. Log de AlteraÃ§Ã£o de PreÃ§o
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.price IS DISTINCT FROM NEW.price OR OLD.cost_price IS DISTINCT FROM NEW.cost_price) THEN
        INSERT INTO price_history (product_id, old_price, new_price, old_cost, new_cost, created_at)
        VALUES (NEW.id, OLD.price, NEW.price, OLD.cost_price, NEW.cost_price, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_log_price_change ON products;
CREATE TRIGGER tr_log_price_change
AFTER UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION log_price_change();


-- 6. PERMISSÃ•ES RLS PARA AS NOVAS TABELAS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo, pÃºblico nÃ£o vÃª logs
CREATE POLICY "Admins manage customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins view history" ON order_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins view price history" ON price_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins view stock history" ON stock_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins view logs" ON admin_logs FOR ALL TO authenticated USING (true);

-- CONFIRMAÃ‡ÃƒO
SELECT 'Estrutura Preparada para IA (AI-Ready) configurada com sucesso!' as status;
