-- ==========================================================
-- DEBURUAÇÃO E SIMPLIFICAÇÃO RLS (admin_users)
-- Objetivo: Eliminar qualquer trava de recursão ou permissão
-- ==========================================================

-- 1. Desativar RLS temporariamente para limpar tudo com segurança
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- 2. Limpar TODAS as políticas existentes
DROP POLICY IF EXISTS "Leitura de roles por autenticados" ON admin_users;
DROP POLICY IF EXISTS "Gestão total por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Leitura de roles" ON admin_users;
DROP POLICY IF EXISTS "Inserção por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Deleção por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Atualização por Super Admin" ON admin_users;

-- 3. Criar política SIMPLIFICADA (Baseada apenas em E-mail no JWT para evitar recursão)
-- Esta regra não consulta a tabela admin_users no USING, evitando loops.
CREATE POLICY "Super Admin Total" 
ON admin_users FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'email' = 'otacilio2966@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'otacilio2966@gmail.com');

-- 4. Criar política de leitura para outros admins (Apenas visualização)
CREATE POLICY "Admins leem equipe"
ON admin_users FOR SELECT
TO authenticated
USING (true);

-- 5. Reativar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 6. Garantir permissões de serviço
GRANT ALL ON TABLE admin_users TO postgres;
GRANT ALL ON TABLE admin_users TO authenticated;
GRANT ALL ON TABLE admin_users TO service_role;

-- 7. Verificar estado atual (Execute este SELECT após o script)
-- SELECT * FROM admin_users;
