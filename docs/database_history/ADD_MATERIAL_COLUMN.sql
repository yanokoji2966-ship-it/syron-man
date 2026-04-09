-- SYRON Man - MIGRATION: ADICIONAR COLUNA MATERIAL
-- Execute este script no SQL Editor do Supabase se vocÃª jÃ¡ criou as tabelas anteriormente.

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS material VARCHAR(100);

COMMENT ON COLUMN products.material IS 'Tipo de material do produto (Ex: AlgodÃ£o, Linho, Seda)';
