-- SCRIPT DE RECUPERAÇÃO DE PRODUTOS - SYRON MAN
-- Este script resolve problemas de produtos que "desapareceram" devido a falhas de sincronização de categorias.

-- 1. Restaurar o ID da categoria baseado no nome (caso tenha ficado nulo)
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category_id IS NULL 
AND LOWER(p.category_name) = LOWER(c.name);

-- 2. Garantir que todos os produtos existentes estejam ativos
UPDATE products SET is_active = true WHERE is_active IS FALSE;

-- 3. Resetar configurações do painel Nexus (caso alguma seção tenha sido desabilitada por erro)
INSERT INTO settings (key, value, active)
VALUES ('nexus_sections', '{"showCategories":true,"showFeatured":true,"showBanner":true,"showPromotions":true,"showFreeShipping":true}', true)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Log do reparo
DO $$ 
BEGIN
    RAISE NOTICE 'Reparo concluído. Por favor, recarregue o site.';
END $$;
