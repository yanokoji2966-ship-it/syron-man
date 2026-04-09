-- SYRON Man - Adicionar coluna de CPF para pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_cpf TEXT;
