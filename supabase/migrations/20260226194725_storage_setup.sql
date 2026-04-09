-- SYRON Man - CONFIGURAÇÃO DE STORAGE
-- Cria o bucket de imagens e define políticas de acesso.

-- 1. Criar o bucket de imagens de produtos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que qualquer pessoa veja as imagens (Público)
DROP POLICY IF EXISTS "Imagens de produtos são públicas" ON storage.objects;
CREATE POLICY "Imagens de produtos são públicas" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- 3. Permitir que usuários autenticados (Admins) enviem imagens
DROP POLICY IF EXISTS "Admins podem enviar imagens" ON storage.objects;
CREATE POLICY "Admins podem enviar imagens" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

-- 4. Permitir que admins apaguem/atualizem imagens
DROP POLICY IF EXISTS "Admins podem deletar imagens" ON storage.objects;
CREATE POLICY "Admins podem deletar imagens" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins podem atualizar imagens" ON storage.objects;
CREATE POLICY "Admins podem atualizar imagens" ON storage.objects
FOR UPDATE TO authenticated WITH CHECK (bucket_id = 'product-images');
