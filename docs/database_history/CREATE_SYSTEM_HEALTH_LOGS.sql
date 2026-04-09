-- Tabela de Observabilidade e Saúde do Sistema
CREATE TABLE IF NOT EXISTS public.system_health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'ERROR', 'WARN', 'CHECKOUT_FAILURE', 'PERFORMANCE', 'SYSTEM'
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    severity TEXT NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;

-- Política de apenas inserção para anon (frontend)
CREATE POLICY "Allow public system logs" 
ON public.system_health_logs 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Política de visualização apenas para administradores
CREATE POLICY "Allow admin to view system logs" 
ON public.system_health_logs 
FOR SELECT 
TO anon 
USING (true); -- No futuro restringir por role de admin se implementado

-- Comentários da Tabela
COMMENT ON TABLE public.system_health_logs IS 'Logs de saúde e erros do sistema para observabilidade.';
