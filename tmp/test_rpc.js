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

async function testRpc() {
    console.log('--- TESTANDO RPC get_admin_orders_v1 ---')
    try {
        const { data, error } = await supabase.rpc('get_admin_orders_v1')
        if (error) {
            console.error('ERRO RPC:', error)
        } else {
            console.log(`Sucesso! Recebidos ${data?.length || 0} pedidos via RPC.`)
            if (data?.length > 0) {
                console.log('Exemplo do primeiro pedido:', JSON.stringify(data[0], null, 2).substring(0, 200) + '...')
            }
        }
    } catch (e) {
        console.error('EXCEÇÃO AO CHAMAR RPC:', e)
    }
}

testRpc()
