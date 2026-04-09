import fs from 'fs';

const products = JSON.parse(fs.readFileSync('tmp/products_debug.json', 'utf8'));
const categories = JSON.parse(fs.readFileSync('tmp/categories_debug.json', 'utf8'));

// Simulating App.jsx logic
function simulateFilter(selectedCategory = null, searchQuery = '') {
    let filtered = products;
    if (selectedCategory) {
        filtered = filtered.filter(p => {
            const cat = categories.find(c => c.id === selectedCategory);
            if (!cat) return false;

            const targetName = cat.name.toLowerCase();
            const prodCatName = (p.category_name || p.category || '').toLowerCase();

            return p.category_id === selectedCategory ||
                prodCatName === targetName ||
                targetName.includes(prodCatName) ||
                prodCatName.includes(targetName);
        });
    }
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered;
}

console.log('--- FILTER SIMULATION ---');
console.log('All products:', products.length);
console.log('Filtered (No filter):', simulateFilter(null, '').length);

// Check if it matches any category
categories.forEach(cat => {
    const matched = simulateFilter(cat.id, '');
    console.log(`Filter by [${cat.name}]: Found ${matched.length}`);
});
