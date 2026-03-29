import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/betostore';

const productosPrueba = [
  {
    nombre: 'Cuadro Decorativo Paisaje',
    descripcion: 'Hermoso cuadro con impresión de paisaje',
    precio: 2500,
    imagenUrl: 'https://i.imgur.com/eDW3n4J.jpeg',
    especificaciones: 'Marco de madera, vidrio protector',
    categoria: 'Cuadros',
    subcategoria: 'Decoración',
    size: '30x40cm',
    stock: 15,
    stars: 5,
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'seed',
      updatedBy: 'seed',
      version: 1,
      isActive: true,
      changeLog: []
    }
  },
  {
    nombre: 'Llavero Personalizado Nombre',
    descripcion: 'Llavero acrílico con tu nombre grabado',
    precio: 500,
    imagenUrl: 'https://i.imgur.com/WqWcM7Z.jpeg',
    especificaciones: 'Acrílico resistente',
    categoria: 'Llaveros',
    subcategoria: 'Personalizados',
    size: '5x3cm',
    stock: 50,
    stars: 4,
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'seed',
      updatedBy: 'seed',
      version: 1,
      isActive: true,
      changeLog: []
    }
  },
  {
    nombre: 'Cuadro LED Frases',
    descripcion: 'Cuadro iluminado con frases inspiradoras',
    precio: 4500,
    imagenUrl: 'https://i.imgur.com/8fYLp9K.jpeg',
    especificaciones: 'LED RGB, control remoto',
    categoria: 'Cuadros',
    subcategoria: 'LED',
    size: '40x60cm',
    stock: 8,
    stars: 5,
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'seed',
      updatedBy: 'seed',
      version: 1,
      isActive: true,
      changeLog: []
    }
  },
  {
    nombre: 'Llavero Logo Personalizado',
    descripcion: 'Llavero metálico con tu logo',
    precio: 350,
    imagenUrl: 'https://i.imgur.com/YjKBpDT.jpeg',
    especificaciones: 'Metal resistente',
    categoria: 'Llaveros',
    subcategoria: 'Empresas',
    size: '4x4cm',
    stock: 100,
    stars: 4,
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'seed',
      updatedBy: 'seed',
      version: 1,
      isActive: true,
      changeLog: []
    }
  },
  {
    nombre: 'Set Accesorios Teléfono',
    descripcion: 'Soporte + cable + holder',
    precio: 1200,
    imagenUrl: 'https://i.imgur.com/VtQbLJH.jpeg',
    especificaciones: 'Compatible con todos los modelos',
    categoria: 'Accesorios',
    subcategoria: 'Tecnología',
    size: 'Universal',
    stock: 25,
    stars: 3,
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'seed',
      updatedBy: 'seed',
      version: 1,
      isActive: true,
      changeLog: []
    }
  },
  {
    nombre: 'Cuadro Foto Familiar',
    descripcion: 'Impresión de foto familiar en alta calidad',
    precio: 1800,
    imagenUrl: 'https://i.imgur.com/HxNKmWQ.jpeg',
    especificaciones: 'Papel fotográfico premium',
    categoria: 'Cuadros',
    subcategoria: 'Fotos',
    size: '20x30cm',
    stock: 20,
    stars: 5,
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'seed',
      updatedBy: 'seed',
      version: 1,
      isActive: true,
      changeLog: []
    }
  },
  {
    nombre: 'Llavero Gato Negro',
    descripcion: 'Llavero de gato negro estilo minimalista',
    precio: 250,
    imagenUrl: 'https://i.imgur.com/p0tFkQm.jpeg',
    especificaciones: 'Resina, diseño exclusivo',
    categoria: 'Llaveros',
    subcategoria: 'Animales',
    size: '5x4cm',
    stock: 35,
    stars: 4,
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'seed',
      updatedBy: 'seed',
      version: 1,
      isActive: true,
      changeLog: []
    }
  },
  {
    nombre: 'Accesorios Escritorio',
    descripcion: 'Organizador de papeles y clips',
    precio: 950,
    imagenUrl: 'https://i.imgur.com/kMmGQHV.jpeg',
    especificaciones: 'Madera bambú, ecológico',
    categoria: 'Accesorios',
    subcategoria: 'Oficina',
    size: '20x15cm',
    stock: 18,
    stars: 4,
    audit: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'seed',
      updatedBy: 'seed',
      version: 1,
      isActive: true,
      changeLog: []
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const Producto = mongoose.model('Producto', new mongoose.Schema({
      nombre: { type: String, required: true },
      descripcion: { type: String },
      precio: { type: Number, required: true },
      imagenUrl: { type: String },
      especificaciones: { type: String },
      categoria: { type: String },
      subcategoria: { type: String },
      size: { type: String },
      stock: { type: Number, default: 0 },
      stars: { type: Number, default: 0 },
      audit: { type: Object }
    }));
    
    // Limpiar productos existentes
    await Producto.deleteMany({});
    console.log('🗑️ Productos anteriores eliminados');

    // Insertar productos de prueba
    const resultado = await Producto.insertMany(productosPrueba);
    console.log(`✅ ${resultado.length} productos insertados`);

    resultado.forEach(p => {
      console.log(`   - ${p.nombre} (${p.categoria}) - $${p.precio}`);
    });

    console.log('\n🎉 Seed completado!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();
