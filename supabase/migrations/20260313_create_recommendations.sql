-- Migration: Product Recommendations
-- Date: 2026-03-13

-- 1. Create product_recommendations table
CREATE TABLE IF NOT EXISTS product_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    recommended_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    score FLOAT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, recommended_product_id)
);

-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_recommendations_product_id ON product_recommendations(product_id);

-- 3. Enable RLS
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Public read access
DROP POLICY IF EXISTS "Public Read Recommendations" ON product_recommendations;
CREATE POLICY "Public Read Recommendations" ON product_recommendations FOR SELECT USING (true);

-- 5. Helper Function for Frequency Analysis (SQL logic for the service)
/*
Esta query serve de base para o serviço Node.js.
Ela identifica pares de produtos comprados no mesmo pedido.
*/
CREATE OR REPLACE VIEW v_product_purchase_pairs AS
SELECT 
    a.product_id as product_a, 
    b.product_id as product_b,
    count(*) as frequency
FROM order_items a
JOIN order_items b ON a.order_id = b.order_id AND a.product_id != b.product_id
GROUP BY a.product_id, b.product_id;
