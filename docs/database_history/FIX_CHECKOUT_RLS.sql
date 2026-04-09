-- SYRON Man - CORREÇÃO CRÍTICA DE CHECKOUT (RLS)
-- Este script libera a criação e leitura de pedidos para visitantes (anon).
-- Sem isso, o checkout trava ao tentar obter o ID do pedido gerado.

-- 1. TABELA ORDERS (PEDIDOS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Remove políticas que podem conflitar
DROP POLICY IF EXISTS "Public insert access" ON orders;
DROP POLICY IF EXISTS "Public create orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Allow select for all" ON orders;
DROP POLICY IF EXISTS "Public select access" ON orders;

-- Permite que QUALQUER UM (visitante ou logado) crie um pedido
CREATE POLICY "Public insert access" ON orders 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

-- Permite que QUALQUER UM veja os pedidos (necessário para o checkout-flow .select().single())
CREATE POLICY "Public select access" ON orders 
FOR SELECT TO anon, authenticated 
USING (true);


-- 2. TABELA ORDER_ITEMS (ITENS DO PEDIDO)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS "Public insert access items" ON order_items;
DROP POLICY IF EXISTS "Public create order items" ON order_items;
DROP POLICY IF EXISTS "Public select items access" ON order_items;

-- Permite criar itens (visitantes e logados)
CREATE POLICY "Public insert access items" ON order_items 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

-- Permite ver itens
CREATE POLICY "Public select items access" ON order_items 
FOR SELECT TO anon, authenticated 
USING (true);


-- 3. GARANTIR ACESSO ADMIN (Backup de Segurança)
-- Se já houver políticas de admin, elas continuam valendo, mas como usamos 'USING (true)' acima para SELECT, 
-- o admin já conseguirá ver tudo. 

-- 4. SETTINGS (CONFIGURAÇÕES)
-- Garante que todos possam ler as configurações (ex: preço do frete, chaves, etc)
DROP POLICY IF EXISTS "Public read settings" ON settings;
CREATE POLICY "Public read settings" ON settings FOR SELECT TO anon, authenticated USING (true);

-- CONFIRMAÇÃO
SELECT 'Checkout liberado com sucesso!' as status;
