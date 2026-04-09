-- SYRON Man - Ativa todos os produtos existentes para garantir visibilidade na loja
UPDATE products SET is_active = true WHERE is_active IS NOT true;

-- Garante que a coluna is_active tenha um valor padrÃ£o true para novos produtos
ALTER TABLE products ALTER COLUMN is_active SET DEFAULT true;
