import { supabase } from '../supabaseClient';

/**
 * HealthMonitor: Sistema de Observabilidade da SYRON MAN
 * Responsável por logs de erro, métricas de performance e alertas de checkout.
 */
class HealthMonitor {
    constructor() {
        this.isInitialized = !!supabase;
        this.buffer = [];
    }

    /**
     * Loga um erro técnico centralizado.
     */
    async logError(error, context = {}) {
        console.error(`[SYRON HLTH] Error: ${error.message}`, context);

        return this._saveLog({
            type: 'ERROR',
            message: error.message,
            severity: context.severity || 'LOW',
            metadata: {
                stack: error.stack,
                url: window.location.href,
                userAgent: navigator.userAgent,
                ...context
            }
        });
    }

    /**
     * Monitora falhas ou sucessos críticos no Checkout.
     */
    async trackCheckout(status, details = {}) {
        const type = status === 'success' ? 'SYSTEM' : 'CHECKOUT_FAILURE';
        const message = status === 'success' ? 'Checkout concluído com sucesso' : 'Falha no processamento do checkout';

        return this._saveLog({
            type,
            message,
            severity: status === 'success' ? 'LOW' : 'HIGH',
            metadata: {
                status,
                ...details
            }
        });
    }

    /**
     * Registra métricas de performance (tempo de resposta, etc).
     */
    async measurePerformance(metricName, value, metadata = {}) {
        return this._saveLog({
            type: 'PERFORMANCE',
            message: `Métrica: ${metricName}`,
            metadata: {
                metricName,
                value,
                ...metadata
            }
        });
    }

    /**
     * Método interno para persistência no Supabase.
     */
    async _saveLog(payload) {
        if (!this.isInitialized) return;

        try {
            const { error } = await supabase
                .from('system_health_logs')
                .insert([payload]);

            if (error) throw error;
        } catch (e) {
            console.warn('[SYRON HLTH] Failed to persist log:', e.message);
        }
    }
}

export const healthMonitor = new HealthMonitor();
