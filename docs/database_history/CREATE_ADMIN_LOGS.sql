-- Criação da tabela de Logs de Administradores
-- Utilizada para manter rastro (Audit Trail) de todos os acessos ao painel administrativo

CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurações de Segurança Nível de Linha (RLS)
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Políticas
-- Opcional: Apenas admin pode ver logs, mas para simplificar, apenas a Role Service_Role e authenticated com admin (a lógica é gerenciada nas rules gerais)
-- Estamos criando uma política para permitir INSERT de dados de auditoria
DROP POLICY IF EXISTS "Enable insert for authenticated users on admin_logs" ON public.admin_logs;
CREATE POLICY "Enable insert for authenticated users on admin_logs" ON public.admin_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable select for authenticated users on admin_logs" ON public.admin_logs;
CREATE POLICY "Enable select for authenticated users on admin_logs" ON public.admin_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Comentários
COMMENT ON TABLE public.admin_logs IS 'Tabela de auditoria para salvar histórico de acessos de administradores na plataforma SYRON MAN';
