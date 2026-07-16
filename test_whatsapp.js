const { enviarNotificacionPedido } = require('./whatsappService');

// Simular un pedido de prueba
const pedidoPrueba = {
    id: "TEST-99999",
    date: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
    customerName: "Juan Pérez (Prueba)",
    customerAddress: "El Parrón 331, Pudahuel",
    items: [
        { quantity: 2, name: "Detergente Líquido A&E 5 Litros" },
        { quantity: 1, name: "Cloro Gel Excell 1 Litro" }
    ],
    total: 8500
};

console.log("=================================================");
console.log("🚀 Iniciando prueba de envío de WhatsApp...");
console.log("=================================================");

enviarNotificacionPedido(pedidoPrueba)
    .then(() => {
        console.log("=================================================");
        console.log("Prueba finalizada. Revisa tu celular.");
        console.log("=================================================");
    });
