import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpSettings() {
    const { data: settings, error } = await supabase.from('settings').select('*');
    if (error) {
        console.error(error);
    } else {
        fs.writeFileSync('tmp/settings_full_dump.json', JSON.stringify(settings, null, 2));
        console.log(`Dumped ${settings.length} settings.`);
    }
}

dumpSettings();
