-- ==========================================================
-- SYRON MAN - ESTABILIZAÇÃO GLOBAL V5 (FINAL)
-- Resolve Ambiguidade, Timeouts e Erros 400 em cascata.
-- ==========================================================

-- 1. LIMPEZA DE FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS get_my_role_v1();
DROP FUNCTION IF EXISTS get_admins_v1();
DROP FUNCTION IF EXISTS add_admin_v1(TEXT, TEXT);
DROP FUNCTION IF EXISTS remove_admin_v1(UUID);
DROP FUNCTION IF EXISTS get_my_role_v2();
DROP FUNCTION IF EXISTS get_admins_v2();
DROP FUNCTION IF EXISTS add_admin_v2(TEXT, TEXT);
DROP FUNCTION IF EXISTS remove_admin_v2(UUID);

-- 2. AJUSTE DE RLS (DESBLOQUEIO PARA OUTRAS TABELAS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Removemos políticas de leitura antigas
DROP POLICY IF EXISTS "Leitura para Autenticados" ON admin_users;
DROP POLICY IF EXISTS "Public select categories" ON categories;

-- CRIAMOS A REGRA DE OURO: Qualquer usuário logado pode ler a tabela de admins.
-- Isso permite que as políticas de 'orders', 'admin_logs', etc., funcionem!
CREATE POLICY "Leitura para Autenticados" 
ON admin_users FOR SELECT 
TO authenticated 
USING (true);

-- 3. NOVAS FUNÇÕES RPC V5 (NOMES BLINDADOS CONTRA AMBIGUIDADE)

-- A) get_my_role_v5
CREATE OR REPLACE FUNCTION get_my_role_v5()
RETURNS TEXT AS $$
DECLARE
    v_role_res TEXT;
BEGIN
    SELECT role INTO v_role_res FROM admin_users 
    WHERE email = LOWER(TRIM(auth.jwt() ->> 'email'));
    
    IF v_role_res IS NULL AND LOWER(auth.jwt() ->> 'email') = 'otacilio2966@gmail.com' THEN
        RETURN 'super_admin';
    END IF;

    RETURN v_role_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B) get_admins_v5 (Retorna colunas com prefixo o_ para 0% de ambiguidade)
CREATE OR REPLACE FUNCTION get_admins_v5()
RETURNS TABLE (
    o_id UUID,
    o_email TEXT,
    o_role TEXT,
    o_created_at TIMESTAMPTZ
) AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM admin_users WHERE email = LOWER(auth.jwt() ->> 'email')) 
       OR (LOWER(auth.jwt() ->> 'email') = 'otacilio2966@gmail.com') THEN
        RETURN QUERY 
        SELECT id, email, role, created_at 
        FROM admin_users 
        ORDER BY created_at ASC;
    ELSE
        RAISE EXCEPTION 'Acesso Negado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C) add_admin_v5
CREATE OR REPLACE FUNCTION add_admin_v5(email_p TEXT, role_p TEXT)
RETURNS JSONB AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE email = LOWER(auth.jwt() ->> 'email') AND role IN ('admin', 'super_admin'))
       AND (LOWER(auth.jwt() ->> 'email') != 'otacilio2966@gmail.com') THEN
        RAISE EXCEPTION 'Acesso Negado';
    END IF;

    INSERT INTO admin_users (email, role)
    VALUES (LOWER(TRIM(email_p)), role_p)
    ON CONFLICT (email) DO UPDATE SET role = role_p;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D) remove_admin_v5
CREATE OR REPLACE FUNCTION remove_admin_v5(id_p UUID)
RETURNS JSONB AS $$
BEGIN
    IF (LOWER(auth.jwt() ->> 'email') = 'otacilio2966@gmail.com') OR EXISTS (
        SELECT 1 FROM admin_users WHERE email = LOWER(auth.jwt() ->> 'email') AND role = 'super_admin'
    ) THEN
        DELETE FROM admin_users WHERE id = id_p;
        RETURN jsonb_build_object('success', true);
    ELSE
        RAISE EXCEPTION 'Acesso Negado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. PERMISSÕES
GRANT EXECUTE ON FUNCTION get_my_role_v5() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admins_v5() TO authenticated;
GRANT EXECUTE ON FUNCTION add_admin_v5(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_v5(UUID) TO authenticated;

SELECT 'Arquitetura V5 Finalizada com Sucesso!' as status;
