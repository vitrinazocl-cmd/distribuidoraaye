const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'libros de venta', 'inventario a&e.xlsx');
try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    fs.writeFileSync(path.join(__dirname, 'inventario_output.json'), JSON.stringify(data, null, 2));
    console.log("Successfully extracted", data.length, "rows.");
} catch (error) {
    console.error("Error reading excel:", error);
}
