-- SYRON Man - Adicionar coluna de cÃ³digo de rastreamento Ã  tabela de pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;
