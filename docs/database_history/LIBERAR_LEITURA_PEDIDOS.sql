-- SYRON Man - SCRIPT PARA LIBERAR LEITURA DE PEDIDOS E ITENS
-- Rode isto no SQL Editor do Supabase para garantir que o painel admin mostre os dados

-- 1. ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Remover polÃ­ticas antigas de leitura
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Allow select for authenticated" ON orders;
DROP POLICY IF EXISTS "Public select access" ON orders;

-- Criar polÃ­tica que permite AUTHENTICATED users (logados) verem TODOS os pedidos
-- Isso simplifica para o Admin. Se precisar restringir depois, filtramos por user_id.
CREATE POLICY "Allow select for authenticated" ON orders
FOR SELECT
TO authenticated
USING (true);

-- 2. ORDER_ITEMS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Remover polÃ­ticas antigas
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
DROP POLICY IF EXISTS "Allow select items for authenticated" ON order_items;
DROP POLICY IF EXISTS "Public select items access" ON order_items;

-- Criar polÃ­tica de leitura irrestrita para itens (para quem estÃ¡ logado)
CREATE POLICY "Allow select items for authenticated" ON order_items
FOR SELECT
TO authenticated
USING (true);

SELECT 'Leitura liberada para usuÃ¡rios logados' as status;
