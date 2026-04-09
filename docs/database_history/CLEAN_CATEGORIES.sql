-- Script de Limpeza de Categorias Duplicadas
-- Este script limpará qualquer categoria gerada indevidamente com caracteres quebrados.

DELETE FROM categories 
WHERE id IN (
  '6fd94698-77cc-488c-8c4e-e31b9472fd0c',
  '72c91276-8867-40e8-bc29-ce8bc206ea55',
  '7989cb03-a1f0-4adc-ae27-bf1be9b9e0b4'
);

-- Como backup, apaga as categorias defeituosas pela data de quando deram erro
DELETE FROM categories WHERE created_at >= '2026-02-28 00:00:00';

SELECT 'Categorias duplicadas removidas com sucesso!' as status;
