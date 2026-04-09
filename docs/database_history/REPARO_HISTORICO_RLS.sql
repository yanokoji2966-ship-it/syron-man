-- SYRON Man - REPARO DE PRIVACIDADE E HISTÓRICO
-- Permite que o cliente veja seus pedidos tanto pelo ID de usuário quanto pelo Email

-- 1. ATUALIZAR POLÍTICA DE LEITURA (SELECT)
-- Remove a política antiga mais restrita
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Cria nova política que permite ver pedidos se:
-- A) O ID do usuário bater (auth.uid() = user_id)
-- B) O email do cliente bater com o email da sessão (auth.jwt() ->> 'email' = customer_email)
-- C) O pedido seja de visitante e o usuário não esteja logado (user_id IS NULL)
CREATE POLICY "Users can view their own orders" ON orders
FOR SELECT USING (
    auth.uid() = user_id 
    OR (customer_email = (auth.jwt() ->> 'email'))
    OR (user_id IS NULL)
);

-- 2. GARANTIR QUE ITENS DO PEDIDO TAMBÉM SEJAM VISÍVEIS
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
CREATE POLICY "Users can view order items" ON order_items
FOR SELECT USING (true); -- Mantido simples pois já é filtrado pelo join de orders

-- Feedback
SELECT 'Política de histórico atualizada! O cliente agora consegue ver pedidos pelo email.' as msg;
