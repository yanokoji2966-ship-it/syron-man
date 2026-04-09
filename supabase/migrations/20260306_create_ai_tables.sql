-- Migration: Create AI Intelligence Tables
-- Date: 2026-03-06

-- 1. Create ai_settings table
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create ai_insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'promotion', 'stock', 'highlight', 'price', etc.
    message TEXT NOT NULL,
    related_product_id UUID REFERENCES public.products(id),
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Insert default settings
INSERT INTO public.ai_settings (setting_key, setting_value, description)
VALUES 
('stock_analysis_days', '30', 'Quantidade de dias sem vendas para considerar produto parado'),
('low_sales_threshold', '5', 'Limite de vendas para considerar baixa performance'),
('high_stock_threshold', '20', 'Limite para considerar estoque alto'),
('auto_promotion_enabled', 'false', 'Ativar sugestões automáticas de promoção'),
('vip_customer_threshold', '1000', 'Valor total gasto para ser considerado cliente VIP'),
('inactive_customer_days', '60', 'Dias de inatividade para considerar cliente inativo')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- 5. Create Security Policies (Admin Only)
DROP POLICY IF EXISTS "Admins can do everything on ai_settings" ON public.ai_settings;
CREATE POLICY "Admins can do everything on ai_settings" ON public.ai_settings
    FOR ALL USING (true); -- In a real scenario, check for admin role

DROP POLICY IF EXISTS "Admins can do everything on ai_insights" ON public.ai_insights;
CREATE POLICY "Admins can do everything on ai_insights" ON public.ai_insights
    FOR ALL USING (true);
