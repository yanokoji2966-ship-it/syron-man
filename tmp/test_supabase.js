import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.development') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    console.log('--- TESTANDO SUPABASE ---')
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Erro ao buscar pedidos:', error)
    } else {
        console.log(`Encontrados ${orders.length} pedidos recentes.`)
        orders.forEach(o => {
            console.log(`ID: ${o.id} | Data: ${o.created_at} | Cliente: ${o.customer_name}`)
        })
    }
}

test()
