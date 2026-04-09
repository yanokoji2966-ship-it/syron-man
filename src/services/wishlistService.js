import { supabase } from '../supabaseClient';

/**
 * Serviço de favoritos persistente no banco de dados.
 * Funciona apenas para usuários logados.
 */
export const wishlistService = {

    /** Buscar todos os favoritos do usuário logado */
    async getFavorites(userId) {
        if (!supabase || !userId) return [];
        try {
            const { data, error } = await supabase
                .from('wishlists')
                .select('product_id, products(*)')
                .eq('user_id', userId);
            if (error) throw error;
            return (data || []).map(w => w.products).filter(Boolean);
        } catch (err) {
            console.error('wishlistService: Erro ao buscar favoritos:', err);
            return [];
        }
    },

    /** Verificar se um produto está nos favoritos */
    async isFavorite(userId, productId) {
        if (!supabase || !userId || !productId) return false;
        try {
            const { data } = await supabase
                .from('wishlists')
                .select('id')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .maybeSingle();
            return !!data;
        } catch {
            return false;
        }
    },

    /** Adicionar produto aos favoritos */
    async addFavorite(userId, productId) {
        if (!supabase || !userId || !productId) return;
        const { error } = await supabase
            .from('wishlists')
            .insert({ user_id: userId, product_id: productId });
        if (error && error.code !== '23505') throw error; // ignora duplicado
    },

    /** Remover produto dos favoritos */
    async removeFavorite(userId, productId) {
        if (!supabase || !userId || !productId) return;
        const { error } = await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);
        if (error) throw error;
    },

    /** Toggle (add/remove) */
    async toggleFavorite(userId, productId) {
        const fav = await this.isFavorite(userId, productId);
        if (fav) {
            await this.removeFavorite(userId, productId);
            return false;
        } else {
            await this.addFavorite(userId, productId);
            return true;
        }
    }
};
