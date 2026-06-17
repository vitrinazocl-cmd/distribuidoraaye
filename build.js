const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'catalogo productos', 'CATALOGO ELEODORO JUNIO 26.csv');
const jsPath = path.join(__dirname, 'catalogo.js');

try {
    const csvContent = fs.readFileSync(csvPath, 'latin1'); // Use latin1 or utf8 depending on BOM
    const lines = csvContent.split('\n');
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(';');
        if (parts.length < 5) continue;

        const codigo = parts[0].trim();
        const descripcion = parts[1].trim().replace(/"/g, '');
        const precioStr = parts[4].trim().replace(/\./g, '');
        const precio = parseInt(precioStr) || 0;

        const descUpper = descripcion.toUpperCase();
        let category = 'OTROS';

        if (descUpper.match(/AGUA|CACHANTUN|BENECDITINO|VITAL/)) category = 'AGUA';
        else if (descUpper.match(/CERVEZA|CRISTAL|ESCUDO|ROYAL|CORONA|BAVARIA|SOL|HEINEKEN|KUNSTMANN/)) category = 'CERVEZA';
        else if (descUpper.match(/PISCO|WHISKY|RON|VODKA|GIN|TEQUILA|ESPUMANTE|ALTO DEL CARMEN|MISTRAL/)) category = 'LICORES';
        else if (descUpper.match(/RED BULL|MONSTER|SCORE|ENERGY/)) category = 'ENERGÉTICAS';
        else category = 'BEBIDAS';

        // Set dynamic placeholder using placehold.co so it shows the product description on the image
        const placeholderText = encodeURIComponent(descripcion);
        const image = `https://placehold.co/400x400/eeeeee/333333?text=${placeholderText}`;

        products.push(`{ id: "${codigo}", name: "${descripcion}", price: ${precio}, category: "${category}", image: "${image}" }`);
    }

    const jsContent = `const catalogoProductos = [\n${products.join(',\n')}\n];\n`;
    fs.writeFileSync(jsPath, jsContent, 'utf8');
    console.log('Catalogo generado exitosamente con ' + products.length + ' productos.');
} catch (e) {
    console.error('Error generating catalog:', e);
}
