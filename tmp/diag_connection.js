
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.development') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('--- Testing PRODUCTS table ---');
    const { data: products, error: prodError } = await supabase.from('products').select('id').limit(1);
    if (prodError) {
        console.error('❌ Products Error:', prodError.message);
    } else {
        console.log('✅ Products OK:', products.length, 'found');
    }

    console.log('--- Testing CATEGORIES table ---');
    const { data: categories, error: catError } = await supabase.from('categories').select('id').limit(1);
    if (catError) {
        console.error('❌ Categories Error:', catError.message);
    } else {
        console.log('✅ Categories OK:', categories.length, 'found');
    }
}

test();
