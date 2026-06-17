const fs = require('fs');
const path = require('path');
const https = require('https');

const csvPath = path.join(__dirname, 'catalogo productos', 'CATALOGO ELEODORO JUNIO 26.csv');
const jsPath = path.join(__dirname, 'catalogo.js');
const imgDir = path.join(__dirname, 'catalogo');

if (!fs.existsSync(imgDir)){
    fs.mkdirSync(imgDir, { recursive: true });
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                   .on('error', reject)
                   .once('close', () => resolve(filepath));
            } else if (res.statusCode === 301 || res.statusCode === 302) {
                downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
            } else {
                res.resume();
                reject(new Error(`Status: ${res.statusCode}`));
            }
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log('Leyendo CSV...');
        const csvContent = fs.readFileSync(csvPath, 'latin1');
        const lines = csvContent.split('\n');
        const products = [];
        let count = 0;

        console.log(`Encontradas ${lines.length} lineas. Iniciando descarga de imagenes...`);

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(';');
            if (parts.length < 5) continue;

            let codigo = parts[0].trim();
            if (!codigo) codigo = 'PROD' + i; // fallback
            
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

            const imageName = `${codigo}.jpg`;
            const imageLocalPath = path.join(imgDir, imageName);
            const imageRelativeUrl = `catalogo/${imageName}`;

            products.push(`{ id: "${codigo}", name: "${descripcion}", price: ${precio}, category: "${category}", image: "${imageRelativeUrl}" }`);

            if (!fs.existsSync(imageLocalPath)) {
                // Shorten text to fit image
                let shortText = descripcion;
                if (shortText.length > 25) {
                    shortText = shortText.substring(0, 25);
                }
                const safeName = encodeURIComponent(shortText);
                const url = `https://dummyimage.com/400x400/ffffff/333333.jpg&text=${safeName}`;
                
                try {
                    await downloadImage(url, imageLocalPath);
                    console.log(`[${count+1}] Descargada imagen: ${imageName}`);
                } catch (e) {
                    console.log(`[${count+1}] Error descargando ${imageName}:`, e.message);
                    // Fallback to placehold.co if dummyimage fails
                    try {
                        const fbUrl = `https://placehold.co/400x400/ffffff/333333.png?text=${safeName}`;
                        await downloadImage(fbUrl, imageLocalPath);
                        console.log(`[${count+1}] Descargada con fallback: ${imageName}`);
                    } catch (e2) {
                        console.log(`[${count+1}] Fallback failed: ${e2.message}`);
                    }
                }
            } else {
                console.log(`[${count+1}] Imagen ya existe: ${imageName}`);
            }
            count++;
        }

        const jsContent = `const catalogoProductos = [\n${products.join(',\n')}\n];\n`;
        fs.writeFileSync(jsPath, jsContent, 'utf8');
        console.log(`\n¡Exito! Catálogo generado con ${count} productos. Las imágenes están en la carpeta 'catalogo'.`);
    } catch (e) {
        console.error('Error general:', e);
    }
}

run();
