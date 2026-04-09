-- SYRON Man - Corrigir RLS para Tabela de Cupons
-- Este script adiciona políticas de segurança para permitir que admins gerenciem cupons

-- Habilitar RLS na tabela coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Política: Admin específico pode fazer tudo (INSERT, SELECT, UPDATE, DELETE)
CREATE POLICY "Admin full access to coupons"
ON coupons
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'otacilio2966@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'otacilio2966@gmail.com');

-- Política: Qualquer usuário autenticado pode VER cupons ativos (para validação no checkout)
CREATE POLICY "Anyone can view active coupons"
ON coupons
FOR SELECT
TO authenticated
USING (is_active = true);
