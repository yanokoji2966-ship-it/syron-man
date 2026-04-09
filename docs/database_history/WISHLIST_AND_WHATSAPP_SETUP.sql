-- SYRON Man - FAVORITOS PERSISTENTES + WHATSAPP CONFIGURÁVEL
-- Execute no SQL Editor do Supabase

-- 1. Tabela de favoritos por usuário
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)  -- evita duplicatas
);

-- 2. RLS: cada usuário vê e edita apenas os próprios favoritos
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own wishlist" ON wishlists;
CREATE POLICY "Users manage own wishlist" ON wishlists
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Inserir número do WhatsApp nas configurações do sistema
INSERT INTO settings (key, value)
VALUES ('whatsapp_number', '5589981194628')
ON CONFLICT (key) DO NOTHING;

SELECT 'Wishlists e configurações aplicadas com sucesso!' AS status;
