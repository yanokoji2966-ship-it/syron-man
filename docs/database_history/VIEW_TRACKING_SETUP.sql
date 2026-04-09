-- SYRON Man - TRACKING DE VISUALIZAÃ‡Ã•ES E IA-READY
-- Este script adiciona a infraestrutura para rastrear o engajamento de produtos.

-- 1. ADICIONAR COLUNA DE VISUALIZAÃ‡Ã•ES
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. CRIAR FUNÃ‡ÃƒO RPC PARA INCREMENTO SEGURO
-- Isso evita problemas de concorrÃªncia e RLS ao atualizar apenas um contador
CREATE OR REPLACE FUNCTION increment_product_view(product_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET view_count = view_count + 1
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GARANTIR QUE A COLUNA COST_PRICE EXISTE PARA O DRE
-- (Caso nÃ£o tenha sido adicionada em migraÃ§Ãµes anteriores)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- 4. COMENTÃRIO PARA O NEXUS
COMMENT ON COLUMN products.view_count IS 'NÃºmero de vezes que o produto foi visualizado por clientes interessados.';
