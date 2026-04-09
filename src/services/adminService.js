import { supabase } from '../supabaseClient';
import { withResilience } from './serviceUtils';

/**
 * Serviço para gerenciar a lista de administradores no Supabase
 */
export const adminService = {
    /**
     * Busca a lista de todos os emails de administradores
     */
    async getAdmins() {
        if (!supabase) return [];
        return withResilience(async () => {
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        }, { timeout: 45000, name: 'Buscar Administradores', retries: 2 });
    },

    async addAdmin(email) {
        if (!supabase) throw new Error('Supabase não configurado');
        return withResilience(async () => {
            const cleanEmail = email.toLowerCase().trim();
            // Tenta usar a RPC segura (SUPER_RESET_ADMIN) primeiro
            const { data: rpcData, error: rpcError } = await supabase.rpc('add_admin_v1', {
                email_param: cleanEmail,
                role_param: 'admin'
            });

            if (!rpcError) return rpcData;

            // Fallback (caso o script RPC não tenha sido rodado no painel Supabase)
            console.warn('RPC add_admin_v1 falhou. Tentando insert direto...', rpcError);
            const { data, error } = await supabase
                .from('admin_users')
                .insert([{ email: cleanEmail }])
                .select()
                .single();

            if (error) throw error;
            return data;
        }, { timeout: 45000, name: 'Adicionar Admin' });
    },

    async removeAdmin(id) {
        if (!supabase) throw new Error('Supabase não configurado');

        // Tenta usar a RPC segura primeiro
        const { error: rpcError } = await supabase.rpc('remove_admin_v1', {
            admin_id_param: id
        });

        if (!rpcError) return true;

        console.warn('RPC remove_admin_v1 falhou. Tentando delete direto...', rpcError);
        const { error } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Registra uma ação administrativa no log de auditoria
     */
    async logAction(email, action, details = {}) {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('admin_logs')
                .insert([{
                    admin_email: email,
                    action: action,
                    details: details
                }]);
            if (error) throw error;
            return data;
        } catch (e) {
            console.warn('Falha ao registrar log:', e.message);
            return null;
        }
    },

    /**
     * Busca os últimos logs de auditoria
     */
    async getLogs(limit = 50) {
        if (!supabase) return [];
        return withResilience(async () => {
            const { data, error } = await supabase
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        }, { timeout: 45000, name: 'Buscar Logs' });
    },

    /**
     * Adiciona uma nova despesa operacional
     */
    async addExpense(expense) {
        if (!supabase) throw new Error('Supabase não configurado');
        const { data: { user } } = await supabase.auth.getUser();

        return withResilience(async () => {
            const { data, error } = await supabase
                .from('admin_expenses')
                .insert([{
                    ...expense,
                    admin_email: user?.email
                }])
                .select();

            if (error) throw error;

            await this.logAction(user?.email, 'Ajuste Financeiro', {
                type: 'expense_added',
                description: expense.description,
                amount: expense.amount,
                category: expense.category
            });

            return data[0];
        }, { timeout: 45000, name: 'Adicionar Despesa' });
    },

    /**
     * Busca todas as despesas
     */
    async getExpenses() {
        if (!supabase) return [];
        return withResilience(async () => {
            const { data, error } = await supabase
                .from('admin_expenses')
                .select('*')
                .order('expense_date', { ascending: false });

            if (error) throw error;
            return data || [];
        }, { timeout: 60000, name: 'Buscar Despesas' });
    },

    /**
     * Remove uma despesa pelo ID
     */
    async deleteExpense(id, description) {
        if (!supabase) throw new Error('Supabase não configurado');
        const { data: { user } } = await supabase.auth.getUser();

        return withResilience(async () => {
            const { error } = await supabase
                .from('admin_expenses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Registrar no histórico operacional
            await this.logAction(user?.email, 'Ajuste Financeiro', {
                type: 'expense_deleted',
                description: description
            });
            return true;
        }, { timeout: 45000, name: 'Deletar Despesa' });
    }
};
