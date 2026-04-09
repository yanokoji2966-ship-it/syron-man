-- FIX ORDER ITEMS SCHEMA
-- Adiciona a coluna 'size' que estava faltando e garante que as colunas batam com o SERVICE

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(20);

-- Se por acaso o usuÃ¡rio criou a tabela com 'price' em vez de 'unit_price', renomeamos para padronizar
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='price') THEN
        ALTER TABLE order_items RENAME COLUMN price TO unit_price;
    END IF;
END $$;
