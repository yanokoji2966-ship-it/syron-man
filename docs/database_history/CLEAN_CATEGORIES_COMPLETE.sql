-- Script de Limpeza Completa de Categorias Duplicadas e Bugadas
-- Rode isso no SQL Editor do Supabase para limpar "CalÃ§as", "CalÃ§ados", etc.

-- 1. Transferir produtos que foram salvos nas categorias erradas para as categorias CERTAS
UPDATE products 
SET category_id = '6d6affae-b8b6-46f4-bd45-8325b4257192', category_name = 'Calças'
WHERE category_id IN (
    SELECT id FROM categories WHERE name LIKE '%CalÃ§as%'
);

UPDATE products 
SET category_id = 'a51767b5-0781-40d3-be18-d901aae314f5', category_name = 'Calçados'
WHERE category_id IN (
    SELECT id FROM categories WHERE name LIKE '%CalÃ§ados%'
);

UPDATE products 
SET category_id = '6de5b157-4e9b-430e-841e-8e01eaac4f9e', category_name = 'Relógios'
WHERE category_id IN (
    SELECT id FROM categories WHERE name LIKE '%RelÃ³gios%'
);

-- 2. Deletar as categorias duplicadas com os nomes quebrados que foram criadas no dia 28/02
DELETE FROM categories 
WHERE created_at >= '2026-02-28 00:00:00';

SELECT 'Categorias duplicadas removidas com sucesso e produtos corrigidos!' as status;
