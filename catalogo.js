const catalogoProductos = [
    // ASEO HOGAR
    { id: 'AH_LAV_1', name: "Lavaloza Limón A&E 1 Lt", price: 1500, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Limón", "Manzana"] },
    { id: 'AH_LAV_5', name: "Lavaloza Industrial 5 Lts", price: 6500, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Limón", "Neutro"] },
    { id: 'AH_DET_1', name: "Detergente Líquido Ropa 3 Lts", price: 8990, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Lavanda", "Floral"] },
    { id: 'AH_DET_P', name: "Detergente en Polvo 5 Kg", price: 12500, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Original"] },
    { id: 'AH_SUA_1', name: "Suavizante de Ropa 1 Lt", price: 2100, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Brisa Fresca", "Bebé"] },
    { id: 'AH_SUA_5', name: "Suavizante de Ropa 5 Lts", price: 8500, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Brisa Fresca", "Floral"] },
    { id: 'AH_MTP_1', name: "Limpiador Multiuso 1 Lt", price: 1800, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Lavanda", "Pino", "Limón"] },
    { id: 'AH_LVP_1', name: "Limpiavidrios Gatillo 500 ml", price: 1990, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Original"] },
    { id: 'AH_ESC_1', name: "Escoba de Exterior Resistente", price: 3500, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'AH_MOP_1', name: "Mopa de Algodón con Mango", price: 4200, category: "ASEO HOGAR", image: "nuevo%20catalogo/logo.jpg.jpeg" },

    // DESINFECCION
    { id: 'DS_CLO_1', name: "Cloro Tradicional 1 Lt", price: 950, category: "DESINFECCION", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Original"] },
    { id: 'DS_CLO_5', name: "Cloro Tradicional 5 Lts", price: 3500, category: "DESINFECCION", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Original"] },
    { id: 'DS_CLO_G', name: "Cloro Gel 900 ml", price: 1650, category: "DESINFECCION", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Limón", "Lavanda"] },
    { id: 'DS_LYS_1', name: "Desinfectante Aerosol 400 ml", price: 3990, category: "DESINFECCION", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Original", "Brisa Fresca"] },
    { id: 'DS_ALC_1', name: "Alcohol Gel 70% 1 Lt con Válvula", price: 4500, category: "DESINFECCION", image: "nuevo%20catalogo/logo.jpg.jpeg" },

    // HIGIENE PERSONAL
    { id: 'HP_JAB_1', name: "Jabón Líquido Manos 1 Lt", price: 2500, category: "HIGIENE PERSONAL", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Avena", "Aloe Vera", "Frutos Rojos"] },
    { id: 'HP_JAB_5', name: "Jabón Líquido Manos Bidón 5 Lts", price: 9500, category: "HIGIENE PERSONAL", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Avena", "Aloe Vera"] },
    { id: 'HP_SHM_1', name: "Shampoo Uso Frecuente 1 Lt", price: 3200, category: "HIGIENE PERSONAL", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Manzanilla", "Hierbas"] },
    { id: 'HP_CON_1', name: "Acondicionador 1 Lt", price: 3200, category: "HIGIENE PERSONAL", image: "nuevo%20catalogo/logo.jpg.jpeg", flavors: ["Manzanilla", "Hierbas"] },
    { id: 'HP_PAS_1', name: "Pasta Dental Triple Acción 90g", price: 1200, category: "HIGIENE PERSONAL", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'HP_PH_1', name: "Papel Higiénico 30mts Doble Hoja x 4", price: 2500, category: "HIGIENE PERSONAL", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'HP_PH_40', name: "Papel Higiénico 30mts Manga x 40", price: 21000, category: "HIGIENE PERSONAL", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'HP_TOA_1', name: "Toallas Higiénicas Tela Suave x 8", price: 1100, category: "HIGIENE PERSONAL", image: "nuevo%20catalogo/logo.jpg.jpeg" },

    // HIGIENE EMPRESAS
    { id: 'HE_PH_I', name: "Papel Higiénico Institucional Jumbo 250mts x 6", price: 18500, category: "HIGIENE EMPRESAS", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'HE_TOA_I', name: "Toalla Nova Interfoliada x 200 Hojas", price: 1990, category: "HIGIENE EMPRESAS", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'HE_TOA_R', name: "Toalla Nova Rollo Industrial 200mts", price: 5500, category: "HIGIENE EMPRESAS", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'HE_BAS_1', name: "Bolsas de Basura 70x90 Negras x 10", price: 1500, category: "HIGIENE EMPRESAS", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'HE_BAS_I', name: "Bolsas de Basura 120x130 Industriales x 10", price: 3200, category: "HIGIENE EMPRESAS", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'HE_SANI_5', name: "Sanitizante de Superficies Amonio Cuaternario 5 Lts", price: 12000, category: "HIGIENE EMPRESAS", image: "nuevo%20catalogo/logo.jpg.jpeg" },

    // PAÑALES
    { id: 'PAN_ADU_M', name: "Pañales Adulto Mayor Talla M x 20", price: 15990, category: "PAÑALES", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'PAN_ADU_G', name: "Pañales Adulto Mayor Talla G x 20", price: 16990, category: "PAÑALES", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'PAN_ADU_XG', name: "Pañales Adulto Mayor Talla XG x 20", price: 18500, category: "PAÑALES", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'PAN_BEB_P', name: "Pañales Bebé Talla P x 40", price: 8500, category: "PAÑALES", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'PAN_BEB_M', name: "Pañales Bebé Talla M x 36", price: 8500, category: "PAÑALES", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'PAN_BEB_G', name: "Pañales Bebé Talla G x 32", price: 8500, category: "PAÑALES", image: "nuevo%20catalogo/logo.jpg.jpeg" },
    { id: 'PAN_BEB_XG', name: "Pañales Bebé Talla XG x 28", price: 8500, category: "PAÑALES", image: "nuevo%20catalogo/logo.jpg.jpeg" }
];

// Hacer el catálogo accesible globalmente si es necesario, o exportarlo
if (typeof window !== 'undefined') {
    window.catalogoProductos = catalogoProductos;
}
