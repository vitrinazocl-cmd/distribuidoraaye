const fs = require('fs');
const path = require('path');

// Rutas de archivos
const csvPath = path.join(__dirname, 'libros de venta', 'inventario a&e.csv');
const catalogoPath = path.join(__dirname, 'catalogo.js');
const imgDir = path.join(__dirname, 'nuevo catalogo', 'stock productos');

// Función para normalizar texto (quitar acentos, caracteres raros, minúsculas)
function normalizeText(text) {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

try {
    // 1. Leer las imágenes disponibles
    const imageFiles = fs.readdirSync(imgDir);
    const normalizedImages = imageFiles.map(filename => ({
        original: filename,
        normalized: normalizeText(filename)
    }));

    // 2. Leer el CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    const productos = [];
    
    // Ignorar la primera línea de cabecera
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(';');
        // CODIGO(0); DESCRIPCION(1); MARCA(2); CONTENIDO(3); UNIDADES(4); PRECIO(5); STOCK(6); AROMAS(7)
        if (cols.length >= 6) {
            const id = cols[0].trim() || `PROD_${i}`;
            const desc = cols[1].trim();
            const marca = cols[2] ? cols[2].trim() : "";
            const unidades = cols[4].trim();
            
            // Procesar el precio limpiando signos $ y puntos
            const precioRaw = cols[5].trim().replace(/\$|\./g, '');
            const precioPorCaja = parseInt(precioRaw) || 0;
            
            if (desc && precioPorCaja > 0) {
                // Generar nombre completo del producto
                let nombreProducto = desc;
                if (marca) nombreProducto += ` ${marca}`;
                if (unidades && unidades !== "1" && unidades.toLowerCase() !== "0") {
                    nombreProducto += ` (Caja x${unidades})`;
                }
                
                // --- Algoritmo de emparejamiento de imagen ---
                const searchString = normalizeText(`${desc} ${marca}`);
                const searchWords = searchString.split(' ');
                
                let bestMatch = null;
                let maxScore = 0;
                
                for (const img of normalizedImages) {
                    let score = 0;
                    for (const word of searchWords) {
                        if (word.length > 2 && img.normalized.includes(word)) {
                            score += word.length; // Dar más peso a palabras largas
                        }
                    }
                    if (score > maxScore) {
                        maxScore = score;
                        bestMatch = img.original;
                    }
                }
                
                // Asignar la imagen encontrada o un logo por defecto si no hay coincidencia
                const finalImagePath = bestMatch && maxScore > 0 
                    ? `nuevo catalogo/stock productos/${encodeURIComponent(bestMatch)}` 
                    : `nuevo catalogo/logo.jpg.jpeg`;
                
                productos.push({
                    id: id,
                    name: nombreProducto,
                    marca: marca,
                    price: precioPorCaja,
                    category: "TODOS",
                    image: finalImagePath,
                    flavors: []
                });
            }
        }
    }

    // 3. Escribir el nuevo catálogo
    const catalogoContent = `const catalogoProductos = ${JSON.stringify(productos, null, 4)};\n\n// Hacer el catálogo accesible globalmente\nif (typeof window !== 'undefined') {\n    window.catalogoProductos = catalogoProductos;\n}\n`;
    
    fs.writeFileSync(catalogoPath, catalogoContent, 'utf8');
    console.log("¡Éxito! catalogo.js actualizado con " + productos.length + " productos.");

} catch (err) {
    console.error("Error procesando el archivo:", err.message);
}
