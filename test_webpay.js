const { WebpayPlus } = require('transbank-sdk');

async function testWebpay() {
    try {
        const tx = new WebpayPlus.Transaction();
        const response = await tx.create("O-123", "S-123", 1000, "http://localhost:3000/api/confirmar-pago");
        console.log("Exito:", response);
    } catch (error) {
        console.error("Fallo:", error);
    }
}
testWebpay();
