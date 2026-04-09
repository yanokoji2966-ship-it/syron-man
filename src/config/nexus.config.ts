export const nexusConfig = {
  ownerWhatsApp: "5511999999999", // Configurar número real
  deliveryDrivers: [
    {
      name: "Entregador 1",
      whatsapp: "5511888888888",
      region: "Zona Sul"
    },
    {
      name: "Entregador 2",
      whatsapp: "5511777777777",
      region: "Zona Norte"
    }
  ],
  suppliers: [
    {
      name: "Fornecedor 1",
      category: "roupas masculinas",
      whatsapp: "5511666666666",
      leadTimeDays: 7
    },
    {
      name: "Fornecedor 2",
      category: "acessórios",
      whatsapp: "5511555555555",
      leadTimeDays: 5
    }
  ],
  stockSettings: {
    minStock: 10,
    defaultMargin: 0.6
  }
};
