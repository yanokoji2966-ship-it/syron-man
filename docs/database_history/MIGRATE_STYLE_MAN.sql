-- SCRIPT DE MIGRAÃ‡ÃƒO PARA SYRON Man
-- Execute isso no Editor SQL do Supabase para limpar dados e inserir novos produtos (Moda Masculina)

-- 1. Limpar dados antigos
DELETE FROM products;
DELETE FROM categories;

-- 2. Inserir Novas Categorias
INSERT INTO categories (name, icon) VALUES 
('Alfaiataria', 'Briefcase'),
('Camisas', 'Shirt'),
('CalÃ§as', 'Scissors'),
('Bermudas', 'Layers'),
('CalÃ§ados', 'Footprints'),
('RelÃ³gios', 'Watch')
ON CONFLICT (name) DO NOTHING;

-- 3. Inserir Novos Produtos (Amostra)
INSERT INTO products (name, description, price, old_price, category_name, image_url) VALUES
('Terno Slim Fit Italiano', 'Terno completo corte italiano, tecido de alta qualidade, cor azul marinho.', 899.90, 1200.00, 'Alfaiataria', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400'),
('Camisa Social Branca Premium', 'Camisa social 100% algodÃ£o egÃ­pcio, ideal para ocasiÃµes formais.', 249.90, 350.00, 'Camisas', 'https://images.unsplash.com/photo-1620012253295-c15cc5fe93ca?auto=format&fit=crop&q=80&w=400'),
('Camisa Polo Azul Marinho', 'ClÃ¡ssica camisa polo em piquet, confortÃ¡vel e elegante.', 129.90, 160.00, 'Camisas', 'https://images.unsplash.com/photo-1621072156002-e2982c77b6ae?auto=format&fit=crop&q=80&w=400'),
('Shorts de Linho Caqui', 'Shorts de linho com cordÃ£o, estilo casual chic.', 149.90, 199.90, 'Bermudas', 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=400'),
('Sapato Oxford Couro LegÃ­timo', 'Sapato social modelo Oxford em couro legÃ­timo marrom cafÃ©.', 459.90, 600.00, 'CalÃ§ados', 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=400');

-- 4. Atualizar IDs de categoria nos produtos (linkagem)
UPDATE products 
SET category_id = categories.id 
FROM categories 
WHERE products.category_name = categories.name;
