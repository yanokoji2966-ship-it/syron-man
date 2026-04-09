import nodemailer from 'nodemailer';
import { supabase } from '../supabase.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'suportesyronman@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

/**
 * Envia notificação de novo pedido para todos os administradores
 */
export const sendOrderNotification = async (order, items) => {
    // Se não tiver senha de app, avisa no log e pula
    if (!process.env.EMAIL_APP_PASSWORD) {
        console.warn('⚠️ Alerta: EMAIL_APP_PASSWORD não configurado. Notificação de e-mail pulada.');
        return;
    }

    // 1. Buscar todos os e-mails de administradores no banco
    let adminEmails = ['suportesyronman@gmail.com']; // Fallback fixo
    try {
        const { data: admins } = await supabase.from('admin_users').select('email');
        if (admins && admins.length > 0) {
            adminEmails = admins.map(a => a.email);
        }
        console.log(`📧 Notificando ${adminEmails.length} administradores via e-mail.`);
    } catch (e) {
        console.warn('⚠️ Falha ao buscar lista de administradores, usando fallback:', e.message);
    }

    const itemsHtml = items.map(item => `
        <li>
            <strong>${item.product_name}</strong> - Qtd: ${item.quantity} - Tamanho: ${item.size || 'M'} - Preço: R$ ${parseFloat(item.unit_price).toFixed(2)}
        </li>
    `).join('');

    const mailOptions = {
        from: `"SYRON MAN Notifications" <${process.env.EMAIL_USER || 'suportesyronman@gmail.com'}>`,
        to: adminEmails.join(', '), // Envia para todos
        subject: `💎 NOVO PEDIDO: ${order.order_number}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
                <h2 style="color: #7000ff; text-align: center;">NOVA VENDA CONFIRMADA! 💎</h2>
                <p>Um novo pedido acaba de ser realizado na plataforma <strong>SYRON MAN</strong>.</p>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                
                <h3 style="color: #333;">Dados do Pedido:</h3>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Número:</strong> ${order.order_number}</li>
                    <li><strong>Cliente:</strong> ${order.customer_name}</li>
                    <li><strong>E-mail:</strong> ${order.customer_email}</li>
                    <li><strong>WhatsApp:</strong> ${order.customer_phone}</li>
                    <li><strong>Método:</strong> ${order.payment_method}</li>
                    <li style="margin-top: 10px; font-size: 18px;"><strong>Total: R$ ${parseFloat(order.total).toFixed(2)}</strong></li>
                </ul>

                <hr style="border: 0; border-top: 1px solid #eee;" />
                
                <h3 style="color: #333;">Itens:</h3>
                <ul>
                    ${itemsHtml}
                </ul>

                <hr style="border: 0; border-top: 1px solid #eee;" />
                
                <div style="text-align: center; margin-top: 20px;">
                    <a href="${process.env.BASE_URL || 'http://localhost:5173'}/#orders" style="background: #7000ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Ver no Painel Admin
                    </a>
                </div>

                <p style="text-align: center; font-size: 12px; color: #777; margin-top: 30px;">
                    Notificação automática enviada pelo Motor NEXUS de Vendas.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Notificação de e-mail enviada:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail de notificação:', error.message);
        // Não jogamos o erro para cima para não quebrar a finalização do pedido no frontend
        return null;
    }
};
