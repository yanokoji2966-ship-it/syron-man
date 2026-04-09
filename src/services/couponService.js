import { supabase } from '../supabaseClient'
import { adminService } from './adminService'

export const couponService = {
    async getCoupons() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async saveCoupon(couponData) {
        if (!supabase) throw new Error('Supabase não configurado');
        const { data, error } = await supabase
            .from('coupons')
            .upsert(couponData)
            .select();
        if (error) throw error;
        const coupon = data[0];

        // Logar a ação de administrador
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const action = couponData.id ? 'UPDATE_COUPON' : 'CREATE_COUPON';
                await adminService.logAction(user.email, action, {
                    coupon_code: coupon.code,
                    coupon_id: coupon.id
                });
            }
        } catch (e) { console.warn('Falha no log do cupom:', e); }

        return coupon;
    },

    async deleteCoupon(id) {
        if (!supabase) throw new Error('Supabase não configurado');
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);
        if (error) throw error;

        // Logar a exclusão
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await adminService.logAction(user.email, 'DELETE_COUPON', {
                    coupon_id: id
                });
            }
        } catch (e) { console.warn('Falha no log de exclusão de cupom:', e); }

        return true;
    },

    async validateCoupon(code, cartTotal) {
        if (!supabase) throw new Error('Supabase não configurado');

        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !coupon) {
            throw new Error('Cupom inválido ou expirado');
        }

        // Validar limites
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            throw new Error('Este cupom atingiu o limite de uso');
        }

        // Validar data
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            throw new Error('Este cupom expirou');
        }

        // Validar valor mínimo
        if (coupon.min_purchase_value && cartTotal < coupon.min_purchase_value) {
            throw new Error(`Valor mínimo para este cupom: R$ ${coupon.min_purchase_value.toFixed(2)}`);
        }

        return coupon;
    },

    async incrementUsage(id) {
        if (!supabase) return;
        const { error } = await supabase.rpc('increment_coupon_usage', { coupon_id: id });
        if (error) console.error('Erro ao incrementar uso do cupom:', error);
    }
}
