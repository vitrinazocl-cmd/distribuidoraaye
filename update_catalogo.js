const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'libros de venta', 'inventario a&e.csv');
const catalogoPath = path.join(__dirname, 'catalogo.js');

try {
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
            const unidades = cols[4].trim();
            const precioRaw = cols[5].trim().replace(/\$|\./g, '');
            const precio = parseInt(precioRaw) || 0;
            
            if (desc && precio > 0) {
                // Nombre = Descripcion + (Unidades por caja)
                const nombreProducto = `${desc} (Caja x${unidades})`;
                
                productos.push({
                    id: id,
                    name: nombreProducto,
                    price: precio,
                    category: "TODOS", // Categoría por defecto ya que el Excel no tiene
                    image: "nuevo%20catalogo/logo.jpg.jpeg",
                    flavors: []
                });
            }
        }
    }

    const catalogoContent = `const catalogoProductos = ${JSON.stringify(productos, null, 4)};\n\n// Hacer el catálogo accesible globalmente\nif (typeof window !== 'undefined') {\n    window.catalogoProductos = catalogoProductos;\n}\n`;
    
    fs.writeFileSync(catalogoPath, catalogoContent, 'utf8');
    console.log("¡Éxito! catalogo.js actualizado con " + productos.length + " productos.");

} catch (err) {
    console.error("Error procesando el CSV:", err.message);
}
