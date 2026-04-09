-- SYRON Man - CORREÃ‡ÃƒO COMPLETA DE PERMISSÃ•ES PARA ADMINISTRADORES
-- Rode este script no SQL Editor do Supabase para liberar todas as funÃ§Ãµes do painel admin

-- 1. TABELA DE PEDIDOS (ORDERS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Limpar polÃ­ticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public insert access" ON orders;
DROP POLICY IF EXISTS "Allow select for authenticated" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;

-- Permitir que QUALQUER UM crie pedidos (necessÃ¡rio para o checkout de visitantes)
CREATE POLICY "Public insert access" ON orders FOR INSERT WITH CHECK (true);

-- Permitir que ADMINS (usuÃ¡rios logados) gerenciem TUDO nos pedidos
CREATE POLICY "Admins can manage orders" ON orders 
FOR ALL TO authenticated USING (true);


-- 2. TABELA DE ITENS DO PEDIDO (ORDER_ITEMS)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert access items" ON order_items;
DROP POLICY IF EXISTS "Allow select items for authenticated" ON order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;

-- Permitir que QUALQUER UM insira itens (necessÃ¡rio para o checkout)
CREATE POLICY "Public insert access items" ON order_items FOR INSERT WITH CHECK (true);

-- Permitir que ADMINS gerenciem TUDO nos itens
CREATE POLICY "Admins can manage order items" ON order_items 
FOR ALL TO authenticated USING (true);


-- 3. TABELA DE CONFIGURAÃ‡Ã•ES (SETTINGS)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;

-- Qualquer um pode ver (ex: link de pagamento no checkout)
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);

-- Admins podem gerenciar tudo
CREATE POLICY "Admins can manage settings" ON settings 
FOR ALL TO authenticated USING (true);


-- 4. TABELA DE PRODUTOS E CATEGORIAS (GARANTIA)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Produtos sÃ£o pÃºblicos" ON products;
DROP POLICY IF EXISTS "Admins gerenciam produtos" ON products;
CREATE POLICY "Produtos sÃ£o pÃºblicos" ON products FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam produtos" ON products FOR ALL TO authenticated USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categorias sÃ£o pÃºblicas" ON categories;
DROP POLICY IF EXISTS "Admins gerenciam categorias" ON categories;
CREATE POLICY "Categorias sÃ£o pÃºblicas" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam categorias" ON categories FOR ALL TO authenticated USING (true);

-- CONFIRMAÃ‡ÃƒO DE SUCESSO
SELECT 'PermissÃµes Admin configuradas com sucesso! Agora vocÃª pode atualizar status e produtos.' as status;
