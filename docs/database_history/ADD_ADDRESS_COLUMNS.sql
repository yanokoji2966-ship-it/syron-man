-- SYRON Man - SQL para adicionar colunas de endereÃ§o Ã  tabela orders
-- Execute este script no SQL Editor do Supabase

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_zipcode VARCHAR(10),
ADD COLUMN IF NOT EXISTS customer_street VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS customer_neighborhood VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_state VARCHAR(2),
ADD COLUMN IF NOT EXISTS customer_complement VARCHAR(255);

-- Opcional: Adicionar comentÃ¡rio para documentaÃ§Ã£o
COMMENT ON COLUMN orders.customer_zipcode IS 'CEP do cliente';
COMMENT ON COLUMN orders.customer_street IS 'Rua/Avenida';
COMMENT ON COLUMN orders.customer_number IS 'NÃºmero da residÃªncia';
COMMENT ON COLUMN orders.customer_neighborhood IS 'Bairro';
COMMENT ON COLUMN orders.customer_city IS 'Cidade';
COMMENT ON COLUMN orders.customer_state IS 'Estado (UF)';
COMMENT ON COLUMN orders.customer_complement IS 'Complemento do endereÃ§o';
