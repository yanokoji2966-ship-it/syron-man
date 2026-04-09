-- SYRON Man - SCRIPT DE CONFIGURAÃ‡ÃƒO DE ADMINISTRADORES
-- Tabela para gerenciar administradores dinamicamente
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 1. Qualquer pessoa (pÃºblico) pode VER quem Ã© admin 
-- (NecessÃ¡rio para o frontend verificar se o usuÃ¡rio logado Ã© admin)
DROP POLICY IF EXISTS "Public can view admin list" ON admin_users;
CREATE POLICY "Public can view admin list" ON admin_users FOR SELECT USING (true);

-- 2. APENAS o Super Administrador (otacilio2966@gmail.com) pode gerenciar a tabela
DROP POLICY IF EXISTS "Super Admin can manage admins" ON admin_users;
CREATE POLICY "Super Admin can manage admins" ON admin_users FOR ALL USING (
    auth.jwt()->>'email' = 'otacilio2966@gmail.com'
);

-- Inserir o Super Administrador inicial
INSERT INTO admin_users (email) 
VALUES ('otacilio2966@gmail.com')
ON CONFLICT (email) DO NOTHING;
