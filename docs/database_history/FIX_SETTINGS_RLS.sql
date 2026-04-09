-- SYRON Man - FIX RLS FOR SETTINGS TABLE
-- Este script corrige o erro: "new row violates row-level security policy for table 'settings'"

-- 1. Garante que RLS estÃ¡ habilitado (jÃ¡ deve estar, mas por seguranÃ§a)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 2. MantÃ©m a polÃ­tica de leitura pÃºblica (pois o site precisa ler as configs sem estar logado)
DROP POLICY IF EXISTS "Public read access" ON settings;
CREATE POLICY "Public read access" ON settings FOR SELECT USING (true);

-- 3. Cria polÃ­tica permitindo que USUÃRIOS AUTENTICADOS (Admins) possam INSERIR
DROP POLICY IF EXISTS "Admins can insert settings" ON settings;
CREATE POLICY "Admins can insert settings" ON settings 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 4. Cria polÃ­tica permitindo que USUÃRIOS AUTENTICADOS (Admins) possam ATUALIZAR
DROP POLICY IF EXISTS "Admins can update settings" ON settings;
CREATE POLICY "Admins can update settings" ON settings 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. Cria polÃ­tica permitindo que USUÃRIOS AUTENTICADOS (Admins) possam DELETAR
DROP POLICY IF EXISTS "Admins can delete settings" ON settings;
CREATE POLICY "Admins can delete settings" ON settings 
FOR DELETE 
USING (auth.role() = 'authenticated');
