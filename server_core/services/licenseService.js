import { supabase } from '../supabase.js';

// Hidden System Signature (Obfuscated)
const _0x4a2b = ["U1lST04tQ09SRS1TRUNVUkUtMjAyNg=="];
export const SYS_SIG = Buffer.from(_0x4a2b[0], 'base64').toString('ascii');

let licenseStatus = {
    valid: false,
    expired: false,
    grace: false,
    soft_blocked: false, // Bloqueio parcial (48h)
    hard_blocked: false, // Bloqueio total
    days_to_expiry: 0,
    status: 'idle', 
    message: 'Sistema não inicializado',
    client: null,
    db_failed: false // Flag de falha de conexão
};

const SECRET_SALT = 'SYRON-MAN-CORE-SALT-2026';

/**
 * Logs license events to the database with IP/UA
 */
async function logLicenseEvent(key, event, message, req = null) {
    try {
        const logData = {
            license_key: key,
            event: event,
            message: message
        };

        if (req) {
            logData.ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            logData.user_agent = req.headers['user-agent'];
        }

        await supabase.from('license_logs').insert([logData]);
    } catch (e) {
        console.warn('Falha ao registrar log de licença:', e.message);
    }
}

/**
 * Validates the system signature and license with a safety timeout
 */
export async function validateLicense() {
    try {
        console.log('🛡️ Verificando Assinatura do Sistema...');

        // Timeout de 10s para evitar que boot lento trave o servidor
        const dbTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Database Timeout')), 10000));

        // 1. Verify System Signature
        const sigPromise = supabase
            .from('system_signature')
            .select('*')
            .eq('signature_key', _0x4a2b[0])
            .single();

        const { data: sigData, error: sigError } = await Promise.race([sigPromise, dbTimeout]);

        if (sigError || !sigData) {
            console.warn('⚠️ AVISO: Assinatura do sistema não encontrada ou inválida.');
            
            // Se for Localhost, a gente considera válido por padrão para não travar o dev
            if (!process.env.VERCEL) {
                licenseStatus.valid = true;
                licenseStatus.status = 'active';
                licenseStatus.message = 'Licença Ativa (Dev Mode)';
                return licenseStatus;
            }

            licenseStatus.valid = false;
            licenseStatus.message = 'Assinatura Inválida';
            return licenseStatus;
        }

        // 2. Verify License
        const licensePromise = supabase
            .from('licenses')
            .select('*')
            .order('expires_at', { ascending: false })
            .limit(1);

        const { data: licenseData, error: licenseError } = await Promise.race([licensePromise, dbTimeout]);

        if (licenseError || !licenseData || licenseData.length === 0) {
            console.warn('⚠️ AVISO: Nenhuma licença encontrada.');
            licenseStatus.valid = false;
            licenseStatus.status = 'expired';
            licenseStatus.message = 'Licença Não Encontrada';
            return licenseStatus;
        }

        const activeLicense = licenseData[0];
        const now = new Date();
        const expirationDate = activeLicense.expires_at ? new Date(activeLicense.expires_at) : null;
        const graceDate = activeLicense.grace_until ? new Date(activeLicense.grace_until) : (expirationDate ? new Date(expirationDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null);

        // Domain Protection
        // No backend, o hostname geral vem de req.hostname, mas aqui estamos no startup
        // A validação de domínio será feita no middleware restrictIfExpired

        if (activeLicense.status === 'suspended') {
            licenseStatus.valid = false;
            licenseStatus.status = 'suspended';
            licenseStatus.message = 'Licença Suspensa';
            await logLicenseEvent(activeLicense.license_key, 'violation', 'Licença suspensa detectada.');
        } else if (expirationDate && now > expirationDate) {
            if (graceDate && now <= graceDate) {
                console.warn(`⚠️ MODO GRACE: Licença expirou em ${expirationDate}, mas operando em período de carência até ${graceDate}.`);
                licenseStatus.valid = true;
                licenseStatus.expired = true;
                licenseStatus.grace = true;
                licenseStatus.status = 'grace';
                licenseStatus.message = 'Modo de Carência';
                licenseStatus.client = activeLicense.client_name;
                await logLicenseEvent(activeLicense.license_key, 'expired', 'Operando em período de carência (Grace Period).');
            } else {
                console.warn(`🚫 LICENÇA EXPIROU: O sistema para ${activeLicense.client_name} expirou totalmente em ${expirationDate}.`);
                licenseStatus.valid = true;
                licenseStatus.expired = true;
                licenseStatus.grace = false;
                licenseStatus.status = 'expired';
                licenseStatus.message = 'Licença Expirada';
                licenseStatus.client = activeLicense.client_name;

                // Progressive Enforcement: 48h after expiration
                const blockThreshold = new Date(expirationDate.getTime() + 48 * 60 * 60 * 1000);
                if (now > blockThreshold) {
                    licenseStatus.hard_blocked = true;
                } else {
                    licenseStatus.soft_blocked = true;
                }

                await logLicenseEvent(activeLicense.license_key, 'expired', licenseStatus.hard_blocked ? 'Bloqueio Total ativado (>48h).' : 'Bloqueio Parcial ativado (<48h).');
            }
        } else {
            licenseStatus.valid = true;
            licenseStatus.expired = false;
            licenseStatus.grace = false;
            licenseStatus.status = 'active';
            licenseStatus.message = 'Licença Ativa';
            licenseStatus.client = activeLicense.client_name;
            licenseStatus.domain = activeLicense.domain;

            if (expirationDate) {
                const diffTime = expirationDate.getTime() - now.getTime();
                licenseStatus.days_to_expiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        return licenseStatus;
    } catch (error) {
        console.error('❌ Erro na validação de licença:', error.message);
        
        // MODO DE RECUPERAÇÃO: Se o banco falhar, a gente marca como válido temporariamente 
        // para não travar o cliente por causa de instabilidade no Supabase/Vercel
        licenseStatus.valid = true;
        licenseStatus.db_failed = true;
        licenseStatus.status = 'active';
        licenseStatus.message = 'Modo de Recuperação (Banco Instável)';
        
        return licenseStatus;
    }
}

/**
 * Returns the current license status
 */
export function getLicenseStatus() {
    return licenseStatus;
}

/**
 * Middleware to restrict admin features if license is expired
 */
export function restrictIfExpired(req, res, next) {
    const currentHost = req.hostname;
    
    // Domain Protection
    if (licenseStatus.domain && currentHost && !currentHost.includes(licenseStatus.domain) && currentHost !== 'localhost') {
        logLicenseEvent(null, 'violation', `Violação de Domínio: ${currentHost}`, req);
        return res.status(403).json({ 
            error: 'Ação indisponível.', 
            details: 'O plano não está autorizado para este endereço.',
            licenseStatus: 'violation'
        });
    }

    if (licenseStatus.status === 'suspended') {
        return res.status(403).json({ 
            error: 'Ação indisponível.',
            details: 'Seu plano foi suspenso manualmente.',
            licenseStatus: 'suspended'
        });
    }

    // 48h Rule: Soft Restriction
    if (licenseStatus.hard_blocked) {
        return res.status(403).json({ 
            error: 'Ação indisponível.',
            details: 'Seu plano expirou há mais de 48h. Por favor, renove para continuar.',
            licenseStatus: 'expired'
        });
    }

    // Se estiver Expired mas < 48h, a gente bloqueia produtos/analytics mas libera Orders (para consulta)
    if (licenseStatus.soft_blocked) {
        const restrictedPaths = ['/api/products', '/api/analytics', '/api/settings'];
        const isRestricted = restrictedPaths.some(p => req.originalUrl.startsWith(p)) && req.method !== 'GET';
        const isAnalytics = req.originalUrl.startsWith('/api/analytics');

        if (isRestricted || isAnalytics) {
            return res.status(403).json({ 
                error: 'Ação indisponível.',
                details: 'Seu plano expirou. Acesso restrito a consultas de pedidos por 48h.',
                licenseStatus: 'expired'
            });
        }
    }
    
    if (!licenseStatus.valid && licenseStatus.message !== 'Sistema não inicializado') {
        // Developer Bypass: Se for localhost, a gente loga o erro mas deixa passar para não travar o desenvolvimento
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            console.warn('⚠️ BYPASS ATIVADO: Assinatura inválida detectada, mas permitida em localhost.');
            return next();
        }

        return res.status(403).json({ 
            error: 'Ação indisponível.', 
            details: 'Assinatura do sistema inválida.',
            licenseStatus: 'invalid'
        });
    }

    next();
}
