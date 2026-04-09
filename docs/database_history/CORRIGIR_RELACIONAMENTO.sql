-- SYRON Man - SCRIPT DE CORREÃ‡ÃƒO DE RELACIONAMENTO E VERIFICAÃ‡ÃƒO
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que a tabela order_items tem o vÃ­nculo correto com orders
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id)
ON DELETE CASCADE;

-- 2. Recarregar o cache do schema (comentÃ¡rio inÃ³cuo forÃ§a o reload)
COMMENT ON TABLE orders IS 'Pedidos da loja (Schema Reloaded)';

-- 3. VERIFICAÃ‡ÃƒO DE DADOS (O resultado aparecerÃ¡ na aba "Results" abaixo)
SELECT 
    (SELECT count(*) FROM orders) as total_pedidos,
    (SELECT count(*) FROM order_items) as total_itens,
    (SELECT count(*) FROM orders WHERE user_id IS NULL) as pedidos_sem_usuario;

-- Se "total_pedidos" for 0, entÃ£o realmente nÃ£o hÃ¡ vendas registradas no banco.
