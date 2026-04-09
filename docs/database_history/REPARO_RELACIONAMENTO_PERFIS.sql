-- SYRON Man - REPARO DE RELACIONAMENTOS (AVALIAÇÕES E PERFIS)
-- Corrige o erro de join entre product_reviews e profiles

-- 1. Garantir que a tabela profiles existe e está sincronizada
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sincronizar qualquer usuário que falte
INSERT INTO public.profiles (id, email, name)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', email) 
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Corrigir a tabela product_reviews
-- Se a coluna user_id existe, vamos garantir que ela aponte para public.profiles
DO $$ 
BEGIN
    -- Se a tabela existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_reviews') THEN
        
        -- Remove a constraint antiga se existir
        ALTER TABLE public.product_reviews DROP CONSTRAINT IF EXISTS product_reviews_user_id_fkey;
        
        -- Garante que a coluna user_id aponta para public.profiles(id)
        -- Isso permite que o PostgREST faça o join automático no frontend
        ALTER TABLE public.product_reviews 
        ADD CONSTRAINT product_reviews_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
    END IF;
END $$;

-- 3. Habilitar RLS em profiles (Segurança)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfis são públicos" ON public.profiles;
CREATE POLICY "Perfis são públicos" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários atualizam próprio perfil" ON public.profiles;
CREATE POLICY "Usuários atualizam próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Feedback
SELECT 'Relacionamento entre Avaliações e Perfis corrigido com sucesso!' as status;
