-- ==========================================================
-- SISTEMA DE ROLES (RBAC) - SYRON MAN
-- Migração de Autoridade Hard-coded para Autoridade em Banco
-- ==========================================================

-- 1. Garantir que a tabela admin_users tem a coluna role (caso não tenha)
-- Nota: A investigação mostrou que ela já existe, mas vamos garantir o tipo correto.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='role') THEN
        ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin';
    END IF;
END $$;

-- 2. Inserir ou Atualizar o Super Admin Principal
-- Substitua pelo e-mail do proprietário se for diferente
INSERT INTO admin_users (email, role)
VALUES ('otacilio2966@gmail.com', 'super_admin')
ON CONFLICT (email) DO UPDATE SET role = 'super_admin';

-- 3. Ativar RLS na tabela admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (RLS)
-- Deleta as antigas se existirem para evitar conflito
DROP POLICY IF EXISTS "Pode ler lista de admins" ON admin_users;
DROP POLICY IF EXISTS "Apenas Super Admin gerencia equipe" ON admin_users;

-- 4.1. Qualquer usuário autenticado pode ler a lista de admins (para o AuthContext saber quem é quem)
CREATE POLICY "Leitura de roles por autenticados" 
ON admin_users FOR SELECT 
TO authenticated 
USING (true);

-- 4.2. Apenas quem tem role 'super_admin' pode inserir, deletar ou atualizar outros administradores
-- Nota: Isso é o que torna o sistema SaaS-Ready e Seguro.
CREATE POLICY "Gestão total por Super Admin" 
ON admin_users FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'super_admin'
    )
);

-- 5. Comentário de Auditoria
COMMENT ON TABLE admin_users IS 'Tabela central de permissões. Roles: super_admin, admin, staff.';
