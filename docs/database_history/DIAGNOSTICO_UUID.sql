-- SYRON Man - DIAGNÃ“STICO DE TIPOS UUID
-- Execute este script no SQL Editor do Supabase para identificar problemas de tipo

-- 1. Verificar tipos de colunas na tabela orders
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('id', 'user_id')
ORDER BY ordinal_position;

-- 2. Verificar tipos de colunas na tabela order_items
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name IN ('id', 'order_id', 'product_id')
ORDER BY ordinal_position;

-- 3. Verificar constraints e foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name IN ('orders', 'order_items')
AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Listar todas as policies RLS que podem estar causando o problema
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('orders', 'order_items');
