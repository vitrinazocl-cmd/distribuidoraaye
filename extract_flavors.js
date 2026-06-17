const xlsx = require('xlsx');
const fs = require('fs');

try {
    const workbook = xlsx.readFile('CATALOGO ELEODORO JUNIO 26 ia.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const flavorsData = [];
    data.forEach(row => {
        // Encontrar la columna de descripción
        const nameKey = Object.keys(row).find(k => k.toUpperCase().includes('DESCRIPCION') || k.toUpperCase() === 'PRODUCTO');
        const name = row[nameKey] || Object.values(row)[0];
        
        const flavors = [];
        for (const key in row) {
            // Las columnas de sabores parecen llamarse "valor 1", "valor 2", "sabor 1", etc.
            if (key.toLowerCase().includes('valor') || key.toLowerCase().includes('sabor')) {
                const val = row[key];
                if (val && typeof val === 'string' && val.trim() !== '') {
                    flavors.push(val.trim());
                }
            }
        }
        
        if (name && flavors.length > 0) {
            flavorsData.push({ name, flavors });
        }
    });

    fs.writeFileSync('sabores_extraidos.json', JSON.stringify(flavorsData, null, 2));
    console.log('¡Sabores extraídos con éxito! Revisa el archivo sabores_extraidos.json');
} catch (e) {
    console.error('Error al leer el archivo Excel:', e.message);
}
