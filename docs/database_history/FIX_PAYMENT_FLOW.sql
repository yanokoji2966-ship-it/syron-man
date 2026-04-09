-- MIGRATION: FIX ORDER PAYMENT COLUMNS AND POLITIES
-- Descrição: Adiciona colunas para Pix e link de pagamento, e libera visualização do pedido para o cliente.

-- 1. Adicionar colunas se não existirem
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_data JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_url TEXT;

-- 2. Corrigir políticas de RLS para permitir que o cliente veja seu próprio pedido (ou qualquer um se for anônimo via número)
-- NOTA: Atualmente simplificamos permitindo SELECT público pois a busca é por Order Number (UUID de fato)
DROP POLICY IF EXISTS "Public read access orders" ON orders;
CREATE POLICY "Public read access orders" ON orders FOR SELECT USING (true);

-- 3. Garantir política de INSERT
DROP POLICY IF EXISTS "Public create orders" ON orders;
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);

-- 4. Garantir política de UPDATE (necessária para saveOrderPaymentInfo)
DROP POLICY IF EXISTS "Public update orders" ON orders;
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);

-- 5. Garantir que logs de saúde (healthMonitor) funcionem
CREATE TABLE IF NOT EXISTS system_health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT,
    message TEXT,
    severity TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE system_health_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert health logs" ON system_health_logs;
CREATE POLICY "Public insert health logs" ON system_health_logs FOR INSERT WITH CHECK (true);
