-- ==========================================================
-- SYRON MAN - EXPANSÃO DE NÍVEIS DE ACESSO (RBAC)
-- Adicionando suporte para o perfil 'staff' (Funcionário).
-- ==========================================================

-- 1. Se houver um check constraint limitando os roles, precisamos atualizá-lo.
-- Como o Supabase usa campos de texto ou enum, vamos garantir a sanidade.

-- Adicionando 'staff' como uma opção válida na tabela admin_users
-- Se a coluna role for um enum ou tiver check constraint, este bloco lida com isso.
DO $$ 
BEGIN
    -- Se for um check constraint
    ALTER TABLE IF EXISTS public.admin_users 
    DROP CONSTRAINT IF EXISTS admin_users_role_check;
    
    ALTER TABLE public.admin_users 
    ADD CONSTRAINT admin_users_role_check 
    CHECK (role IN ('super_admin', 'admin', 'staff'));
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Tabela admin_users não encontrada.';
END $$;

-- 2. Atualizar a função de detecção de role para ser compatível
CREATE OR REPLACE FUNCTION get_my_role_v6()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM admin_users
    WHERE email = auth.email()
    LIMIT 1;
    
    RETURN v_role;
END;
$$;

-- 3. Inserir log de auditoria para a alteração
INSERT INTO public.admin_logs (admin_email, action)
VALUES ('system@syronman.com', 'RBAC_UPGRADE_V1_STAFF_ADDED');

SELECT 'Sistema de permissões atualizado para Suporte a Funcionários (Staff)' as status;
