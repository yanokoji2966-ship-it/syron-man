import { supabase } from '../supabaseClient'
import { PRODUCTS } from '../data'

import { withResilience, ensureSession, compressImage, apiFetch } from './serviceUtils';
import { adminService } from './adminService';

const mockProducts = PRODUCTS;

export const productService = {
    async getProducts(onlyActive = true) {
        return apiFetch(`/api/products?activeOnly=${onlyActive}`, {}, { name: 'Listar Produtos' });
    },

    async getCategories() {
        return apiFetch('/api/products/categories', {}, { name: 'Listar Categorias' }).then(data => {
            // Deduplica categorias por nome ignorando maiúsculas/minúsculas, espaços e acentos
            const uniqueCategories = [];
            const seenNames = new Set();

            if (data && Array.isArray(data)) {
                data.forEach(cat => {
                    if (!cat || !cat.name) return;

                    // Repara problemas clássicos de encoding no DB
                    let fixedName = cat.name
                        .replace(/Ã§/g, 'ç')
                        .replace(/Ã³/g, 'ó')
                        .replace(/Ã£/g, 'ã')
                        .replace(/Ã¡/g, 'á')
                        .replace(/Ã©/g, 'é')
                        .replace(/Ã¢/g, 'â')
                        .replace(/Ã/g, 'í');

                    const normalizedName = fixedName
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, "")
                        .trim()
                        .toLowerCase();

                    if (!seenNames.has(normalizedName)) {
                        seenNames.add(normalizedName);
                        uniqueCategories.push({ ...cat, name: fixedName });
                    }
                });
            }
            return uniqueCategories;
        });
    },

    async saveProduct(productData, onProgress = null) {
        // Validação preventiva de sessão
        if (onProgress) onProgress('Verificando chaves de segurança...');
        const hasSession = await ensureSession();
        if (!hasSession && !productData.id) {
            console.warn('SaveProduct: Sessão instável detectada.');
            if (onProgress) onProgress('⚠️ Sessão instável. O salvamento pode ser bloqueado pelo backend.');
        }

        return apiFetch('/api/products/save', {
            method: 'POST',
            body: JSON.stringify(productData)
        }, { 
            name: 'Salvar Produto (Padrão Elite)', 
            timeout: 120000, 
            retries: 2, 
            onProgress 
        });
    },

    async testConnection(onProgress = null) {
        if (!supabase) return { ok: false, message: 'Supabase não inicializado' };

        return withResilience(async () => {
            if (onProgress) onProgress('Testando canal de dados SQL...');
            console.log('ProductService: [TEST] Testando conexão com Supabase...');
            const start = Date.now();
            const { data, error } = await supabase.from('products').select('id', { count: 'exact', head: true }).limit(1);
            const duration = Date.now() - start;

            if (error) throw error;
            if (onProgress) onProgress(`Canal SQL OK (${duration}ms).`);
            return { ok: true, duration, message: `Conexão OK (${duration}ms)` };
        }, { timeout: 45000, name: 'Teste de Conexão SQL', retries: 2, onProgress });
    },

    async deleteProduct(productId) {
        return apiFetch(`/api/products/${productId}`, {
            method: 'DELETE'
        }, { name: 'Excluir Produto (Segurança Backend)' });
    },

    async uploadImage(file, onProgress = null) {
        if (!supabase) throw new Error('Supabase não configurado');

        const initialSizeMB = (file.size / (1024 * 1024)).toFixed(2);

        if (onProgress) onProgress(`Otimizando imagem (${initialSizeMB}MB) para internet lenta...`);

        // Comprime a imagem antes de enviar
        const finalFile = await compressImage(file, { maxWidth: 1200, quality: 0.7 });
        const finalSizeMB = (finalFile.size / (1024 * 1024)).toFixed(2);

        const startMsg = `ProductService: [TRANSFER] Redução: ${initialSizeMB}MB -> ${finalSizeMB}MB. Iniciando envio...`;
        console.log(startMsg);
        if (onProgress) onProgress(startMsg);

        return withResilience(async () => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const storageMsg = `ProductService: [STORAGE] Canal de arquivos aberto...`;
            console.log(storageMsg);
            if (onProgress) onProgress(storageMsg);

            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(filePath, finalFile);

            if (error) {
                console.error('ProductService: [ERRO STORAGE]', error);
                if (error.status === 403 || error.message?.toLowerCase().includes('policy')) {
                    throw new Error('Acesso Negado: Certifique-se de que rodou o STORAGE_SETUP.sql no Supabase.');
                }
                throw error;
            }

            console.log('ProductService: [SUCESSO] Upload finalizado.');
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            return publicUrl;
        }, { timeout: 420000, name: 'Upload de Imagem', retries: 3, onProgress });
    },

    async incrementViewCount(productId) {
        if (!supabase) return;
        try {
            const { error } = await supabase.rpc('increment_product_view', { product_id: productId });
            if (error) console.error('Erro ao incrementar visualização:', error);
        } catch (e) {
            console.error('Erro RPC de visualização:', e);
        }
    },

    async getReviews(productId) {
        return apiFetch(`/api/reviews/${productId}`, {}, { name: 'Listar Avaliações' });
    },

    async saveReview(productId, reviewData) {
        return apiFetch(`/api/reviews/${productId}`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        }, { name: 'Salvar Avaliação' });
    },

    async getRecommendations(productId) {
        return apiFetch(`/api/recommendations/${productId}`, {}, { name: 'Buscar Recomendações' });
    }
}
