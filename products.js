// products.js
const categories = ['Detergentes', 'Limpiadores Multiuso', 'Desinfectantes', 'Accesorios de Aseo', 'Higiene Personal', 'Papel y Celulosa'];
const brands = ['A&E Max', 'EcoClean', 'UltraShine', 'Poder Base', 'FreshLife', 'Klin'];
const types = ['Líquido', 'en Polvo', 'en Gel', 'Concentrado', 'en Spray', 'Ecológico'];
const sizes = ['1 Lt', '5 Lt', '500 ml', '3 Lt', 'Pack x3', '10 Lt'];
const aromas = ['Limón', 'Lavanda', 'Brisa Marina', 'Manzana', 'Pino', 'Neutro'];

const productImages = [
    'https://images.unsplash.com/photo-1584820927498-cafe2c161a09?auto=format&fit=crop&w=400&q=80', // Spray
    'https://images.unsplash.com/photo-1585671962215-473458cd1b84?auto=format&fit=crop&w=400&q=80', // Bottles
    'https://images.unsplash.com/photo-1584820883654-e0c03991f8ed?auto=format&fit=crop&w=400&q=80', // Generic Cleaning
    'https://images.unsplash.com/photo-1622560481285-d85c8b21ed12?auto=format&fit=crop&w=400&q=80', // Brushes/sponges
    'https://images.unsplash.com/photo-1585834925841-f09d29035e18?auto=format&fit=crop&w=400&q=80',  // Disinfectant
    'https://images.unsplash.com/photo-1607563032824-345371c97a2d?auto=format&fit=crop&w=400&q=80', // Liquid bottles
    'https://images.unsplash.com/photo-1628148816827-0240d9990bd6?auto=format&fit=crop&w=400&q=80' // Laundry
];

window.storeProducts = [];

for (let i = 1; i <= 100; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const aroma = aromas[Math.floor(Math.random() * aromas.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const img = productImages[Math.floor(Math.random() * productImages.length)];
    
    // Generate realistic random price between 990 and 25,990 CLP
    const price = Math.floor(Math.random() * 250 + 10) * 100 + 90;

    let productName = '';
    if (category === 'Detergentes' || category === 'Limpiadores Multiuso' || category === 'Desinfectantes') {
        productName = `${category.replace(/s$/, '')} ${brand} ${type} aroma ${aroma}`;
    } else if (category === 'Accesorios de Aseo') {
        productName = `Accesorio de Limpieza ${brand} ${size}`;
    } else {
        productName = `${brand} ${category} ${size}`;
    }

    window.storeProducts.push({
        id: i,
        name: productName,
        size: size,
        price: price,
        image: img,
        stock: Math.floor(Math.random() * 100) > 5 // 95% chance to be in stock
    });
}
