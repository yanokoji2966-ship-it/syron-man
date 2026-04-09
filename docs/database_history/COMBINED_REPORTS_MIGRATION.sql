-- SYRON Man - CONFIGURAÃ‡ÃƒO DE SUPER ADMIN
-- Este script garante que o usuÃ¡rio principal tenha permissÃµes totais no sistema.

-- 1. GARANTIR QUE A TABELA DE ADMINS EXISTE
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GARANTIR QUE A COLUNA ROLE EXISTE (Caso a tabela jÃ¡ existisse sem ela)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- 2. CADASTRAR OTACÃLIO COMO SUPER ADMIN
-- Nota: O e-mail deve ser o mesmo do login no Supabase Auth
INSERT INTO admin_users (email, role)
VALUES ('otacilio2966@gmail.com', 'super_admin')
ON CONFLICT (email) DO UPDATE SET role = 'super_admin';

-- 3. ATUALIZAR POLÃTICAS DE RLS PARA ADMINS
-- Permite que qualquer usuÃ¡rio autenticado que esteja na tabela admin_users veja e gerencie tudo
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica GenÃ©rica para Admins (Leitura/Escrita total)
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

DROP POLICY IF EXISTS "Admins have full access" ON customers;
CREATE POLICY "Admins have full access" ON customers
FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
);
-- SYRON Man - TRACKING DE VISUALIZAÃ‡Ã•ES E IA-READY
-- Este script adiciona a infraestrutura para rastrear o engajamento de produtos.

-- 1. ADICIONAR COLUNA DE VISUALIZAÃ‡Ã•ES
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. CRIAR FUNÃ‡ÃƒO RPC PARA INCREMENTO SEGURO
-- Isso evita problemas de concorrÃªncia e RLS ao atualizar apenas um contador
CREATE OR REPLACE FUNCTION increment_product_view(product_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET view_count = view_count + 1
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GARANTIR QUE A COLUNA COST_PRICE EXISTE PARA O DRE
-- (Caso nÃ£o tenha sido adicionada em migraÃ§Ãµes anteriores)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- 4. COMENTÃRIO PARA O NEXUS
COMMENT ON COLUMN products.view_count IS 'NÃºmero de vezes que o produto foi visualizado por clientes interessados.';
