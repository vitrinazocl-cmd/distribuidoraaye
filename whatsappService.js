const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cargar configuración de Transbank/WhatsApp desde transbank_config.json si existe
let config = {};
try {
    const configPath = path.join(__dirname, 'transbank_config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (err) {
    console.error("[WhatsApp] Error cargando transbank_config.json:", err);
}

async function enviarNotificacionPedido(pedido) {
    const telefono = process.env.WHATSAPP_PHONE || config.WHATSAPP_PHONE || '+56989784973';
    const apiKey = process.env.WHATSAPP_API_KEY || config.WHATSAPP_API_KEY;

    if (!apiKey) {
        console.warn("[WhatsApp] Advertencia: WHATSAPP_API_KEY no configurada. El mensaje no se enviará. Configúrala en transbank_config.json.");
        return;
    }

    const itemsStr = pedido.items.map(item => `• ${item.quantity}x ${item.name}${item.flavor ? ` (Sabor: ${item.flavor})` : ''}`).join('\n');
    const totalCLP = pedido.total.toLocaleString('es-CL');
    const metodoEnvio = pedido.customerAddress === 'Retiro en Tienda' ? '🏪 Retiro en Tienda' : '🚚 Despacho a Domicilio';

    let msg = `🔔 *¡NUEVO PEDIDO APROBADO!*\n\n`;
    msg += `*Orden ID:* ${pedido.id}\n`;
    msg += `*Fecha:* ${pedido.date}\n`;
    msg += `*Cliente:* ${pedido.customerName}\n`;
    msg += `*Método:* ${metodoEnvio}\n`;
    if (pedido.customerAddress !== 'Retiro en Tienda') {
        msg += `*Dirección:* ${pedido.customerAddress}\n`;
    }
    msg += `\n*Detalle de Productos:*\n${itemsStr}\n\n`;
    msg += `*Total Pagado:* $${totalCLP}\n`;

    try {
        // CallMeBot requiere el teléfono en formato internacional sin el signo "+"
        const cleanPhone = telefono.replace('+', '').trim();
        // Bugfix: CallMeBot interpreta "$" seguido de números como variables PHP vacías y las elimina.
        // Añadir un espacio después del "$" protege los caracteres y números.
        const safeMsg = msg.replace(/\$/g, '$ ');
        const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(safeMsg)}&apikey=${apiKey}`;
        
        console.log(`[WhatsApp] Intentando enviar notificación a ${cleanPhone}...`);
        const response = await axios.get(url);
        console.log(`[WhatsApp] Notificación enviada con éxito. Código de estado: ${response.status}`);
    } catch (error) {
        console.error(`[WhatsApp] Error al enviar el mensaje de notificación:`, error.message);
    }
}

module.exports = { enviarNotificacionPedido };
