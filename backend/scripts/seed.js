import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://miguellopez32_db_user:i0or6hK6UUnETkP2@cluster0.n63ddrn.mongodb.net/betostore';

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: Number,
  imagenUrl: String,
  especificaciones: String,
  categoria: String,
  subcategoria: String,
  size: String,
  stars: { type: Number, default: 0 },
  releaseDate: Date,
  stock: { type: Number, default: 1 },
  audit: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'migration' },
    updatedBy: { type: String, default: 'migration' },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    changeLog: { type: Array, default: [] }
  }
});

const Producto = mongoose.model('Producto', productoSchema);

const productosData = [
  { nombre: 'The Crow (El Cuervo)', descripcion: 'Cuadro decorativo de The Crow', precio: 21999.99, imagenUrl: 'https://i.imgur.com/DGYUkhe.jpeg', especificaciones: 'Tamaño 30x42 cm.', categoria: 'Decoración', subcategoria: 'Cuadros', size: 'Solicite su tamaño personalizado', stars: 4, stock: 8 },
  { nombre: 'Scarface', descripcion: 'Cuadro de Scarface de Al Pacino.', precio: 22000, imagenUrl: 'https://i.imgur.com/MeFr5UL.jpeg', especificaciones: 'Tamaño 30x42 cm', categoria: 'Decoración', subcategoria: 'Cuadros', size: 'Solicite su tamaño personalizado', stars: 3, stock: 9 },
  { nombre: 'Better Call Saul', descripcion: 'Cuadro de la serie Better Call Saul', precio: 25999.99, imagenUrl: 'https://i.imgur.com/hgbhCh0.jpeg', especificaciones: 'Cuadro de decoración de medidas 30 x 42', categoria: 'Coleccionables', subcategoria: 'Figuras', size: 'Solicite su tamaño personalizado', stars: 5, stock: 10 },
  { nombre: 'Interstellar', descripcion: 'Interstellar', precio: 21999.99, imagenUrl: 'https://i.imgur.com/95z1MGF.jpeg', especificaciones: 'Tamaño 30 x 42 cm', categoria: 'Accesorios', subcategoria: 'Llaveros', size: 'S,M,L,XL', stars: 4, stock: 10 },
  { nombre: 'StarWars', descripcion: 'StarWars', precio: 21999.99, imagenUrl: 'https://i.imgur.com/lbrC3Ej.jpeg', especificaciones: 'Tamaño 30 x 42 cm.', categoria: 'Relojes', subcategoria: 'Anime', size: 'Solicite su tamaño personalizado', stars: 5, stock: 7 },
  { nombre: 'Interstellar versión 2', descripcion: 'Interstellar', precio: 21999.99, imagenUrl: 'https://i.imgur.com/u5g1RQU.jpeg', especificaciones: 'Medidas 30 x 42 cm', categoria: 'Decoración', subcategoria: 'Cuadros', size: 'Solicite su tamaño personalizado', stars: 5, stock: 9 },
  { nombre: 'Bolsa Sorpresa - Básica', descripcion: 'Incluye una selección aleatoria de productos del eCommerce.', precio: 21999.99, imagenUrl: 'https://i.imgur.com/4y9VGNk.png', especificaciones: 'Contenido sorpresa, ideal para regalos.', categoria: 'Sorpresa', subcategoria: 'Bolsa Básica', size: 'Mediana', stars: 5, stock: 9 },
  { nombre: 'Bolsa Sorpresa - Premium', descripcion: 'Incluye una selección premium de productos exclusivos.', precio: 29999.99, imagenUrl: 'https://i.imgur.com/DrBT0xC.png', especificaciones: 'Contenido sorpresa premium con productos únicos.', categoria: 'Sorpresa', subcategoria: 'Bolsa Premium', size: 'Grande', stars: 5, stock: 10 },
  { nombre: 'Interstellar 3', descripcion: 'Cuadro Interstellar', precio: 21999.33, imagenUrl: 'https://i.imgur.com/9Cm17yT.jpeg', especificaciones: 'Medida 30x42 cm.', categoria: 'Películas', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, stock: 3 },
  { nombre: 'Rocky IV', descripcion: 'Cuadro de vidrio de Rocky IV', precio: 21999.99, imagenUrl: 'https://i.imgur.com/yKlLlCq.jpeg', especificaciones: 'Cuadro de 30x42 cm.', categoria: 'Películas', subcategoria: 'Varios', size: 'Solicite su tamaño personalizado', stars: 5, releaseDate: new Date('2026-02-04'), stock: 3 },
  { nombre: 'Martes 13', descripcion: 'Cuadro de vidrio de Martes 13', precio: 21999.99, imagenUrl: 'https://i.imgur.com/aLSy7Hk.jpeg', especificaciones: 'Tamaño 30x42 cm.', categoria: 'Películas', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, releaseDate: new Date('2026-02-04'), stock: 3 },
  { nombre: 'Predator', descripcion: 'Cuadro de vidrio de Predator', precio: 21999.99, imagenUrl: 'https://i.imgur.com/fmD0fZ6.jpeg', especificaciones: 'Tamaño 30x42 cm.', categoria: 'Películas', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, releaseDate: new Date('2026-02-04'), stock: 3 },
  { nombre: 'Volver al Futuro', descripcion: 'Cuadro de vidrio de Volver al Futuro', precio: 21999.99, imagenUrl: 'https://i.imgur.com/IxfNVDG.jpeg', especificaciones: 'Tamaño 30x42 cm.', categoria: 'Películas', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, releaseDate: new Date('2026-02-04'), stock: 3 },
  { nombre: 'Thundercats', descripcion: 'Cuadro de vidrio de Thundercats', precio: 21999.99, imagenUrl: 'https://i.imgur.com/GsxisXQ.jpeg', especificaciones: 'Cuadro de vidrio 30x42 cm', categoria: 'Dibujos animados', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, releaseDate: new Date('2026-02-04'), stock: 3 },
  { nombre: 'Messi besando la copa', descripcion: 'Cuadro de vidrio de Messi', precio: 21999.99, imagenUrl: 'https://i.imgur.com/MjTV7Mj.jpeg', especificaciones: 'Tamaño 30 x 42 cm.', categoria: 'Deportes', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, releaseDate: new Date('2026-02-04'), stock: 3 },
  { nombre: 'Messi besando la copa 2', descripcion: 'Cuadro de vidrio de Messi', precio: 21999.99, imagenUrl: 'https://i.imgur.com/RMNHB7g.jpeg', especificaciones: 'Tamaño 30 x 42 cm', categoria: 'Deportes', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, releaseDate: new Date('2026-02-04'), stock: 3 },
  { nombre: 'Maradona 1', descripcion: 'Cuadro de vidrio de Maradona', precio: 21999.99, imagenUrl: 'https://i.imgur.com/TmIZORx.jpeg', especificaciones: 'Tamaño 30 x 42 cm.', categoria: 'Deportes', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, releaseDate: new Date('2026-02-04'), stock: 3 },
  { nombre: 'Michael Jordan', descripcion: 'Michael Jordan festejando', precio: 21999.99, imagenUrl: 'https://i.imgur.com/BgFs7EZ.jpeg', especificaciones: 'Cuadro de vidrio de 30x42 cm.', categoria: 'Deportes', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, stock: 3 },
  { nombre: 'Maradona 2', descripcion: 'Diego Maradona levantando la copa', precio: 21999.99, imagenUrl: 'https://i.imgur.com/RY62i60.jpeg', especificaciones: 'Cuadro de vidrio de 30x42 cm.', categoria: 'Deportes', subcategoria: '', size: 'Solicite su tamaño personalizado', stars: 5, releaseDate: new Date('2026-02-04'), stock: 3 }
];

const promocionesData = [
  { title: 'Especial Navidad', description: 'Descuentos en productos seleccionados', type: 'BANNER', discountPercentage: 15, category: 'Navidad', startDate: new Date('2025-12-01'), endDate: new Date('2025-12-31'), images: [{ url: 'https://i.imgur.com/n7sOwRI.png', alt: 'Navidad' }] },
  { title: '2x1 en accesorios', description: 'Compra uno y llévate otro gratis', type: 'BUY_ONE_GET_ONE', category: 'Accesorios', startDate: new Date('2025-06-01'), endDate: new Date('2025-06-15'), images: [{ url: 'https://i.imgur.com/n7sOwRI.png', alt: '2x1' }] },
  { title: 'Oferta Flash', description: 'Descuento por tiempo limitado', type: 'FLASH_SALE', discountPercentage: 20, category: 'General', startDate: new Date('2025-05-10'), endDate: new Date('2025-05-20'), images: [{ url: 'https://i.imgur.com/n7sOwRI.png', alt: 'Flash' }] },
  { title: 'Semana de Tecnología', description: 'Descuentos en electrónicos', type: 'BANNER', discountPercentage: 15, category: 'Tecnología', startDate: new Date('2025-05-14'), endDate: new Date('2025-05-18'), images: [{ url: 'https://i.imgur.com/n7sOwRI.png', alt: 'Tecnología' }] },
  { title: '2x1 en ropa', description: 'Compra una prenda y lleva otra gratis', type: 'BUY_ONE_GET_ONE', category: 'Moda', startDate: new Date('2025-05-12'), endDate: new Date('2025-05-22'), images: [{ url: 'https://i.imgur.com/n7sOwRI.png', alt: 'Ropa' }] },
  { title: 'Promo 4x3', description: 'Lleva 4 unidades y paga solo 3!', type: 'PRODUCT_DISCOUNT', category: 'Ofertas Especiales', startDate: new Date('2025-05-17'), endDate: new Date('2025-06-16'), images: [{ url: 'https://i.imgur.com/n7sOwRI.png', alt: '4x3' }] }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB Atlas');

    // Limpiar colecciones existentes
    await Producto.deleteMany({});
    console.log('🗑️ Productos anteriores eliminados');

    // Importar productos
    const productos = await Producto.insertMany(productosData);
    console.log(`✅ ${productos.length} productos importados`);

    // Crear índice para búsqueda
    await Producto.createIndexes();
    console.log('✅ Índices creados');

    // Importar promociones
    const { default: Promotion } = await import('../src/schemas/promocion.schema.js');
    await Promotion.deleteMany({});
    const promociones = await Promotion.insertMany(promocionesData);
    console.log(`✅ ${promociones.length} promociones importadas`);

    console.log('\n🎉 Importación completada exitosamente!');
    console.log(`📦 Total: ${productos.length} productos, ${promociones.length} promociones`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    process.exit(1);
  }
}

seed();
