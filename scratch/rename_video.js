const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');
const files = fs.readdirSync(projectDir);
console.log('Archivos en el proyecto:', files.filter(f => f.toLowerCase().endsWith('.mp4')));

const target = files.find(f => f.toLowerCase().includes('comercializadora') || f.length > 100);

if (target) {
    fs.renameSync(path.join(projectDir, target), path.join(projectDir, 'comercializadora_aye_presentacion.mp4'));
    console.log('Renombrado exitosamente a comercializadora_aye_presentacion.mp4');
} else {
    console.log('No se encontro el archivo');
}
