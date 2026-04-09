-- SCRIP DE MIGRAÇÃO DE IDENTIDADE ADMIN - SYRON MAN
-- RODE ESTE SCRIPT NO SQL EDITOR DO SUPABASE PARA ATUALIZAR AS PERMISSÕES

-- 1. Atualiza o e-mail do super admin na tabela de permissões (se ele já existir com o e-mail antigo)
UPDATE admin_users 
SET email = 'suportesyronman@gmail.com' 
WHERE email = 'otacilio2966@gmail.com';

-- 2. Garante que o novo e-mail tenha o cargo de super_admin caso o registro não exista
INSERT INTO admin_users (email, role)
SELECT 'suportesyronman@gmail.com', 'super_admin'
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE email = 'suportesyronman@gmail.com'
);

-- Sucesso: O e-mail suportesyronman@gmail.com agora é o mestre do sistema.
