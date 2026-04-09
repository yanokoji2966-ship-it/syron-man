-- Função para adicionar admin sem cair no loop de RLS
CREATE OR REPLACE FUNCTION add_admin_v1(email_param TEXT, role_param TEXT)
RETURNS JSONB AS $$
DECLARE
    caller_email TEXT;
    is_caller_super_admin BOOLEAN;
BEGIN
    -- Captura o email de quem está logado no Supabase Auth
    caller_email := auth.jwt() ->> 'email';

    -- Validação de segurança: apenas o proprietário ou super_admins podem adicionar outros
    -- Nota: Usamos hardcoded para o email do proprietário como fail-safe
    SELECT EXISTS (
        SELECT 1 FROM admin_users
        WHERE email = caller_email AND (role = 'super_admin' OR role = 'admin')
    ) OR (LOWER(caller_email) = 'otacilioandrade33@gmail.com') INTO is_caller_super_admin;

    IF NOT is_caller_super_admin THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas administradores autorizados podem adicionar novos membros.';
    END IF;

    -- Inserção ignorando RLS (por ser SECURITY DEFINER)
    INSERT INTO admin_users (email, role)
    VALUES (LOWER(TRIM(email_param)), role_param)
    ON CONFLICT (email) DO UPDATE SET role = role_param;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Administrador adicionado com sucesso',
        'email', LOWER(TRIM(email_param))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para listar admins sem cair no loop de RLS
CREATE OR REPLACE FUNCTION get_admins_v1()
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Validação de segurança básica: apenas quem está na tabela ou é o dono pode listar
    IF EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = auth.jwt() ->> 'email'
    ) OR (LOWER(auth.jwt() ->> 'email') = 'otacilioandrade33@gmail.com') THEN
        RETURN QUERY SELECT a.id, a.email, a.role, a.created_at FROM admin_users a ORDER BY a.created_at ASC;
    ELSE
        RAISE EXCEPTION 'Acesso Negado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover admin sem cair no loop de RLS
CREATE OR REPLACE FUNCTION remove_admin_v1(admin_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    caller_email TEXT;
    is_caller_super_admin BOOLEAN;
BEGIN
    caller_email := auth.jwt() ->> 'email';

    -- Validação: apenas super_admin ou dono pode remover
    SELECT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = caller_email AND role = 'super_admin'
    ) OR (LOWER(caller_email) = 'otacilioandrade33@gmail.com') INTO is_caller_super_admin;

    IF NOT is_caller_super_admin THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas Super Admins podem remover membros.';
    END IF;

    DELETE FROM admin_users WHERE id = admin_id_param;

    RETURN jsonb_build_object('success', true, 'message', 'Administrador removido com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função leve para o usuário logado descobrir sua própria role (seguro e evita loop de RLS)
CREATE OR REPLACE FUNCTION get_my_role_v1()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Busca direta na tabela ignorando RLS por ser SECURITY DEFINER
    SELECT role INTO user_role FROM admin_users 
    WHERE email = LOWER(auth.jwt() ->> 'email');
    
    -- Fallback manual se for o dono e não estiver na tabela por algum motivo
    IF user_role IS NULL AND LOWER(auth.jwt() ->> 'email') = 'otacilioandrade33@gmail.com' THEN
        RETURN 'super_admin';
    END IF;

    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
