-- SYRON Man - Adicionar suporte a mÃºltiplas imagens (galeria) e vÃ­deo na tabela de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ComentÃ¡rio para o desenvolvedor: 
-- A coluna gallery Ã© um array de textos para mÃºltiplas URLs.
-- A coluna video_url armazena o link do vÃ­deo principal do produto.
