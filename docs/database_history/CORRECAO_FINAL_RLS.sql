-- SYRON Man - SCRIPT DE CORREÃ‡ÃƒO DEFINITIVA DE PERMISSÃ•ES
-- Rode este script INTEIRO no SQL Editor do Supabase para corrigir o erro "policy already exists" e liberar os pedidos.

-- 1. ORDERS (PEDIDOS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Remove TODAS as polÃ­ticas de inserÃ§Ã£o possÃ­veis para evitar conflito
DROP POLICY IF EXISTS "Public insert access" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON orders;

-- Cria a polÃ­tica correta
CREATE POLICY "Public insert access" ON orders FOR INSERT WITH CHECK (true);


-- 2. ORDER ITEMS (ITENS DO PEDIDO)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Remove TODAS as polÃ­ticas de inserÃ§Ã£o possÃ­veis
DROP POLICY IF EXISTS "Public insert access items" ON order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;

-- Cria a polÃ­tica correta
CREATE POLICY "Public insert access items" ON order_items FOR INSERT WITH CHECK (true);


-- 3. SETTINGS (CONFIGURAÃ‡Ã•ES)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Remove TODAS as polÃ­ticas de leitura possÃ­veis
DROP POLICY IF EXISTS "Public read settings" ON settings;
DROP POLICY IF EXISTS "Anyone can read settings" ON settings;

-- Cria a polÃ­tica correta
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);

-- ConfirmaÃ§Ã£o
SELECT 'PermissÃµes corrigidas com sucesso!' as status;
