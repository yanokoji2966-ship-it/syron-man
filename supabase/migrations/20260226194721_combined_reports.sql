-- SYRON Man - CONFIGURAÇÃO DE SUPER ADMIN E REPORTS
-- Este script garante que o usuário principal tenha permissões totais e rastreamento de views.

-- 1. USUÁRIO ADMIN
INSERT INTO admin_users (email, role)
VALUES ('otacilio2966@gmail.com', 'super_admin')
ON CONFLICT (email) DO UPDATE SET role = 'super_admin';

-- 2. ATUALIZAR POLÍTICAS DE RLS PARA ADMINS
-- Polícita Genérica para Admins (Leitura/Escrita total)
DROP POLICY IF EXISTS "Admins have full access" ON products;
CREATE POLICY "Admins have full access" ON products
FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Admins have full access" ON orders;
CREATE POLICY "Admins have full access" ON orders
FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Admins have full access" ON order_items;
CREATE POLICY "Admins have full access" ON order_items
FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
);

-- 3. TRACKING DE VISUALIZAÇÕES
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_product_view(product_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET view_count = view_count + 1
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
