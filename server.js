const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { WebpayPlus } = require('transbank-sdk');
require('dotenv').config(); // Cargar variables de entorno

const excelService = require('./excelService'); // Importar el servicio de Excel
const whatsappService = require('./whatsappService'); // Importar el servicio de WhatsApp

// Objeto en memoria para guardar carritos temporales
const ordenesPendientes = new Map();

// Webpay ya viene configurado para el entorno de pruebas (Integration) por defecto.
const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
let pool = DATABASE_URL
    ? new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    })
    : null;

function isDbEnabled() {
    return Boolean(pool);
}

// Configuración de middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper para obtener cookies del request
function getCookie(req, name) {
    const list = {};
    const rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            if (parts.length >= 2) {
                list[parts.shift().trim()] = decodeURI(parts.join('='));
            }
        });
    }
    return list[name];
}

// Middleware de autenticación antes de servir archivos estáticos administrativos
app.use((req, res, next) => {
    const filePath = req.path.toLowerCase();
    if (filePath.endsWith('pedidos.html') || filePath.endsWith('ventas.html')) {
        const token = getCookie(req, 'admin_session');
        if (token !== 'combate_authenticated_token') {
            return res.redirect('/index.html?error=no_auth');
        }
    }
    next();
});

// Servir los archivos estáticos de tu frontend actual
app.use(express.static(__dirname));

// ==========================================
// RUTA RAÍZ - SERVIR INDEX.HTML
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// RUTAS DE PRUEBA Y DEBUG
// ==========================================
app.get('/api/estado', (req, res) => {
    res.json({
        mensaje: '¡El backend está funcionando correctamente!',
        almacenamiento: isDbEnabled() ? 'postgres' : 'json'
    });
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

// Cargar configuración de Transbank desde archivo JSON si existe
let transbankConfig = {};
try {
    const configPath = path.join(__dirname, 'transbank_config.json');
    if (fs.existsSync(configPath)) {
        transbankConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (err) {
    console.error("Error cargando transbank_config.json:", err);
}

// Helper para obtener la instancia de WebpayPlus con configuración dinámica
function getWebpayTransaction() {
    const commerceCode = process.env.WEBPAY_COMMERCE_CODE || transbankConfig.WEBPAY_COMMERCE_CODE;
    const apiKey = process.env.WEBPAY_API_KEY || transbankConfig.WEBPAY_API_KEY;
    const webpayEnv = process.env.WEBPAY_ENV || transbankConfig.WEBPAY_ENV;

    if (commerceCode && apiKey) {
        const { Options, Environment } = require('transbank-sdk');
        const env = webpayEnv === 'production' 
            ? Environment.Production 
            : Environment.Integration;
        const options = new Options(
            commerceCode,
            apiKey,
            env
        );
        return new WebpayPlus.Transaction(options);
    }
    return new WebpayPlus.Transaction();
}

// ==========================================
// RUTAS WEBPAY
// ==========================================
app.post('/api/pagar', async (req, res) => {
    try {
        // Recibimos el total, carrito y datos del cliente
        const { total, carrito, cliente } = req.body;
        
        if (!total || !carrito) {
            return res.status(400).json({ error: 'Faltan datos del carrito o el total.' });
        }

        // Generamos un ID de orden y sesión aleatorios
        const buyOrder = "ORDEN-" + Math.floor(Math.random() * 100000);
        const sessionId = "SESION-" + Math.floor(Math.random() * 100000);
        const apiBase = process.env.API_BASE || transbankConfig.API_BASE || (req.protocol + '://' + req.get('host'));
        const returnUrl = `${apiBase}/api/confirmar-pago`;

        // Guardar carrito en memoria asociado a la orden
        ordenesPendientes.set(buyOrder, { carrito, cliente, total });

        // Crear la transacción en Webpay
        const tx = getWebpayTransaction();
        const response = await tx.create(buyOrder, sessionId, total, returnUrl);

        console.log(`[Webpay] Transacción Creada - Orden: ${buyOrder}, Total: ${total}, Token: ${response.token}`);

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

app.all('/api/confirmar-pago', async (req, res) => {
    try {
        const token = req.query.token_ws || req.body.token_ws;
        const tbkToken = req.query.TBK_TOKEN || req.body.TBK_TOKEN;
        const buyOrderCanceled = req.query.TBK_ORDEN_COMPRA || req.body.TBK_ORDEN_COMPRA;
        
        // Si viene TBK_TOKEN pero no token_ws, significa que el usuario anuló la compra
        if (tbkToken && !token) {
            console.log(`[Webpay] Pago ANULADO por el usuario - Orden: ${buyOrderCanceled}, Token: ${tbkToken}`);
            if (buyOrderCanceled) ordenesPendientes.delete(buyOrderCanceled);
            return res.redirect('/index.html?pago=abortado');
        }
        
        if (!token) {
            console.log(`[Webpay] Error - No se recibió token_ws`);
            return res.redirect('/index.html?pago=error');
        }

        console.log(`[Webpay] Confirmando transacción. Token recibido: ${token}`);

        // Confirmar la transacción con Webpay usando el Token
        const tx = getWebpayTransaction();
        const response = await tx.commit(token);

        // 1. Recuperar datos de la orden que guardamos en memoria al iniciar el pago
        const ordenData = ordenesPendientes.get(response.buy_order);

        // 2. Validación de seguridad requerida por Transbank:
        // Verificar que la orden exista en nuestros registros y que el monto pagado coincida con el esperado
        if (!ordenData) {
            console.error(`[Webpay] ERROR SEGURIDAD: Se intentó confirmar la orden ${response.buy_order} pero no existe en los registros pendientes.`);
            return res.redirect('/index.html?pago=error&detalle=orden_no_encontrada');
        }

        if (Number(response.amount) !== Number(ordenData.total)) {
            console.error(`[Webpay] ERROR SEGURIDAD: El monto pagado en Webpay ($${response.amount}) no coincide con el total esperado ($${ordenData.total}) para la orden ${response.buy_order}.`);
            ordenesPendientes.delete(response.buy_order); // Limpiar por seguridad
            return res.redirect('/index.html?pago=error&detalle=monto_descalzado');
        }

        if (response.status === 'AUTHORIZED') {
            // Pago exitoso y verificado
            console.log(`[Webpay] Pago AUTORIZADO y VERIFICADO - Orden: ${response.buy_order}, Token: ${token}`);
            
            // Descontar inventario en Excel
            try {
                await excelService.actualizarInventario(ordenData.carrito);
            } catch (err) {
                console.error("[Webpay] Error descontando inventario:", err.message);
            }
            
            // Registrar la venta en PostgreSQL o ventas.json directamente en el backend
            const nuevaVenta = {
                id: response.buy_order,
                date: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
                isoDate: new Date().toISOString(),
                customerName: ordenData.cliente.nombre || 'Sin Nombre',
                customerAddress: ordenData.cliente.direccion || 'Sin Dirección',
                items: ordenData.carrito,
                total: ordenData.total,
                estado: 'pendiente'
            };

            try {
                await saveVenta(nuevaVenta);
                console.log(`[Webpay] Venta registrada con éxito en backend para Orden: ${response.buy_order}`);
            } catch (err) {
                console.error("[Webpay] Error registrando la venta en backend:", err.message);
            }

            // Enviar notificación automática por WhatsApp en segundo plano (evita demoras al redirigir al cliente)
            whatsappService.enviarNotificacionPedido(nuevaVenta)
                .catch(err => console.error("[WhatsApp] Error en el envío de la notificación:", err.message));
            
            // Limpiar de memoria
            ordenesPendientes.delete(response.buy_order);

            return res.redirect('/index.html?pago=exito&orden=' + response.buy_order);
        } else {
            // Pago rechazado (sin saldo, etc.)
            console.log(`[Webpay] Pago RECHAZADO - Orden: ${response.buy_order}, Estado: ${response.status}, Token: ${token}`);
            ordenesPendientes.delete(response.buy_order);
            return res.redirect('/index.html?pago=rechazado');
        }

    } catch (error) {
        console.error("Error al confirmar pago:", error);
        return res.redirect('/index.html?pago=error');
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

async function initDatabase() {
    if (!pool) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ventas (
                id TEXT PRIMARY KEY,
                fecha TEXT,
                isodate TIMESTAMPTZ,
                customername TEXT,
                customeraddress TEXT,
                items JSONB,
                total NUMERIC,
                createdat TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        // Asegurar que exista la columna estado para bases de datos existentes
        await pool.query(`
            ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente'
        `);
    } catch (error) {
        console.error('No se pudo conectar a PostgreSQL. Se usará ventas.json como respaldo:', error.message);
        pool = null;
    }
}

function readVentasFromJson() {
    return JSON.parse(fs.readFileSync(VENTAS_FILE, 'utf-8'));
}

function writeVentaToJson(venta) {
    const ventasData = readVentasFromJson();
    if (!venta.estado) {
        venta.estado = 'pendiente';
    }
    ventasData.push(venta);
    fs.writeFileSync(VENTAS_FILE, JSON.stringify(ventasData, null, 2));
}

async function saveVenta(venta) {
    if (!isDbEnabled()) {
        writeVentaToJson(venta);
        return;
    }

    await pool.query(
        `INSERT INTO ventas (id, fecha, isodate, customername, customeraddress, items, total, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
            venta.id,
            venta.date || null,
            venta.isoDate || new Date().toISOString(),
            venta.customerName || null,
            venta.customerAddress || null,
            JSON.stringify(venta.items || []),
            venta.total || 0,
            venta.estado || 'pendiente'
        ]
    );
}

async function getVentas() {
    if (!isDbEnabled()) {
        return readVentasFromJson();
    }

    const result = await pool.query(
        `SELECT id, fecha, isodate, customername, customeraddress, items, total, estado
         FROM ventas
         ORDER BY isodate DESC NULLS LAST, createdat DESC`
    );

    return result.rows.map((row) => ({
        id: row.id,
        date: row.fecha,
        isoDate: row.isodate ? new Date(row.isodate).toISOString() : null,
        customerName: row.customername,
        customerAddress: row.customeraddress,
        items: row.items || [],
        total: Number(row.total || 0),
        estado: row.estado || 'pendiente'
    }));
}

// Endpoint de login seguro en el servidor
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    const adminUser = process.env.ADMIN_USER || 'combate';
    const adminPass = process.env.ADMIN_PASS || '12345';

    if (user === adminUser && pass === adminPass) {
        res.cookie('admin_session', 'combate_authenticated_token', {
            maxAge: 24 * 60 * 60 * 1000 // 1 día
        });
        return res.json({ success: true });
    } else {
        return res.status(401).json({ error: "Credenciales incorrectas" });
    }
});

// Endpoint para obtener solo pedidos pendientes
app.get('/api/pedidos-pendientes', async (req, res) => {
    try {
        const token = getCookie(req, 'admin_session');
        if (token !== 'combate_authenticated_token') {
            return res.status(401).json({ error: "No autorizado" });
        }
        const ventasData = await getVentas();
        const pendientes = ventasData.filter(v => v.estado === 'pendiente');
        res.json(pendientes);
    } catch (error) {
        res.status(500).json({ error: "Error leyendo pedidos pendientes" });
    }
});

// Endpoint para actualizar estado de un pedido (despachar/entregar)
app.post('/api/actualizar-estado-pedido', async (req, res) => {
    try {
        const token = getCookie(req, 'admin_session');
        if (token !== 'combate_authenticated_token') {
            return res.status(401).json({ error: "No autorizado" });
        }
        const { id, estado } = req.body;
        if (!id || !estado) {
            return res.status(400).json({ error: "Falta ID o Estado" });
        }

        if (isDbEnabled()) {
            await pool.query(
                `UPDATE ventas SET estado = $1 WHERE id = $2`,
                [estado, id]
            );
        } else {
            const ventasData = readVentasFromJson();
            const venta = ventasData.find(v => v.id === id);
            if (venta) {
                venta.estado = estado;
                fs.writeFileSync(VENTAS_FILE, JSON.stringify(ventasData, null, 2));
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error actualizando estado del pedido:", error);
        res.status(500).json({ error: "No se pudo actualizar el estado del pedido" });
    }
});

// Para mantener compatibilidad si es necesario
app.post('/api/guardar-venta', async (req, res) => {
    try {
        const venta = req.body;
        await saveVenta(venta);
        res.json({ success: true });
    } catch (error) {
        console.error("Error guardando venta:", error);
        res.status(500).json({ error: "No se pudo guardar la venta" });
    }
});

app.get('/api/ventas', async (req, res) => {
    try {
        const token = getCookie(req, 'admin_session');
        if (token !== 'combate_authenticated_token') {
            return res.status(401).json({ error: "No autorizado" });
        }
        const ventasData = await getVentas();
        res.json(ventasData);
    } catch (error) {
        res.status(500).json({ error: "Error leyendo ventas" });
    }
});

app.get('/api/descargar-excel-ventas', async (req, res) => {
    try {
        const token = getCookie(req, 'admin_session');
        if (token !== 'combate_authenticated_token') {
            return res.status(401).send("No autorizado");
        }
        const ventasData = await getVentas();
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
                "Total Venta": v.total,
                "Estado": v.estado || 'pendiente'
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
initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`=================================================`);
            console.log(`🚀 Servidor Backend iniciado con éxito`);
            console.log(`🌐 Escuchando en el puerto: http://localhost:${PORT}`);
            console.log(`💾 Almacenamiento: ${isDbEnabled() ? 'PostgreSQL (Render)' : 'ventas.json (local)'}`);
            console.log(`=================================================`);
        });
    });
