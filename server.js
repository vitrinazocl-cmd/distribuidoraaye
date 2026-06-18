const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { WebpayPlus } = require('transbank-sdk');
require('dotenv').config(); // Cargar variables de entorno

const excelService = require('./excelService'); // Importar el servicio de Excel

// Objeto en memoria para guardar carritos temporales
const ordenesPendientes = new Map();

// Webpay ya viene configurado para el entorno de pruebas (Integration) por defecto.
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir los archivos estáticos de tu frontend actual
app.use(express.static(__dirname));

// ==========================================
// RUTAS DE PRUEBA Y DEBUG
// ==========================================
app.get('/api/estado', (req, res) => {
    res.json({ mensaje: '¡El backend está funcionando correctamente!' });
});

app.get('/api/debug-excel', (req, res) => {
    try {
        const xlsx = require('xlsx');
        const path = require('path');
        const filepath = path.join(__dirname, 'CATALOGO ELEODORO JUNIO 26 ia FINAL.xlsx');
        const workbook = xlsx.readFile(filepath);
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
        res.json({
            columnas_encontradas: Object.keys(data[0] || {}),
            primera_fila: data[0] || {}
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// RUTAS WEBPAY
// ==========================================
app.post('/api/pagar', async (req, res) => {
    try {
        // Validación Legal Horarios en Backend
        const currentHour = new Date().getHours();
        if (currentHour >= 1 && currentHour < 9) {
            return res.status(403).json({ error: 'Las compras están restringidas entre la 01:00 AM y 09:00 AM por cumplimiento legal.' });
        }

        // Recibimos el total, carrito y datos del cliente
        const { total, carrito, cliente } = req.body;
        
        if (!total || !carrito) {
            return res.status(400).json({ error: 'Faltan datos del carrito o el total.' });
        }

        // Generamos un ID de orden y sesión aleatorios
        const buyOrder = "ORDEN-" + Math.floor(Math.random() * 100000);
        const sessionId = "SESION-" + Math.floor(Math.random() * 100000);
        const returnUrl = req.protocol + '://' + req.get('host') + "/api/confirmar-pago";

        // Guardar carrito en memoria asociado a la orden
        ordenesPendientes.set(buyOrder, { carrito, cliente, total });

        // Crear la transacción en Webpay
        const tx = new WebpayPlus.Transaction();
        const response = await tx.create(buyOrder, sessionId, total, returnUrl);

        // Devolvemos la URL y el Token al Frontend para que redirija al usuario
        res.json({
            url: response.url,
            token: response.token
        });

    } catch (error) {
        console.error("Error al iniciar pago en Webpay:", error);
        res.status(500).json({ error: error.message || error.toString() });
    }
});

app.get('/api/confirmar-pago', async (req, res) => {
    try {
        const token = req.query.token_ws;
        const tbkToken = req.query.TBK_TOKEN;
        const buyOrderCanceled = req.query.TBK_ORDEN_COMPRA;
        
        // Si viene TBK_TOKEN pero no token_ws, significa que el usuario anuló la compra
        if (tbkToken && !token) {
            if (buyOrderCanceled) ordenesPendientes.delete(buyOrderCanceled);
            return res.redirect('/index.html?pago=abortado');
        }
        
        if (!token) {
            return res.redirect('/index.html?pago=error');
        }

        // Confirmar la transacción con Webpay usando el Token
        const tx = new WebpayPlus.Transaction();
        const response = await tx.commit(token);

        if (response.status === 'AUTHORIZED') {
            // Pago exitoso
            console.log(`Pago autorizado. Orden: ${response.buy_order}`);
            
            // Recuperar datos de la orden
            const ordenData = ordenesPendientes.get(response.buy_order);
            
            if (ordenData) {
                // Descontar inventario en Excel
                await excelService.actualizarInventario(ordenData.carrito);
                
                // Limpiar de memoria
                ordenesPendientes.delete(response.buy_order);
            } else {
                console.error("Orden pagada pero no se encontraron los datos del carrito en memoria.");
            }

            return res.redirect('/index.html?pago=exito&orden=' + response.buy_order);
        } else {
            // Pago rechazado (sin saldo, etc.)
            ordenesPendientes.delete(response.buy_order);
            return res.redirect('/index.html?pago=rechazado');
        }

    } catch (error) {
        console.error("Error al confirmar pago:", error);
        return res.redirect('/index.html?pago=error');
    }
});

// ==========================================
// ESQUELETO RUTAS BICOM
// ==========================================

// Obtener productos desde Bicom
app.get('/api/bicom/productos', async (req, res) => {
    try {
        const productos = await bicomService.obtenerProductos();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enviar un pedido a Bicom
app.post('/api/bicom/pedidos', async (req, res) => {
    try {
        const pedido = req.body;
        const resultado = await bicomService.crearPedido(pedido);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sincronizar stock
app.get('/api/sincronizar-stock', async (req, res) => {
    try {
        const resultado = await bicomService.sincronizarStock();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// RUTAS DE VENTAS
// ==========================================

const VENTAS_FILE = path.join(__dirname, 'ventas.json');

// Inicializar archivo si no existe
if (!fs.existsSync(VENTAS_FILE)) {
    fs.writeFileSync(VENTAS_FILE, JSON.stringify([]));
}

app.post('/api/guardar-venta', (req, res) => {
    try {
        const venta = req.body;
        const ventasData = JSON.parse(fs.readFileSync(VENTAS_FILE, 'utf-8'));
        ventasData.push(venta);
        fs.writeFileSync(VENTAS_FILE, JSON.stringify(ventasData, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error("Error guardando venta:", error);
        res.status(500).json({ error: "No se pudo guardar la venta" });
    }
});

app.get('/api/ventas', (req, res) => {
    try {
        const ventasData = JSON.parse(fs.readFileSync(VENTAS_FILE, 'utf-8'));
        res.json(ventasData);
    } catch (error) {
        res.status(500).json({ error: "Error leyendo ventas" });
    }
});

app.get('/api/descargar-excel-ventas', (req, res) => {
    try {
        const ventasData = JSON.parse(fs.readFileSync(VENTAS_FILE, 'utf-8'));
        const xlsx = require('xlsx');
        
        // Aplanar los datos para el Excel
        const flatData = ventasData.map(v => {
            const productosString = v.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
            return {
                "ID Orden": v.id,
                "Fecha": v.date,
                "Cliente": v.customerName,
                "Dirección": v.customerAddress,
                "Productos": productosString,
                "Total Venta": v.total
            };
        });

        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(flatData);
        xlsx.utils.book_append_sheet(workbook, worksheet, "Ventas");
        
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Ventas.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error("Error exportando Excel:", error);
        res.status(500).send("Error generando el archivo");
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Servidor Backend iniciado con éxito`);
    console.log(`🌐 Escuchando en el puerto: http://localhost:${PORT}`);
    console.log(`=================================================`);
});
