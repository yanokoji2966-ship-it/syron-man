import { supabase } from '../supabaseClient';

/**
 * Utilitário para executar promessas com Timeout e Retentativas automáticas
 * @param {Promise} promise - A promessa original
 * @param {Object} options - Configurações
 * @param {number} options.timeout - Tempo em ms para timeout (default 30s)
 * @param {number} options.retries - Número de tentativas extras (default 1)
 * @param {string} options.name - Nome da operação para os logs
 * @returns {Promise}
 */
export const withResilience = async (promiseFn, { timeout = 30000, retries = 3, name = 'Operação', onProgress = null } = {}) => {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const startTime = Date.now();
        if (attempt > 0) {
            const msg = `Resiliência: Retentando ${name} (Tentativa ${attempt}/${retries}) em rede lenta...`;
            console.warn(msg);
            if (onProgress) onProgress(msg);
            // Delay mais longo entre retentativas para conexões instáveis
            await new Promise(r => setTimeout(r, 3000 * attempt));
        } else {
            if (onProgress) onProgress(`Iniciando ${name}...`);
        }

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout: ${name} demorou mais de ${timeout / 1000}s. Sua conexão pode estar instável.`)), timeout)
            );

            // Chamamos a função para gerar uma nova promessa em cada tentativa
            const result = await Promise.race([promiseFn(), timeoutPromise]);
            const duration = Date.now() - startTime;
            const successMsg = `Resiliência: ${name} concluída com sucesso em ${duration}ms.`;
            console.log(successMsg);
            if (onProgress) onProgress(successMsg);
            return result;
        } catch (error) {
            lastError = error;
            const duration = Date.now() - startTime;
            const errMsg = `Resiliência: Falha em ${name} (${duration}ms): ${error.message}`;
            console.error(errMsg);
            if (onProgress) onProgress(errMsg);

            // Se for um erro de rede ou timeout, a gente tenta de novo.
            // Se for erro de sintaxe SQL ou 404, não adianta tentar.
            const isRetryable = error.message?.includes('Timeout') ||
                error.message?.includes('network') ||
                error.message?.includes('Fetch') ||
                error.message?.includes('failed') ||
                error.status === 502 ||
                error.status === 503 ||
                error.status === 504;

            if (!isRetryable) throw error;
        }
    }

    throw lastError;
};

/**
 * Valida a sessão antes de operações críticas
 */
export const ensureSession = async () => {
    if (!supabase) return false;
    try {
        // Timeout de 5s para evitar que a verificação de sessão trave o resto
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session verify timeout')), 5000)
        );
        const { data: { session }, error } = await Promise.race([
            supabase.auth.getSession(),
            timeoutPromise
        ]);
        if (error || !session) {
            console.warn('Sessão inválida ou expirada detectada.');
            return false;
        }
        return true;
    } catch (e) {
        console.warn('Erro ao validar sessão:', e.message);
        return false;
    }
};

/**
 * Comprime uma imagem antes do upload para economizar banda
 * @param {File} file - Arquivo original
 * @returns {Promise<File>}
 */
export const compressImage = async (file, { maxWidth = 800, quality = 0.8 } = {}) => {
    if (!file || !file.type.startsWith('image/')) return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth * height) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    blob => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                                type: 'image/webp',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/webp',
                    0.8
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

/**
 * Helper centralizado para chamadas de API internas (/api/...)
 */
// Cache global para o token de sessão para evitar overhead de getSession em requisições paralelas
let cachedToken = null;
let lastTokenFetch = 0;
const TOKEN_CACHE_MS = 10000; // 10 segundos de cache

/**
 * Helper centralizado para chamadas de API internas (/api/...)
 */
export const apiFetch = async (endpoint, options = {}, resilienceOptions = {}) => {
    const defaultResilience = {
        name: `API ${endpoint}`,
        timeout: endpoint.includes('/settings') ? 20000 : 45000, // Configurações falham mais rápido para não travar UI
        retries: 1
    };

    return withResilience(async () => {
        // Obter token de sessão com cache
        let authHeaders = {};
        const now = Date.now();
        
        try {
            if (!cachedToken || (now - lastTokenFetch > TOKEN_CACHE_MS)) {
                const { data: { session } } = await supabase.auth.getSession();
                cachedToken = session?.access_token || null;
                lastTokenFetch = now;
            }
            
            if (cachedToken) {
                authHeaders['Authorization'] = `Bearer ${cachedToken}`;
            }
        } catch (e) { 
            console.warn('apiFetch: Falha ao obter sessão, procedendo anonimamente'); 
        }

        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro HTTP ${response.status} em ${endpoint}`);
        }

        return await response.json();
    }, { ...defaultResilience, ...resilienceOptions });
};

