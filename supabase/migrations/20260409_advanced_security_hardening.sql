-- ==========================================================
-- SYRON MAN - HARDENING DE SEGURANÇA AVANÇADO (RLS & RBAC)
-- Engenheiro Sênior de Segurança - Style Man
-- ==========================================================

-- 1. LIMPEZA DE POLÍTICAS VULNERÁVEIS
-- Corrigindo a falha crítica na tabela 'settings'
DROP POLICY IF EXISTS "System manage settings" ON public.settings;
DROP POLICY IF EXISTS "Public read settings" ON public.settings;

-- 2. POLÍTICAS PARA A TABELA 'SETTINGS'
-- Qualquer pessoa (público) pode LER configurações (ex: nome da loja)
CREATE POLICY "Public Read Settings" ON public.settings
FOR SELECT USING (true);

-- APENAS Admin ou Super Admin pode MODIFICAR configurações
CREATE POLICY "Admin Manage Settings" ON public.settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = auth.email() AND role IN ('admin', 'super_admin')
    )
);

-- 3. POLÍTICAS PARA A TABELA 'ORDERS' (PEDIDOS)
-- Usuários autenticados podem ver APENAS SEUS PRÓPRIOS pedidos
DROP POLICY IF EXISTS "Users see own orders" ON public.orders;
CREATE POLICY "Users see own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

-- Admins e Staff podem ver TODOS os pedidos para gestão
DROP POLICY IF EXISTS "Admin view all orders" ON public.orders;
CREATE POLICY "Admin view all orders" ON public.orders
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = auth.email() AND role IN ('admin', 'super_admin', 'staff')
    )
);

-- 4. POLÍTICAS PARA A TABELA 'ADMIN_USERS'
-- Protege a lista de administradores
DROP POLICY IF EXISTS "Super Admin manage admins" ON public.admin_users;
CREATE POLICY "Super Admin manage admins" ON public.admin_users
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = auth.email() AND role = 'super_admin'
    )
);

-- 5. POLÍTICAS PARA A TABELA 'ADMIN_LOGS' (SISTEMA DE AUDITORIA)
-- Ninguém pode apagar ou alterar logs de auditoria
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only system can write logs" ON public.admin_logs;
CREATE POLICY "Only system can write logs" ON public.admin_logs
FOR INSERT WITH CHECK (true); -- Permitimos inserção via sistema/RPC

DROP POLICY IF EXISTS "Admin view audit logs" ON public.admin_logs;
CREATE POLICY "Admin view audit logs" ON public.admin_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = auth.email() AND role IN ('admin', 'super_admin')
    )
);

-- 6. FORÇAR RLS EM TODAS AS TABELAS SENSÍVEIS (GARANTIA)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

SELECT 'Hardenização de RLS e RBAC concluída com sucesso!' as status;
