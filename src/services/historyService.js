const STORAGE_KEY = 'styleman_recently_viewed';
const MAX_ITEMS = 12;

export const historyService = {
    addToHistory(productId) {
        if (!productId) return;
        
        try {
            const history = this.getHistory();
            
            // Remove if already exists (to move to front)
            const filteredHistory = history.filter(id => id !== productId);
            
            // Add to front
            const newHistory = [productId, ...filteredHistory].slice(0, MAX_ITEMS);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Error adding to history:', error);
        }
    },

    getHistory() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    },

    clearHistory() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
