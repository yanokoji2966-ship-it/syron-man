-- ==========================================================
-- SYRON MAN - CORREÇÃO NUCLEAR DE RLS E TIMEOUTS
-- Este script elimina recursão infinita e restaura a performance
-- das tabelas admin_users e categories.
-- ==========================================================

-- 1. LIMPEZA TOTAL (RESET)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admin Total" ON admin_users;
DROP POLICY IF EXISTS "Admins leem equipe" ON admin_users;
DROP POLICY IF EXISTS "Leitura de roles por autenticados" ON admin_users;
DROP POLICY IF EXISTS "Gestão total por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Leitura de roles" ON admin_users;
DROP POLICY IF EXISTS "Inserção por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Deleção por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Atualização por Super Admin" ON admin_users;
DROP POLICY IF EXISTS "Super Admin Hardcoded Access" ON admin_users;
DROP POLICY IF EXISTS "Leitura de Equipe" ON admin_users;
DROP POLICY IF EXISTS "Gestão de Equipe por Funcao" ON admin_users;

-- 2. FUNÇÃO SECURITY DEFINER (Bypass de RLS)
-- Esta função é o "escape" necessário para consultar a tabela sem loops.
CREATE OR REPLACE FUNCTION check_is_super_admin_v2()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. POLÍTICAS DA TABELA ADMIN_USERS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3.1. REGRA DE OURO (Super Admin por E-mail): 
-- Esta regra NÃO usa subqueries, por isso é instantânea e 0% chance de recursão.
CREATE POLICY "Super Admin Hardcoded Access" 
ON admin_users FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'email' = 'otacilio2966@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'otacilio2966@gmail.com');

-- 3.2. REGRA DE LEITURA (Qualquer admin logado pode ver a lista de equipe)
CREATE POLICY "Leitura de Equipe" 
ON admin_users FOR SELECT 
TO authenticated 
USING (true);

-- 3.3. REGRA DE GESTÃO (Outros Super Admins via função)
CREATE POLICY "Gestão de Equipe por Funcao" 
ON admin_users FOR ALL 
TO authenticated 
USING (check_is_super_admin_v2())
WITH CHECK (check_is_super_admin_v2());


-- 4. POLÍTICAS DA TABELA CATEGORIES (Desbloqueio Global)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select categories" ON categories;
DROP POLICY IF EXISTS "Allow all to read categories" ON categories;

CREATE POLICY "Public select categories" 
ON categories FOR SELECT 
TO anon, authenticated 
USING (true);


-- 5. POLÍTICAS DA TABELA SETTINGS (Prevenção de Timeout)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read settings" ON settings;
CREATE POLICY "Public read settings" ON settings FOR SELECT TO anon, authenticated USING (true);


-- 6. GARANTIR PERMISSÕES DE PAPEL
GRANT ALL ON TABLE admin_users TO postgres;
GRANT ALL ON TABLE admin_users TO authenticated;
GRANT ALL ON TABLE admin_users TO service_role;
GRANT EXECUTE ON FUNCTION check_is_super_admin_v2() TO authenticated;

SELECT 'RLS Estabilizado com Sucesso! (Final)' as status;
