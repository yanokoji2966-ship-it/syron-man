-- SYRON Man - CORREÇÃO: Admin ver todos os pedidos
-- Execute este script no SQL Editor do Supabase (painel online)
-- PROBLEMA: A política RLS atual só deixa cada usuário ver seus próprios pedidos.
-- SOLUÇÃO: Adicionar política que permite admin ler todos os pedidos.

-- 1. Política para admin ver TODOS os pedidos
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE email = auth.jwt() ->> 'email'
    )
);

-- 2. Política para admin atualizar qualquer pedido
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE email = auth.jwt() ->> 'email'
    )
);

-- 3. Política para admin DELETAR qualquer pedido
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders" ON orders
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE email = auth.jwt() ->> 'email'
    )
);

-- 4. Política para admin ver order_items de qualquer pedido
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE email = auth.jwt() ->> 'email'
    )
);

-- 5. Política para admin deletar order_items
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;
CREATE POLICY "Admins can delete order items" ON order_items
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE email = auth.jwt() ->> 'email'
    )
);

SELECT 'Políticas de admin para pedidos aplicadas com sucesso!' AS status;
