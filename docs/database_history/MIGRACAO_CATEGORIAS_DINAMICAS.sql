-- MIGRACAO: CATEGORIAS DINÂMICAS E PERSONALIZÁVEIS
-- Descrição: Adiciona campos de SEO, visibilidade e ordenação à tabela de categorias.

-- 0. Habilitar extensão para remover acentos (necessário para Slugs)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. Adicionar novos campos à tabela categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0;

-- 2. Função para gerar slug automaticamente a partir do nome
CREATE OR REPLACE FUNCTION generate_category_slug(name_text TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(name_text), 
        '[^a-zA-Z0-9\s]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Atualizar categorias existentes com slugs baseados no nome
UPDATE categories 
SET slug = generate_category_slug(name) 
WHERE slug IS NULL;

-- 4. Tornar o slug NOT NULL após a migração inicial
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;

-- 5. Garantir que a tabela products tenha a coluna category_id (já existe no schema inicial, mas reforçando)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_id') THEN
        ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. Trigger para gerar slug automaticamente no INSERT ou UPDATE de categoria
CREATE OR REPLACE FUNCTION trigger_generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.name <> OLD.name THEN
    NEW.slug := generate_category_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_category_slug ON categories;
CREATE TRIGGER tr_generate_category_slug
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION trigger_generate_category_slug();

-- 7. Atualizar Políticas de RLS para considerar o campo 'active' para o público
DROP POLICY IF EXISTS "Public read access" ON categories;
CREATE POLICY "Public read access" ON categories 
FOR SELECT USING (active = true OR (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')));

-- 8. Definir uma ordem inicial baseada na inserção
WITH ordered_cats AS (
  SELECT id, row_number() OVER (ORDER BY created_at) as pos
  FROM categories
)
UPDATE categories
SET order_position = ordered_cats.pos
FROM ordered_cats
WHERE categories.id = ordered_cats.id AND categories.order_position = 0;

COMMENT ON TABLE categories IS 'Tabela de categorias dinâmicas controlada pelo NEXUS Dash';
