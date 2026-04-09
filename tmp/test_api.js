import fetch from 'node-fetch';

async function testApi() {
    console.log('--- API TEST ---');
    try {
        const response = await fetch('http://localhost:3001/api/products?activeOnly=false');
        if (!response.ok) {
            console.error('API Error:', response.status);
            return;
        }
        const data = await response.json();
        console.log(`API returned ${data.length} products.`);
        data.forEach(p => console.log(`- ${p.name} (Active: ${p.is_active})`));
    } catch (e) {
        console.error('Fetch failed (is server running?):', e.message);
    }
}

testApi();
