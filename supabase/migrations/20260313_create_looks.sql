-- Migration: Style Advisor (Looks)
-- Date: 2026-03-13

-- 1. Create style_looks table
CREATE TABLE IF NOT EXISTS style_looks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_ids UUID[] DEFAULT '{}',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE style_looks ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Public read access for active looks
DROP POLICY IF EXISTS "Public Read Active Looks" ON style_looks;
CREATE POLICY "Public Read Active Looks" ON style_looks FOR SELECT USING (is_active = true);

-- Admin full access
DROP POLICY IF EXISTS "Admin Full Access Style Looks" ON style_looks;
CREATE POLICY "Admin Full Access Style Looks" ON style_looks 
FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));

-- 4. Trigger for updated_at
DROP TRIGGER IF EXISTS update_style_looks_updated_at ON style_looks;
CREATE TRIGGER update_style_looks_updated_at BEFORE UPDATE ON style_looks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
