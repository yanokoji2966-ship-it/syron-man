-- SYRON Man - Tabela de Cupons de Desconto
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    min_purchase_value DECIMAL(10,2) DEFAULT 0.00,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna de cupom aplicado no pedido
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00;

-- FunÃ§Ã£o para incrementar uso do cupom com seguranÃ§a (RPC)
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE coupons
    SET usage_count = usage_count + 1
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;
