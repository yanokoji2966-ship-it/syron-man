import { nexusConfig } from '../../config/nexus.config';

export const prepareLogisticsPayload = (order) => {
    const { customer_name, shipping_address, order_items, id, region } = order;

    // Selecionar entregador por região (ou primeiro disponível se não bater)
    const driver = nexusConfig.deliveryDrivers.find(d => d.region === region) || nexusConfig.deliveryDrivers[0];

    return {
        orderId: id,
        status: 'Ready for Separation',
        assignedDriver: driver.name,
        messagePayload: {
            recipient: driver.whatsapp,
            text: `🚀 Novo Pedido para Entrega!\n\nCliente: ${customer_name}\nEndereço: ${shipping_address}\nPedido #${id.substring(0, 8)}\nRegião: ${region || 'Não informada'}\n\nFavor confirmar recebimento.`
        }
    };
};
