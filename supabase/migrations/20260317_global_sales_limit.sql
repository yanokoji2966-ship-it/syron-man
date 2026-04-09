-- SYRON Man - SISTEMA DE LIMITE DE VENDAS GLOBAL
-- Este script adiciona as chaves de configuração globais e atualiza os gatilhos para monitorar vendas em todo o site.

-- 1. INICIALIZAR CONFIGURAÇÕES GLOBAIS NA TABELA SETTINGS
-- Usamos 'maybe insert' para não sobrescrever caso já existam
INSERT INTO settings (key, value, active, description)
VALUES 
    ('global_sales_limit_enabled', 'false', true, 'Ativar/Desativar limite de vendas global de todo o site'),
    ('global_sales_limit_value', '0', true, 'Número máximo de vendas permitidas no site'),
    ('global_sales_count', '0', true, 'Contador atual de vendas globais processadas')
ON CONFLICT (key) DO NOTHING;

-- 2. ATUALIZAR FUNÇÃO DE DEDUÇÃO DE ESTOQUE COM CHECAGEM GLOBAL
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    v_product_name TEXT;
    v_sales_limit INTEGER;
    v_limit_enabled BOOLEAN;
    v_total_sales INTEGER;
    
    -- Variáveis Globais
    v_global_enabled_str TEXT;
    v_global_limit_str TEXT;
    v_global_count_str TEXT;
    v_global_enabled BOOLEAN;
    v_global_limit INTEGER;
    v_global_count INTEGER;
BEGIN
    -- --- CHECAGEM DE LIMITE GLOBAL ---
    SELECT value INTO v_global_enabled_str FROM settings WHERE key = 'global_sales_limit_enabled';
    SELECT value INTO v_global_limit_str FROM settings WHERE key = 'global_sales_limit_value';
    SELECT value INTO v_global_count_str FROM settings WHERE key = 'global_sales_count';
    
    v_global_enabled := (v_global_enabled_str = 'true');
    v_global_limit := COALESCE(NULLIF(v_global_limit_str, '')::INTEGER, 0);
    v_global_count := COALESCE(NULLIF(v_global_count_str, '')::INTEGER, 0);

    IF v_global_enabled AND (v_global_count + NEW.quantity) > v_global_limit THEN
        RAISE EXCEPTION 'LIMITE GLOBAL ATINGIDO: O site atingiu o volume máximo de vendas permitidas. (Restante: %, Tentativa: %)', 
            (v_global_limit - v_global_count), NEW.quantity;
    END IF;

    -- --- CHECAGEM POR PRODUTO (Existente) ---
    IF NEW.product_id IS NOT NULL THEN
        SELECT name, sales_limit, limit_enabled, total_sales 
        INTO v_product_name, v_sales_limit, v_limit_enabled, v_total_sales
        FROM products 
        WHERE id = NEW.product_id;

        IF v_limit_enabled AND (v_total_sales + NEW.quantity) > v_sales_limit THEN
            RAISE EXCEPTION 'LIMITE POR PRODUTO: Limite atingido para "%" (Diponível: %, Tentativa: %)', 
                v_product_name, (v_sales_limit - v_total_sales), NEW.quantity;
        END IF;

        -- Atualiza produto
        UPDATE products
        SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
            total_sales = total_sales + NEW.quantity
        WHERE id = NEW.product_id;

        -- Atualiza Contador Global
        UPDATE settings 
        SET value = (v_global_count + NEW.quantity)::TEXT 
        WHERE key = 'global_sales_count';

        RAISE NOTICE 'Venda realizada: % unidades do produto %. Contador global atualizado.', NEW.quantity, NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. AJUSTAR FUNÇÃO DE RESTAURAÇÃO (AO CANCELAR)
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
    v_total_restored INTEGER := 0;
BEGIN
    IF (NEW.order_status = 'cancelled' OR NEW.payment_status = 'cancelled') AND 
       (OLD.order_status IS DISTINCT FROM 'cancelled' AND OLD.payment_status IS DISTINCT FROM 'cancelled') THEN
        
        -- Soma as quantidades para o global
        SELECT SUM(quantity) INTO v_total_restored FROM order_items WHERE order_id = NEW.id;

        -- Restaura estoque e decrementa vendas totais por produto
        UPDATE products p
        SET stock_quantity = p.stock_quantity + oi.quantity,
            total_sales = GREATEST(0, p.total_sales - oi.quantity)
        FROM order_items oi
        WHERE oi.order_id = NEW.id
        AND p.id = oi.product_id;
        
        -- Restaura o contador global
        UPDATE settings 
        SET value = GREATEST(0, (COALESCE(NULLIF(value, '')::INTEGER, 0) - v_total_restored))::TEXT 
        WHERE key = 'global_sales_count';

        RAISE NOTICE 'Estoque e Contadores Globais restaurados para o pedido %.', NEW.order_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. AJUSTAR FUNÇÃO DE RESTAURAÇÃO (AO DELETAR ITEM)
CREATE OR REPLACE FUNCTION restore_stock_on_item_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.product_id IS NOT NULL THEN
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity,
            total_sales = GREATEST(0, total_sales - OLD.quantity)
        WHERE id = OLD.product_id;
        
        -- Restaura o contador global
        UPDATE settings 
        SET value = GREATEST(0, (COALESCE(NULLIF(value, '')::INTEGER, 0) - OLD.quantity))::TEXT 
        WHERE key = 'global_sales_count';
        
        RAISE NOTICE 'Estoque e Contador Global devolvidos para item deletado.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
