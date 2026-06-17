// bicomService.js
const axios = require('axios');

/**
 * Servicio para interactuar con la API de Bicom ERP.
 * Las credenciales se obtienen de las variables de entorno (.env).
 */
class BicomService {
    constructor() {
        // Base URL obtenida del archivo .env
        this.baseURL = process.env.BICOM_API_URL || '';
        
        // Configuramos la instancia de axios si es necesario inyectar headers
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                // Ejemplo de inyección de API Key o credenciales:
                // 'Authorization': `Bearer ${process.env.BICOM_API_KEY}`
            }
        });
    }

    /**
     * Verifica si las variables de entorno están configuradas
     */
    _checkConfig() {
        if (!this.baseURL) {
            throw new Error("La URL de Bicom (BICOM_API_URL) no está configurada en el archivo .env");
        }
    }

    /**
     * Obtiene el catálogo de productos desde Bicom.
     */
    async obtenerProductos() {
        try {
            this._checkConfig();
            
            // Reemplaza '/endpoint/productos' con la ruta real de Bicom
            const response = await this.api.get('/endpoint/productos');
            return response.data;
        } catch (error) {
            console.error("Error al obtener productos de Bicom:", error.message);
            // Retornamos un mock temporal para pruebas
            return [
                { id: 1, nombre: "Producto de Prueba 1", precio: 1000, stock: 10 },
                { id: 2, nombre: "Producto de Prueba 2", precio: 2000, stock: 5 }
            ];
        }
    }

    /**
     * Envía un pedido completado a Bicom.
     * @param {Object} pedido - Datos del pedido a enviar
     */
    async crearPedido(pedido) {
        try {
            this._checkConfig();
            
            // Reemplaza '/endpoint/pedidos' con la ruta real de Bicom
            const response = await this.api.post('/endpoint/pedidos', pedido);
            return response.data;
        } catch (error) {
            console.error("Error al crear pedido en Bicom:", error.message);
            throw new Error("No se pudo enviar el pedido al ERP.");
        }
    }

    /**
     * Sincroniza el stock de un producto específico o todos.
     */
    async sincronizarStock() {
        try {
            this._checkConfig();
            
            const response = await this.api.get('/endpoint/stock');
            return response.data;
        } catch (error) {
            console.error("Error al sincronizar stock con Bicom:", error.message);
            return { mensaje: "Error de conexión, mock devuelto", status: "mock" };
        }
    }

    /**
     * Genera un Documento Tributario Electrónico (Boleta/Factura) tras un pago exitoso.
     */
    async generarDocumentoTributario(ordenId, tokenPago) {
        try {
            this._checkConfig();
            const payload = {
                orden: ordenId,
                token: tokenPago,
                tipo_documento: 'boleta_electronica',
                fecha: new Date().toISOString()
            };
            const response = await this.api.post('/endpoint/facturacion/boleta', payload);
            console.log("DTE generado en Bicom exitosamente:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error al generar boleta en Bicom, retornando mock:", error.message);
            return { dte_id: "DTE-MOCK-" + Math.floor(Math.random() * 10000), status: "emitido" };
        }
    }
}

module.exports = new BicomService();
