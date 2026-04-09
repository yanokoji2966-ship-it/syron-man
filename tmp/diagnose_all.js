import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DETAILED DIAGNOSTIC ---');

    // 1. Fetch Products
    const { data: products, error: pError } = await supabase.from('products').select('*');
    if (pError) console.error('P Error:', pError.message);
    else {
        console.log(`Products (${products.length}):`);
        products.forEach(p => {
            console.log(`- [${p.id}] ${p.name} | Active: ${p.is_active} | CatID: ${p.category_id} | Price: ${p.price}`);
        });
    }

    // 2. Fetch Categories
    const { data: categories, error: cError } = await supabase.from('categories').select('*');
    if (cError) console.error('C Error:', cError.message);
    else {
        console.log(`Categories (${categories.length}):`);
        categories.forEach(c => {
            console.log(`- [${c.id}] ${c.name} | Active: ${c.active}`);
        });
    }

    // 3. Fetch Settings
    const { data: settings, error: sError } = await supabase.from('settings').select('*');
    if (sError) console.error('S Error:', sError.message);
    else {
        console.log(`Settings (${settings.length}):`);
        settings.forEach(s => {
            if (s.key.startsWith('nexus_')) {
                console.log(`- ${s.key}: ${s.value.substring(0, 50)}...`);
            }
        });
    }
}

diagnose();
