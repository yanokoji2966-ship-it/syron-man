import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportProducts() {
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) {
        fs.writeFileSync('tmp/products_debug.json', JSON.stringify({ error: error.message }));
    } else {
        fs.writeFileSync('tmp/products_debug.json', JSON.stringify(products, null, 2));
    }

    const { data: categories } = await supabase.from('categories').select('*');
    fs.writeFileSync('tmp/categories_debug.json', JSON.stringify(categories, null, 2));

    const { data: settings } = await supabase.from('settings').select('*');
    fs.writeFileSync('tmp/settings_debug.json', JSON.stringify(settings, null, 2));
}

exportProducts();
