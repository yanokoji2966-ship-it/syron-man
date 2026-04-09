-- SYRON Man - FIX: Garantir que os produtos sejam visÃ­veis para todos e editÃ¡veis apenas por admins
-- Execute este script no SQL Editor do Supabase se seus produtos sumiram!

-- 1. Habilitar RLS (SeguranÃ§a de NÃ­vel de Linha)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que QUALQUER PESSOA (logada ou nÃ£o) veja os produtos
DROP POLICY IF EXISTS "Produtos sÃ£o pÃºblicos" ON products;
CREATE POLICY "Produtos sÃ£o pÃºblicos" ON products 
FOR SELECT USING (true);

-- 3. Permitir que apenas usuÃ¡rios autenticados (Admins) possam inserir/atualizar/deletar
DROP POLICY IF EXISTS "Admins gerenciam produtos" ON products;
CREATE POLICY "Admins gerenciam produtos" ON products 
FOR ALL TO authenticated USING (true);

-- 4. Opcional: Se as categorias tambÃ©m sumiram
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categorias sÃ£o pÃºblicas" ON categories;
CREATE POLICY "Categorias sÃ£o pÃºblicas" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins gerenciam categorias" ON categories;
CREATE POLICY "Admins gerenciam categorias" ON categories FOR ALL TO authenticated USING (true);

-- DICA: Se apÃ³s rodar isso os produtos ainda nÃ£o aparecerem, 
-- verifique se vocÃª nÃ£o deletou os dados acidentalmente ou se estÃ¡ no projeto correto.
