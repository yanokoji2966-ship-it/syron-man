import { apiFetch } from './serviceUtils';

/**
 * Serviço especializado para gestão de categorias dinâmicas.
 */
export const categoryService = {
    /**
     * Busca todas as categorias (incluindo inativas se for admin)
     */
    async getAllCategories(adminMode = false) {
        return apiFetch(`/api/products/categories?adminMode=${adminMode}&t=${Date.now()}`, {}, { name: 'Listar Categorias' });
    },

    /**
     * Salva ou atualiza uma categoria
     */
    async saveCategory(categoryData) {
        return apiFetch('/api/products/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        }, { name: 'Salvar Categoria' });
    },

    /**
     * Exclui uma categoria
     */
    async deleteCategory(id) {
        return apiFetch(`/api/products/categories/${id}`, {
            method: 'DELETE'
        }, { name: 'Excluir Categoria' }).then(() => true);
    },

    /**
     * Atualiza a ordem de múltiplas categorias
     * @param {Array} orderedIds - Lista de IDs na ordem desejada
     */
    async updateOrder(orderedIds) {
        return apiFetch('/api/products/categories/order', {
            method: 'PATCH',
            body: JSON.stringify({ orderedIds })
        }, { name: 'Atualizar Ordem das Categorias' }).then(() => true);
    },

    /**
     * Alterna o status ativo/inativo
     */
    async toggleActive(id, currentStatus) {
        return apiFetch(`/api/products/categories/${id}/toggle`, {
            method: 'PATCH',
            body: JSON.stringify({ currentStatus })
        }, { name: 'Alternar Status da Categoria' }).then(data => data.active);
    }
};
