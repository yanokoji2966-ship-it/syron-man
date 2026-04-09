import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    console.log('--- DB DIAGNOSTIC ---');
    console.log('URL:', supabaseUrl);

    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products.`);
    products.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.name}, Active: ${p.is_active}, Sales Limit: ${p.sales_limit}, Enabled: ${p.limit_enabled}`);
    });
}

checkProducts();
