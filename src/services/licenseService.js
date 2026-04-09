import { apiFetch } from './serviceUtils';

/**
 * Service to handle license status monitoring on the frontend
 */
export const licenseService = {
    /**
     * Fetches current license status from backend
     */
    async getStatus() {
        try {
            return await apiFetch('/api/license/status', {}, { name: 'Verificar Licença' });
        } catch (error) {
            console.warn('Silent license check failed:', error.message);
            return { valid: false, status: 'error', message: 'Erro de Conexão', client: null };
        }
    }
};
