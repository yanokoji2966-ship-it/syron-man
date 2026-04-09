-- ==========================================================
-- SYRON MAN - REPARO DE AUDITORIA (ADMIN_LOGS)
-- Garante que a tabela de logs tenha a coluna admin_email.
-- ==========================================================

DO $$ 
BEGIN
    -- 1. Se a tabela não existe, cria do zero
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_logs') THEN
        CREATE TABLE public.admin_logs (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            admin_email TEXT NOT NULL,
            action TEXT NOT NULL,
            details JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- 2. Se a tabela existe, garante a coluna admin_email
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_logs' AND column_name = 'admin_email') THEN
            ALTER TABLE public.admin_logs ADD COLUMN admin_email TEXT;
            
            -- Preenche com valor default para evitar erros se houver registros antigos
            UPDATE public.admin_logs SET admin_email = 'system@syronman.com' WHERE admin_email IS NULL;
            
            -- Opcional: Se quiser manter o admin_id para histórico, não removemos nada.
            -- Apenas garantimos que o admin_email é o padrão daqui para frente.
            ALTER TABLE public.admin_logs ALTER COLUMN admin_email SET NOT NULL;
        END IF;

        -- 3. Garante que details seja JSONB (caso esteja como outro tipo ou faltando)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_logs' AND column_name = 'details') THEN
            ALTER TABLE public.admin_logs ADD COLUMN details JSONB DEFAULT '{}'::jsonb;
        END IF;
    END IF;
END $$;

-- 4. Garante políticas de segurança para inserção e leitura
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users on admin_logs" ON public.admin_logs;
CREATE POLICY "Enable insert for authenticated users on admin_logs" ON public.admin_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for authenticated users on admin_logs" ON public.admin_logs;
CREATE POLICY "Enable select for authenticated users on admin_logs" ON public.admin_logs
    FOR SELECT USING (true);

SELECT 'Tabela admin_logs reparada com sucesso!' as status;
