-- Migration: Add Tracking and Product Reviews (FIXED)
-- Date: 2026-03-13

-- 1. Update orders table with tracking fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS carrier VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50) DEFAULT 'processing',
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

-- 2. Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- 3. Enable RLS for product_reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- 4. Policies for product_reviews
-- Anyone can read reviews
DROP POLICY IF EXISTS "Public Read Reviews" ON product_reviews;
CREATE POLICY "Public Read Reviews" ON product_reviews FOR SELECT USING (true);

-- Authenticated users can create reviews
DROP POLICY IF EXISTS "Authed Create Reviews" ON product_reviews;
CREATE POLICY "Authed Create Reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users Delete Own Reviews" ON product_reviews;
CREATE POLICY "Users Delete Own Reviews" ON product_reviews FOR DELETE USING (auth.uid() = user_id);

-- 5. Helper function to check if user purchased a product
CREATE OR REPLACE FUNCTION has_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = p_user_id 
        AND oi.product_id = p_product_id
        AND o.order_status = 'entregue'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
