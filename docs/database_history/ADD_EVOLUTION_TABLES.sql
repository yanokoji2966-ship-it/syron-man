-- TABELA DE ENDEREÇOS SALVOS
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zipcode TEXT NOT NULL,
    complement TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Usuário vê e edita apenas seus próprios endereços
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses" 
ON public.addresses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" 
ON public.addresses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
ON public.addresses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
ON public.addresses FOR DELETE 
USING (auth.uid() = user_id);

-- TABELA DE AVALIAÇÕES DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Qualquer um vê avaliações, apenas o dono edita/deleta
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" 
ON public.product_reviews FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert reviews" 
ON public.product_reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.product_reviews FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.product_reviews FOR DELETE 
USING (auth.uid() = user_id);

-- CONFIGURAÇÕES PARA O BANNER DE PROMOÇÃO
INSERT INTO public.settings (key, value) 
VALUES ('promo_banner_active', 'false')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.settings (key, value) 
VALUES ('promo_banner_text', '🔥 FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 299!')
ON CONFLICT (key) DO NOTHING;
