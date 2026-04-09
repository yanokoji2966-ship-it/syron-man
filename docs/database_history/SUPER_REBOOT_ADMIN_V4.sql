-- ==========================================================
-- SYRON MAN - RESET NUCLEAR V4 (ULTIMATE STABILITY)
-- Este script resolve o timeout de 15s definitivamente.
-- ==========================================================

-- 1. LIMPEZA TOTAL DE SEGURANÇA
-- Desativamos RLS para garantir que as remoções não travem.
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Removemos TODAS as políticas conhecidas e desconhecidas da tabela
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON admin_users', pol.policyname);
    END LOOP;
END $$;

-- Removemos gatilhos que possam estar causando lentidão/loops ocultos
DO $$ 
DECLARE 
    trig RECORD;
BEGIN 
    FOR trig IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'admin_users') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON admin_users', trig.trigger_name);
    END LOOP;
END $$;

-- 2. REMOÇÃO DE FUNÇÕES ANTIGAS (Limpeza total de cache)
DROP FUNCTION IF EXISTS get_my_role_v1();
DROP FUNCTION IF EXISTS get_admins_v1();
DROP FUNCTION IF EXISTS add_admin_v1(TEXT, TEXT);
DROP FUNCTION IF EXISTS remove_admin_v1(UUID);

-- 3. CRIAÇÃO DAS FUNÇÕES V2 (NOMES NOVOS PARA FORÇAR RECARGA)

-- A) get_my_role_v2
CREATE OR REPLACE FUNCTION get_my_role_v2()
RETURNS TEXT AS $$
DECLARE
    v_caller TEXT;
    v_role_found TEXT;
BEGIN
    v_caller := LOWER(TRIM(auth.jwt() ->> 'email'));
    
    -- Busca direta ignorando RLS (SECURITY DEFINER)
    SELECT role INTO v_role_found FROM admin_users WHERE email = v_caller;
    
    -- Fallback proprietário
    IF v_role_found IS NULL AND v_caller = 'otacilio2966@gmail.com' THEN
        RETURN 'super_admin';
    END IF;

    RETURN v_role_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- B) get_admins_v2
CREATE OR REPLACE FUNCTION get_admins_v2()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    user_created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_caller TEXT;
BEGIN
    v_caller := LOWER(TRIM(auth.jwt() ->> 'email'));

    IF EXISTS (SELECT 1 FROM admin_users WHERE email = v_caller) OR (v_caller = 'otacilio2966@gmail.com') THEN
        RETURN QUERY 
        SELECT id, email, role, created_at 
        FROM admin_users 
        ORDER BY created_at ASC;
    ELSE
        RAISE EXCEPTION 'Acesso Negado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- C) add_admin_v2
CREATE OR REPLACE FUNCTION add_admin_v2(email_param TEXT, role_param TEXT)
RETURNS JSONB AS $$
DECLARE
    v_caller TEXT;
    is_authorized BOOLEAN;
BEGIN
    v_caller := LOWER(TRIM(auth.jwt() ->> 'email'));

    -- Verificação rápida
    SELECT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = v_caller 
        AND (role = 'super_admin' OR role = 'admin')
    ) OR (v_caller = 'otacilio2966@gmail.com') INTO is_authorized;

    IF NOT is_authorized THEN
        RAISE EXCEPTION 'Acesso Negado';
    END IF;

    -- Inserção Segura
    INSERT INTO admin_users (email, role)
    VALUES (LOWER(TRIM(email_param)), role_param)
    ON CONFLICT (email) DO UPDATE SET role = role_param;

    RETURN jsonb_build_object('success', true, 'message', 'OK');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- D) remove_admin_v2
CREATE OR REPLACE FUNCTION remove_admin_v2(id_param UUID)
RETURNS JSONB AS $$
DECLARE
    v_caller TEXT;
BEGIN
    v_caller := LOWER(TRIM(auth.jwt() ->> 'email'));

    IF (v_caller = 'otacilio2966@gmail.com') OR EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = v_caller AND role = 'super_admin'
    ) THEN
        DELETE FROM admin_users WHERE id = id_param;
        RETURN jsonb_build_object('success', true);
    ELSE
        RAISE EXCEPTION 'Acesso Negado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. FINALIZAÇÃO DE SEGURANÇA
-- Reativamos RLS. Como não há políticas (DROP ALL acima), 
-- o acesso direto via API anon/authenticated fica bloqueado.
-- Apenas os RPCs (SECURITY DEFINER) funcionarão.
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

GRANT EXECUTE ON FUNCTION get_my_role_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admins_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION add_admin_v2(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_v2(UUID) TO authenticated;

SELECT 'Reset Nuclear V4 Concluído! Tudo Limpo e Rápido.' as status;
