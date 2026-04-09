-- ==========================================================
-- SYRON MAN - RESET NUCLEAR DE SEGURANÇA (RLS) V2
-- Correção de Ambiguidade e Estabilização de Acesso
-- ==========================================================

-- 1. LIMPEZA TOTAL (RESET DE POLÍTICAS)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON admin_users', pol.policyname);
    END LOOP;
END $$;

-- 2. REATIVAÇÃO SEGURA
-- Ativamos o RLS mas sem NENHUMA política. 
-- O acesso só será possível via funções RPC (SECURITY DEFINER).
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. RECRIANDO FUNÇÕES RPC (SECURITY DEFINER)
-- Removemos primeiro para evitar erro de mudança de assinatura (HINT: Use DROP FUNCTION)
DROP FUNCTION IF EXISTS get_my_role_v1();
DROP FUNCTION IF EXISTS get_admins_v1();
DROP FUNCTION IF EXISTS add_admin_v1(TEXT, TEXT);
DROP FUNCTION IF EXISTS remove_admin_v1(UUID);

-- A) Função para buscar a própria ROLE (Usa v_caller para evitar ambiguidade)
CREATE OR REPLACE FUNCTION get_my_role_v1()
RETURNS TEXT AS $$
DECLARE
    v_caller TEXT;
    v_role_found TEXT;
BEGIN
    v_caller := LOWER(TRIM(auth.jwt() ->> 'email'));
    
    SELECT role INTO v_role_found 
    FROM admin_users 
    WHERE email = v_caller;
    
    -- Fallback manual para o dono
    IF v_role_found IS NULL AND v_caller = 'otacilio2966@gmail.com' THEN
        RETURN 'super_admin';
    END IF;

    RETURN v_role_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B) Função para LISTAR equipe (Usa aliases em tudo para evitar ambiguidade)
CREATE OR REPLACE FUNCTION get_admins_v1()
RETURNS TABLE (
    out_id UUID,
    out_email TEXT,
    out_role TEXT,
    out_created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_caller TEXT;
BEGIN
    v_caller := LOWER(TRIM(auth.jwt() ->> 'email'));

    -- Só permite listar se quem pede for um Admin ou o Dono
    IF EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = v_caller
    ) OR (v_caller = 'otacilio2966@gmail.com') THEN
        RETURN QUERY 
        SELECT a.id, a.email, a.role, a.created_at 
        FROM admin_users a 
        ORDER BY a.created_at ASC;
    ELSE
        RAISE EXCEPTION 'Acesso Negado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C) Função para ADICIONAR novo admin
CREATE OR REPLACE FUNCTION add_admin_v1(email_param TEXT, role_param TEXT)
RETURNS JSONB AS $$
DECLARE
    v_caller TEXT;
    is_authorized BOOLEAN;
BEGIN
    v_caller := LOWER(TRIM(auth.jwt() ->> 'email'));

    SELECT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = v_caller 
        AND (role = 'super_admin' OR role = 'admin')
    ) OR (v_caller = 'otacilio2966@gmail.com') INTO is_authorized;

    IF NOT is_authorized THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas administradores podem conceder novos acessos.';
    END IF;

    INSERT INTO admin_users (email, role)
    VALUES (LOWER(TRIM(email_param)), role_param)
    ON CONFLICT (email) DO UPDATE SET role = role_param;

    RETURN jsonb_build_object('success', true, 'message', 'Acesso concedido com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D) Função para REMOVER admin
CREATE OR REPLACE FUNCTION remove_admin_v1(admin_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    v_caller TEXT;
BEGIN
    v_caller := LOWER(TRIM(auth.jwt() ->> 'email'));

    IF (v_caller = 'otacilio2966@gmail.com') OR EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = v_caller AND role = 'super_admin'
    ) THEN
        DELETE FROM admin_users WHERE id = admin_id_param;
        RETURN jsonb_build_object('success', true, 'message', 'Acesso revogado');
    ELSE
        RAISE EXCEPTION 'Acesso Negado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GARANTIR ACESSO AOS PAPEIS
GRANT ALL ON TABLE admin_users TO postgres;
GRANT ALL ON TABLE admin_users TO service_role;
GRANT EXECUTE ON FUNCTION get_my_role_v1() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admins_v1() TO authenticated;
GRANT EXECUTE ON FUNCTION add_admin_v1(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_v1(UUID) TO authenticated;

SELECT 'Reset Nuclear V3 Concluído! Sistema 100% Estabilizado.' as info;
