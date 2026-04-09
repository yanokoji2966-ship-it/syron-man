-- SYRON MAN - SCRIPT DE REPARO MESTRE (IDEMPOTENTE)
-- Este script limpa e reconstrói as automações vitais para evitar erros de "already exists".

-- 1. LIMPEZA DE TRIGGERS ANTIGOS (Evita erros de duplicidade)
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS tr_update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS tr_update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
DROP TRIGGER IF EXISTS tr_update_settings_updated_at ON settings;
DROP TRIGGER IF EXISTS tr_decrement_stock ON order_items;
DROP TRIGGER IF EXISTS tr_decrement_stock_on_order ON order_items;
DROP TRIGGER IF EXISTS tr_restore_stock_on_cancel ON orders;
DROP TRIGGER IF EXISTS tr_restore_stock_on_delete ON order_items;
DROP TRIGGER IF EXISTS tr_reduce_stock_on_payment ON orders;
DROP TRIGGER IF EXISTS tr_log_product_price_change ON products;
DROP TRIGGER IF EXISTS tr_update_product_sales_count ON orders;
DROP TRIGGER IF EXISTS update_style_looks_updated_at ON style_looks;
DROP TRIGGER IF EXISTS tr_generate_category_slug ON categories;

-- 2. RECONSTRUÇÃO DA FUNÇÃO DE DATA (updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. RECONSTRUÇÃO DOS TRIGGERS BÁSICOS
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. CORREÇÃO DE RLS PARA CONFIGURAÇÕES (SETTINGS)
-- Libera leitura pública e permite que o sistema/admins atualizem
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON settings;
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin and System manage settings" ON settings;
-- Esta política permite que o sistema (mesmo via anon key) atualize as configs.
-- Em produção, o ideal é usar a SERVICE_ROLE_KEY para ignorar o RLS.
CREATE POLICY "Admin and System manage settings" ON settings 
FOR ALL USING (true) WITH CHECK (true);

DO $$ 
BEGIN
    RAISE NOTICE 'Reparo Mestre concluído com sucesso! Políticas de RLS atualizadas.';
END $$;
