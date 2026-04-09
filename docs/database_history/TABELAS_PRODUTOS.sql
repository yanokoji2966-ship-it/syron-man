-- SYRON Man - TABELAS PARA GESTÃƒO DE PRODUTOS (PODE SER EXECUTADO VÃRIAS VEZES)
-- Execute no SQL Editor do Supabase

-- 1. Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name VARCHAR(100),
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. PolÃ­ticas (DROP para evitar erro, depois CREATE)
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (auth.jwt()->>'email' = 'otacilio2966@gmail.com');

DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products" ON products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (auth.jwt()->>'email' = 'otacilio2966@gmail.com');

-- 5. Inserir Categorias
-- 5. Inserir Categorias
INSERT INTO categories (name, icon) VALUES 
('Alfaiataria', 'Briefcase'),
('Camisas', 'Shirt'),
('CalÃ§as', 'Scissors'),
('Bermudas', 'Layers'),
('CalÃ§ados', 'Footprints'),
('RelÃ³gios', 'Watch')
ON CONFLICT (name) DO NOTHING;

-- 6. Inserir Produtos Iniciais
INSERT INTO products (name, description, price, old_price, category_name, image_url)
SELECT 'Terno Slim Fit Italiano', 'Terno completo corte italiano, tecido de alta qualidade, cor azul marinho.', 899.90, 1200.00, 'Alfaiataria', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Terno Slim Fit Italiano');

INSERT INTO products (name, description, price, old_price, category_name, image_url)
SELECT 'Camisa Social Branca Premium', 'Camisa social 100% algodÃ£o egÃ­pcio, ideal para ocasiÃµes formais.', 249.90, 350.00, 'Camisas', 'https://images.unsplash.com/photo-1620012253295-c15cc5fe93ca?auto=format&fit=crop&q=80&w=400'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Camisa Social Branca Premium');

-- 7. Trigger para updated_at (Recria de forma segura)
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
