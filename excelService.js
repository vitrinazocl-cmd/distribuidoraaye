const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_PATH = path.join(__dirname, 'CATALOGO ELEODORO JUNIO 26 ia FINAL.xlsx');

/**
 * Encuentra el nombre de la columna que contiene los IDs o Nombres de los productos.
 */
function findIdColumn(headers) {
    const possibleNames = ['ID', 'SKU', 'CODIGO', 'NOMBRE', 'PRODUCTO', 'ARTICULO'];
    for (const name of possibleNames) {
        const found = headers.find(h => h.toUpperCase().includes(name));
        if (found) return found;
    }
    // Fallback: usar la primera columna
    return headers[0];
}

/**
 * Encuentra el nombre de la columna de inventario/stock.
 */
function findStockColumn(headers) {
    const possibleNames = ['STOCK', 'CANTIDAD', 'INVENTARIO', 'DISPONIBLE'];
    for (const name of possibleNames) {
        const found = headers.find(h => h.toUpperCase().includes(name));
        if (found) return found;
    }
    // Fallback: asumir que es alguna columna que no sea el ID
    return null;
}

/**
 * Descuenta el inventario basado en los productos del carrito
 * @param {Array} carrito Array de productos comprados [{id, name, quantity}]
 */
async function actualizarInventario(carrito) {
    if (!carrito || carrito.length === 0) return;

    try {
        console.log("Intentando actualizar Excel...");
        // Verificar si el archivo existe
        if (!fs.existsSync(EXCEL_PATH)) {
            console.error(`El archivo ${EXCEL_PATH} no existe.`);
            return;
        }

        // Leer el archivo Excel
        const workbook = xlsx.readFile(EXCEL_PATH);
        const sheetName = workbook.SheetNames[0]; // Usar la primera hoja
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir la hoja a JSON para poder manipularla fácilmente
        const data = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (data.length === 0) {
            console.log("El archivo Excel está vacío.");
            return;
        }

        // Obtener los nombres de las columnas
        const headers = Object.keys(data[0]);
        const idCol = findIdColumn(headers);
        const stockCol = findStockColumn(headers);

        if (!stockCol) {
            console.error("No se pudo encontrar una columna de Stock/Cantidad en el Excel.");
            return;
        }

        let actualizados = 0;

        // Recorrer el carrito y descontar
        for (const item of carrito) {
            // Buscar la fila correspondiente en el Excel
            // Buscamos coincidencia ya sea por ID o por Nombre del producto en el carrito
            const rowIndex = data.findIndex(row => {
                const rowValue = String(row[idCol]).toUpperCase();
                
                let searchId = String(item.id).toUpperCase();
                // Adaptación especial para la Jaba Mixta: 
                // Aunque en el carrito se llame JABAMIX-5-2-3, en el Excel buscaremos la fila JM10
                if (searchId.startsWith('JABAMIX')) {
                    searchId = 'JM10';
                }

                return rowValue === searchId || 
                       rowValue.includes(String(item.name).toUpperCase());
            });

            if (rowIndex !== -1) {
                // Producto encontrado, descontar el stock
                let currentStock = parseFloat(data[rowIndex][stockCol]);
                if (isNaN(currentStock)) currentStock = 0;
                
                let newStock = currentStock - item.quantity;
                if (newStock < 0) newStock = 0; // Evitar stock negativo

                data[rowIndex][stockCol] = newStock;
                actualizados++;
                console.log(`Descontado ${item.quantity} de ${item.name}. Nuevo stock: ${newStock}`);
            } else {
                console.log(`Producto ${item.name} no encontrado en el Excel para descontar.`);
            }
        }

        if (actualizados > 0) {
            // Convertir JSON de vuelta a hoja de Excel
            const newWorksheet = xlsx.utils.json_to_sheet(data);
            workbook.Sheets[sheetName] = newWorksheet;
            
            // Guardar archivo
            xlsx.writeFile(workbook, EXCEL_PATH);
            console.log("Excel guardado y stock actualizado correctamente.");
        } else {
            console.log("Ningún producto del carrito coincidió con el Excel. No se guardó.");
        }

    } catch (error) {
        console.error("Error al actualizar el Excel:", error);
    }
}

module.exports = {
    actualizarInventario
};
