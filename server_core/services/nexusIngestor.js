import fs from 'fs';
import path from 'path';
import { supabase } from '../supabase.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de Caminhos
const INCOMING_DIR = "C:/Users/otaci/OneDrive/Área de Trabalho/style man - Copia/produtos";
const BACKUP_DIR = path.join(INCOMING_DIR, '_backup');

/**
 * NEXUS Flash Ingestor
 * Monitora uma pasta local e cria produtos automaticamente no SYRON MAN
 */
export const initNexusIngestor = () => {
    console.log('⚡ NEXUS: Iniciando Flash Ingestor...');
    console.log(`📂 Monitorando: ${INCOMING_DIR}`);

    // Criar diretórios se não existirem
    if (!fs.existsSync(INCOMING_DIR)) {
        try {
            fs.mkdirSync(INCOMING_DIR, { recursive: true });
        } catch (e) {
            console.error('❌ NEXUS: Erro ao criar pasta de entrada:', e.message);
        }
    }

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Varredura inicial
    processFolder();

    // Watcher (Polling simples para evitar problemas com rede/OneDrive)
    setInterval(processFolder, 10000); // A cada 10 segundos
};

async function processFolder() {
    try {
        const files = fs.readdirSync(INCOMING_DIR);
        const images = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

        if (images.length > 0) {
            console.log(`🔍 NEXUS: Encontrados ${images.length} novos arquivos para processar.`);

            for (const file of images) {
                await ingestProduct(file);
            }
        }
    } catch (error) {
        console.error('❌ NEXUS Ingestor Loop Error:', error.message);
    }
}

async function ingestProduct(filename) {
    const filePath = path.join(INCOMING_DIR, filename);
    const backupPath = path.join(BACKUP_DIR, filename);

    try {
        console.log(`🚀 NEXUS: Processando "${filename}"...`);

        // 1. Gerar nome do produto a partir do arquivo
        // "Camiseta_Oversized_Preta.jpg" -> "Camiseta Oversized Preta"
        const productName = filename
            .split('.')
            .slice(0, -1)
            .join('.')
            .replace(/_/g, ' ')
            .replace(/-/g, ' ');

        // 2. Upload para Storage
        const fileBuffer = fs.readFileSync(filePath);
        const storagePath = `products/nexus_${Date.now()}_${filename}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(storagePath, fileBuffer, {
                contentType: `image/${filename.split('.').pop()}`
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(storagePath);

        // 3. Criar no Banco de Dados
        const { data: product, error: dbError } = await supabase
            .from('products')
            .insert({
                name: productName,
                image_url: publicUrl,
                price: 0, // Preço inicial zerado para revisão
                is_active: false, // Inativo até revisão
                description: `Produto importado automaticamente pelo NEXUS Flash Ingestor em ${new Date().toLocaleDateString('pt-BR')}.`,
                stock_quantity: 0
            })
            .select()
            .single();

        if (dbError) throw dbError;

        console.log(`✅ NEXUS: Produto "${productName}" criado com sucesso! ID: ${product.id}`);

        // 4. Mover para Backup
        fs.renameSync(filePath, backupPath);

    } catch (error) {
        console.error(`❌ NEXUS: Erro ao processar "${filename}":`, error.message);
        // Se falhou, movemos para uma pasta de erro ou deixamos lá? 
        // Vamos deixar lá para nova tentativa, mas com um prefixo de erro para não travar o loop
        try {
            const errorDir = path.join(INCOMING_DIR, '_errors');
            if (!fs.existsSync(errorDir)) fs.mkdirSync(errorDir);
            fs.renameSync(filePath, path.join(errorDir, `error_${Date.now()}_${filename}`));
        } catch (e) {
            console.error('Falha ao mover arquivo de erro:', e.message);
        }
    }
}
