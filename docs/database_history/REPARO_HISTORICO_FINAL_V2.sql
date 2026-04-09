-- SYRON Man - REPARO TOTAL E DEFINITIVO DO HISTÓRICO
-- Garante que o histórico apareça mesmo se houver erro de maiúsculas/minúsculas no e-mail

-- 1. NORMALIZAR TODOS OS E-MAILS EXISTENTES (Passo Proativo)
UPDATE orders SET customer_email = LOWER(customer_email) WHERE customer_email IS NOT NULL;

-- 2. GARANTIR ÍNDICES CASE-INSENSITIVE
DROP INDEX IF EXISTS idx_orders_customer_email_lower;
CREATE INDEX idx_orders_customer_email_lower ON orders (LOWER(customer_email));

-- 3. POLÍTICA DE SEGURANÇA BLINDADA (RLS)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
FOR SELECT USING (
    auth.uid() = user_id 
    OR (LOWER(customer_email) = LOWER(auth.jwt() ->> 'email'))
    OR (user_id IS NULL) -- Permite ver o pedido recém-feito antes de logar
);

-- 4. VINCULAR ITENS AOS PEDIDOS VISÍVEIS
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
CREATE POLICY "Users can view order items" ON order_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id
    )
);

-- Feedback
SELECT 'SUCESSO: E-mails normalizados e políticas de histórico aplicadas!' as status;
