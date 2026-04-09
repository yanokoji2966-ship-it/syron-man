-- SYRON Man - CORREÃ‡ÃƒO DE PERMISSÃ•ES DE VISUALIZAÃ‡ÃƒO DE PEDIDOS
-- Execute este script no SQL Editor do Supabase

-- 1. Atualizar polÃ­tica da tabela ORDERS
-- Permite ver o pedido se o user_id for o seu OU se o email for o seu
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

CREATE POLICY "Users can view their own orders" ON orders
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (customer_email = auth.jwt()->>'email')
);

-- 2. Atualizar polÃ­tica da tabela ORDER_ITEMS
-- Permite ver os itens se vocÃª tiver permissÃ£o para ver o pedido correspondente
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view order items" ON order_items;

CREATE POLICY "Users can view order items" ON order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (
      orders.user_id = auth.uid() 
      OR 
      orders.customer_email = auth.jwt()->>'email'
    )
  )
);
