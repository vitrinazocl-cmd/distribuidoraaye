const { WebpayPlus } = require('transbank-sdk');

async function testWebpay() {
    try {
        const apiBase = process.env.API_BASE || 'http://localhost:3000';
        const tx = new WebpayPlus.Transaction();
        const response = await tx.create("O-123", "S-123", 1000, `${apiBase}/api/confirmar-pago`);
        console.log("Exito:", response);
    } catch (error) {
        console.error("Fallo:", error);
    }
}
testWebpay();
