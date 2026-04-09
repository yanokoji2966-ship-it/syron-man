-- SYRON Man - SISTEMA DE LIMITE DE VENDAS CONTROLADO
-- Este script adiciona os campos necessários e as automações para limitar vendas por produto.

-- 1. ADICIONAR COLUNAS À TABELA DE PRODUTOS
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sales_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS limit_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;

-- 2. FUNÇÃO ATUALIZADA PARA DIMINUIR ESTOQUE E CONTROLAR LIMITE DE VENDAS
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    v_product_name TEXT;
    v_sales_limit INTEGER;
    v_limit_enabled BOOLEAN;
    v_total_sales INTEGER;
BEGIN
    -- Só processa se o produto existir
    IF NEW.product_id IS NOT NULL THEN
        -- Busca informações atuais do produto
        SELECT name, sales_limit, limit_enabled, total_sales 
        INTO v_product_name, v_sales_limit, v_limit_enabled, v_total_sales
        FROM products 
        WHERE id = NEW.product_id;

        -- Verifica se o limite está habilitado e se foi atingido
        IF v_limit_enabled AND (v_total_sales + NEW.quantity) > v_sales_limit THEN
            RAISE EXCEPTION 'Limite de vendas atingido para o produto "%" (Disponível: %, Tentativa: %)', 
                v_product_name, (v_sales_limit - v_total_sales), NEW.quantity;
        END IF;

        -- Deduz o estoque físico
        UPDATE products
        SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
            total_sales = total_sales + NEW.quantity
        WHERE id = NEW.product_id;

        RAISE NOTICE 'Estoque deduzido e Vendas incrementadas: % unidades do produto %', NEW.quantity, NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNÇÃO ATUALIZADA PARA RESTAURAR ESTOQUE E VENDAS AO CANCELAR PEDIDO
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'cancelled' (cancelado)
    IF (NEW.order_status = 'cancelled' OR NEW.payment_status = 'cancelled') AND 
       (OLD.order_status IS DISTINCT FROM 'cancelled' AND OLD.payment_status IS DISTINCT FROM 'cancelled') THEN
        
        -- Restaura estoque e decrementa vendas totais
        UPDATE products p
        SET stock_quantity = p.stock_quantity + oi.quantity,
            total_sales = GREATEST(0, p.total_sales - oi.quantity)
        FROM order_items oi
        WHERE oi.order_id = NEW.id
        AND p.id = oi.product_id;
        
        RAISE NOTICE 'Estoque e Limite de Vendas restaurados para o pedido % (Status: Cancelado)', NEW.order_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO ATUALIZADA PARA RESTAURAR ESTOQUE E VENDAS AO DELETAR UM ITEM
CREATE OR REPLACE FUNCTION restore_stock_on_item_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o item for deletado, devolve para o estoque e decrementa vendas totais
    IF OLD.product_id IS NOT NULL THEN
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity,
            total_sales = GREATEST(0, total_sales - OLD.quantity)
        WHERE id = OLD.product_id;
        
        RAISE NOTICE 'Estoque e Limite de Vendas devolvidos: % unidades do produto ID %', OLD.quantity, OLD.product_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 5. RPC PARA DECREMENTAR ESTOQUE MANUALMENTE (Caso o front use RPC diretamente)
CREATE OR REPLACE FUNCTION decrement_product_stock_v2(p_product_id UUID, p_qty INTEGER)
RETURNS void AS $$
DECLARE
    v_sales_limit INTEGER;
    v_limit_enabled BOOLEAN;
    v_total_sales INTEGER;
BEGIN
    SELECT sales_limit, limit_enabled, total_sales 
    INTO v_sales_limit, v_limit_enabled, v_total_sales
    FROM products 
    WHERE id = p_product_id;

    IF v_limit_enabled AND (v_total_sales + p_qty) > v_sales_limit THEN
        RAISE EXCEPTION 'Limite de vendas atingido.';
    END IF;

    UPDATE products
    SET stock_quantity = GREATEST(0, stock_quantity - p_qty),
        total_sales = total_sales + p_qty
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
