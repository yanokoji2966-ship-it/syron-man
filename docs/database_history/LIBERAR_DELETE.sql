-- SYRON Man - SCRIPT PARA LIBERAR A EXCLUSÃƒO DE PEDIDOS
-- Rode este script no SQL Editor do Supabase

-- 1. Permite deletar o PEDIDO (se for dono)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
CREATE POLICY "Users can delete own orders" ON orders FOR DELETE USING (auth.uid() = user_id);

-- 2. Permite deletar os ITENS DO PEDIDO (necessÃ¡rio para apagar tudo)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete own items" ON order_items;
CREATE POLICY "Users can delete own items" ON order_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- ConfirmaÃ§Ã£o
SELECT 'PermissÃ£o de excluir liberada!' as status;
