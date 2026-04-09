-- ==========================================================
-- SYRON MAN - ESTABILIZAÇÃO DE ALTA PRECISÃO V6
-- Resolve erro 42804 (Type Mismatch) e Persistência de Role.
-- ==========================================================

-- 1. LIMPEZA TOTAL DE FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS get_my_role_v5();
DROP FUNCTION IF EXISTS get_admins_v5();
DROP FUNCTION IF EXISTS add_admin_v5(TEXT, TEXT);
DROP FUNCTION IF EXISTS remove_admin_v5(UUID);

-- 2. NOVAS FUNÇÕES RPC V6 (TIPAGEM BLINDADA VIA CAST)

-- A) get_my_role_v6
CREATE OR REPLACE FUNCTION get_my_role_v6()
RETURNS TEXT AS $$
DECLARE
    v_user_email TEXT;
    v_role_res TEXT;
BEGIN
    v_user_email := LOWER(TRIM(auth.jwt() ->> 'email'));
    
    IF v_user_email IS NULL THEN
        RETURN NULL;
    END IF;

    -- Busca com CAST explícito para evitar erros de estrutura
    SELECT role::TEXT INTO v_role_res 
    FROM admin_users 
    WHERE LOWER(TRIM(email)) = v_user_email;
    
    -- Fallback do proprietário
    IF v_role_res IS NULL AND v_user_email = 'otacilio2966@gmail.com' THEN
        RETURN 'super_admin';
    END IF;

    RETURN v_role_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B) get_admins_v6 (Mapeamento explícito para evitar structure mismatch)
CREATE OR REPLACE FUNCTION get_admins_v6()
RETURNS TABLE (
    o_id UUID,
    o_email TEXT,
    o_role TEXT,
    o_created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_caller_email TEXT;
BEGIN
    v_caller_email := LOWER(TRIM(auth.jwt() ->> 'email'));

    -- Verificação de autorização simplificada e rápida
    IF EXISTS (SELECT 1 FROM admin_users WHERE LOWER(TRIM(email)) = v_caller_email) 
       OR (v_caller_email = 'otacilio2966@gmail.com') THEN
        RETURN QUERY 
        SELECT id::UUID, email::TEXT, role::TEXT, created_at::TIMESTAMPTZ 
        FROM admin_users 
        ORDER BY created_at ASC;
    ELSE
        RAISE EXCEPTION 'Acesso Negado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C) add_admin_v6
CREATE OR REPLACE FUNCTION add_admin_v6(email_p TEXT, role_p TEXT)
RETURNS JSONB AS $$
DECLARE
    v_caller_email TEXT;
BEGIN
    v_caller_email := LOWER(TRIM(auth.jwt() ->> 'email'));

    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE LOWER(TRIM(email)) = v_caller_email AND role IN ('admin', 'super_admin'))
       AND (v_caller_email != 'otacilio2966@gmail.com') THEN
        RAISE EXCEPTION 'Acesso Negado';
    END IF;

    INSERT INTO admin_users (email, role)
    VALUES (LOWER(TRIM(email_p)), role_p)
    ON CONFLICT (email) DO UPDATE SET role = role_p;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D) remove_admin_v6
CREATE OR REPLACE FUNCTION remove_admin_v6(id_p UUID)
RETURNS JSONB AS $$
DECLARE
    v_caller_email TEXT;
BEGIN
    v_caller_email := LOWER(TRIM(auth.jwt() ->> 'email'));

    IF (v_caller_email = 'otacilio2966@gmail.com') OR EXISTS (
        SELECT 1 FROM admin_users WHERE LOWER(TRIM(email)) = v_caller_email AND role = 'super_admin'
    ) THEN
        DELETE FROM admin_users WHERE id = id_p;
        RETURN jsonb_build_object('success', true);
    ELSE
        RAISE EXCEPTION 'Acesso Negado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PERMISSÕES
GRANT EXECUTE ON FUNCTION get_my_role_v6() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admins_v6() TO authenticated;
GRANT EXECUTE ON FUNCTION add_admin_v6(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_v6(UUID) TO authenticated;

-- 4. POLÍTICA DE LEITURA (ESSENCIAL PARA PEDIDOS E LOGS)
-- Garante que outras tabelas possam verificar se o usuário é admin via consulta direta
DROP POLICY IF EXISTS "Leitura para Autenticados" ON admin_users;
CREATE POLICY "Leitura para Autenticados" 
ON admin_users FOR SELECT 
TO authenticated 
USING (true);

SELECT 'Arquitetura V6 (Alta Precisão) Finalizada!' as status;
