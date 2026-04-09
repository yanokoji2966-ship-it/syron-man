-- SYRON Man - Adicionar contador de visualizaÃ§Ãµes
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- FunÃ§Ã£o RPC para incrementar visualizaÃ§Ãµes com seguranÃ§a
CREATE OR REPLACE FUNCTION increment_product_view(product_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET view_count = view_count + 1
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
