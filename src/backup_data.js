/* 
   Script de Backup Automático/Manual
   
   Como usar:
   1. Abra o Terminal e navegue até a pasta src
   2. Rode o comando: node backup_data.js
   
   Este script se conectará ao seu banco de dados Supabase e 
   baixará todo o JSON de configurações, categorias, produtos e pedidos.
*/

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

// Resolve directory name in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função auxiliar para carregar as variáveis de ambiente baseadas no aquivo .env
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        console.error('Arquivo .env não encontrado. Execute este script na raiz do projeto onde o .env está localizado.');
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            env[match[1]] = match[2];
        }
    });
    return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Credenciais do Supabase não encontradas no arquivo .env');
    process.exit(1);
}

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Accept': 'application/json'
};

const tablesToBackup = ['products', 'categories', 'orders', 'order_items', 'settings'];
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(__dirname, `../backups/backup_${timestamp}`);

// Garantir que a pasta de backup exista
if (!fs.existsSync(path.resolve(__dirname, '../backups'))) {
    fs.mkdirSync(path.resolve(__dirname, '../backups'));
}
fs.mkdirSync(backupDir, { recursive: true });

console.log(`Iniciando o Backup do Sistema - ${new Date().toLocaleString('pt-BR')}`);

async function performBackup() {
    let hasError = false;

    for (const table of tablesToBackup) {
        console.log(`> Baixando dados da tabela: [${table}]...`);
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers });

            if (!response.ok) {
                console.error(`  [ERRO] Falha ao baixar [${table}]: ${response.status} ${response.statusText}`);
                hasError = true;
                continue;
            }

            const data = await response.json();
            const filePath = path.join(backupDir, `${table}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`  [OK] ${data.length} registros salvos em ${table}.json`);

        } catch (error) {
            console.error(`  [ERRO] Falha crítica na tabela [${table}]:`, error.message);
            hasError = true;
        }
    }

    if (hasError) {
        console.log('\n⚠️ Backup concluído com erros. Verifique os logs acima.');
    } else {
        console.log(`\n✅ Backup Concluído com Sucesso!`);
        console.log(`📁 Localização: ${backupDir}`);
    }
}

performBackup();
