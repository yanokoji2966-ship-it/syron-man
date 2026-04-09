-- SYRON Man - AUDITORIA COMPLETA DE DADOS
-- Execute este script no SQL Editor do Supabase

-- 1. Corrige ou cria a tabela de configurações para evitar o erro de JSON
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Garante que o payment_link exista para não dar erro no .single()
INSERT INTO settings (key, value)
VALUES ('payment_link', '')
ON CONFLICT (key) DO NOTHING;

-- 2. Auditando os produtos atuais (Ver se o novo está aqui)
SELECT 
    p.id, 
    p.name, 
    p.price, 
    p.is_active, 
    c.name as categoria_vinculada,
    p.created_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC;

-- 3. Auditando categorias para ver se batem com o que o site espera
SELECT id, name FROM categories;
