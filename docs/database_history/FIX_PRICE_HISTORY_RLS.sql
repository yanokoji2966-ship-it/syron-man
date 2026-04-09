-- SYRON Man - CORREÇÃO: Erro de RLS na tabela price_history
-- Execute no SQL Editor do Supabase (painel online)
-- PROBLEMA: Um trigger tenta registrar o histórico de preços mas o RLS bloqueia.

-- OPÇÃO A (Recomendado): Permitir que admins insiram no price_history
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage price history" ON price_history;
CREATE POLICY "Admins can manage price history" ON price_history
FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
);

-- OPÇÃO B (Alternativa mais simples): Desativar o trigger de price_history
-- Se não precisar de histórico de preços, descomente as linhas abaixo e comente a Opção A:
-- DROP TRIGGER IF EXISTS tr_price_history ON products;
-- DROP TRIGGER IF EXISTS price_history_trigger ON products;

SELECT 'Política de price_history corrigida!' AS status;
