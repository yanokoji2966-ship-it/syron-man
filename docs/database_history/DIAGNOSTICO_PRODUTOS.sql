-- SYRON Man - DIAGNÓSTICO DE VISIBILIDADE DE PRODUTOS
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/_/sql)

-- 1. Garante que qualquer pessoa possa ver os produtos, independente de estarem ativos (Para teste)
DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);

-- 2. Ativa todos os produtos cadastrados agora
UPDATE products SET is_active = true WHERE is_active IS NOT true;

-- 3. Verifica quantos produtos existem no total para termos certeza que gravou
SELECT count(*) as total_produtos FROM products;

-- 4. Mostra o nome e o status dos últimos produtos adicionados
SELECT name, is_active, created_at FROM products 
ORDER BY created_at DESC 
LIMIT 5;
