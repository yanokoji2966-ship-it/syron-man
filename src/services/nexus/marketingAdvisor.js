import { supabase } from '../../supabaseClient';

export const generateProductDescription = async (productData) => {
    // Em uma implementação real, isso chamaria o aiService (Ollama)
    // Por enquanto, retornaremos um template premium otimizado
    const { name, material, category, features } = productData;

    return `
    ✨ Descubra a Exclusividade: ${name} ✨
    
    Eleve seu estilo com o melhor da moda masculina SYRON MAN. 
    Este item da categoria ${category} foi desenvolvido para o homem moderno que não abre mão de conforto e sofisticação.
    
    💎 Destaques do Produto:
    - Material Premium: ${material || 'Alta Qualidade'}
    - Design Exclusivo SYRON
    - Caimento Impecável
    
    ${features ? `🚀 Características Principais:\n${features}` : ''}
    
    Garanta agora uma peça que combina durabilidade e elegância atemporal.
  `.trim();
};

export const suggestMarketingActions = async (stalledProducts) => {
    return stalledProducts.map(p => ({
        productId: p.id,
        productName: p.name,
        suggestions: [
            "Gerar Cupom de 10% (NEXUS-SAVE10)",
            "Destacar na Home como 'Seleção Especial'",
            "Redução leve de preço (Flash Sale)"
        ]
    }));
};
