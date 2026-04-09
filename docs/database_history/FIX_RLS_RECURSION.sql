-- ==========================================================
-- CORREÇÃO DE RECURSÃO INFINITA (RLS) - SYRON MAN
-- Erro: infinite recursion detected in policy
-- ==========================================================

-- 1. Criar função de apoio com SECURITY DEFINER
-- Isso permite consultar admin_users sem disparar o RLS recursivamente.
CREATE OR REPLACE FUNCTION check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'super_admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpar políticas que possam ter conflitos de nome
DROP POLICY IF EXISTS "Gestão total por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Leitura de roles por autenticados" ON admin_users;
DROP POLICY IF EXISTS "Leitura de roles" ON admin_users;
DROP POLICY IF EXISTS "Inserção por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Deleção por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Atualização por Super Admin" ON admin_users;

-- 3. Criar novas políticas seguras

-- 3.1. Qualquer usuário logado pode ler a lista (seguro, sem subquery recursiva)
CREATE POLICY "Leitura de roles" 
ON admin_users FOR SELECT 
TO authenticated 
USING (true);

-- 3.2. Apenas Super Admin pode inserir novos admins (usando a função de escape)
CREATE POLICY "Inserção por Super Admin" 
ON admin_users FOR INSERT 
TO authenticated 
WITH CHECK (check_is_super_admin());

-- 3.3. Apenas Super Admin pode deletar admins
CREATE POLICY "Deleção por Super Admin" 
ON admin_users FOR DELETE 
TO authenticated 
USING (check_is_super_admin());

-- 3.4. Apenas Super Admin pode atualizar admins
CREATE POLICY "Atualização por Super Admin" 
ON admin_users FOR UPDATE 
TO authenticated 
USING (check_is_super_admin())
WITH CHECK (check_is_super_admin());

-- 4. Log de Auditoria
COMMENT ON FUNCTION check_is_super_admin IS 'Valida permissão de super_admin ignorando RLS para evitar recursão.';
