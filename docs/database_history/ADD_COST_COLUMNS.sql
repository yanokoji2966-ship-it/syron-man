-- SYRON Man - Adicionar colunas de custo para gestÃ£o de lucro (Business Intelligence)

-- 1. PreÃ§o de custo no produto (valor atual)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00;

-- 2. Custo unitÃ¡rio no item do pedido (valor histÃ³rico no momento da venda)
-- Isso garante que se o custo do produto mudar no futuro, o lucro dos pedidos passados continue correto.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0.00;
