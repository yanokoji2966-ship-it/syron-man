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
