import mongoose from 'mongoose';
import oracledb from 'oracledb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url)); // backend/scripts
const baseDir = path.resolve(scriptDir, '..'); // backend

dotenv.config({ path: path.join(baseDir, '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MongoDB Schema (same as original)
const productoSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  precio: Number,
  imagen_url: String,
  categoria: String,
  subcategoria: String,
  stock: Number,
  sku: String,
  marca: String,
  modelo: String,
  peso: Number,
  dimensiones: {
    ancho: Number,
    alto: Number,
    profundidad: Number,
  },
  colores: [String],
  tallas: [String],
  caracts: mongoose.Schema.Types.Mixed,
  imagenes: [String],
  video: String,
  fecha_lanzamiento: Date,
  estado: { type: String, default: 'active' },
  audit: {
    createdAt: Date,
    updatedAt: Date,
    createdBy: String,
    updatedBy: String,
    version: Number,
    isActive: Boolean,
    changeLog: [
      {
        action: String,
        modifiedBy: String,
        modifiedAt: Date,
        changes: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  proveedor: String,
  garantia_meses: Number,
  tags: [String],
  fecha_publicacion: Date,
  releaseDate: Date,
});

const Producto = mongoose.model('Producto', productoSchema);

// Oracle config (same as database.js)
async function initOracle() {
  const instantClientPath = path.join(baseDir, 'src/config/instantclient/instantclient_23_0');
  const walletPath = path.join(baseDir, 'src/config/wallet');
  
  console.log('[Oracle] Paths:', { instantClientPath, walletPath });
  console.log('[Oracle] Initializing THICK mode...');
  await oracledb.initOracleClient({
    libDir: instantClientPath,
    configDir: walletPath,
  });
  console.log('[Oracle] THICK mode ready!');
  
  process.env.TNS_ADMIN = walletPath;
  
  const pool = await oracledb.createPool({
    user: 'ADMIN',
    password: '72BetoStore*',
    connectString: 'betostoredb_high',
    poolMin: 1,
    poolMax: 5,
    poolTimeout: 60,
    connectTimeout: 30,
  });
  
  console.log('[Oracle] Pool created!');
  return pool;
}

async function migrate() {
  console.log('='.repeat(50));
  console.log('MIGRACIÓN MONGODB -> ORACLE');
  console.log('='.repeat(50));
  
  // Connect to MongoDB
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://miguellopez32_db_user:i0or6hK6UUnETkP2@cluster0.n63ddrn.mongodb.net/betostore';
  console.log('[MongoDB] URI:', MONGO_URI.replace(/:[^:]+@/, ':****@'));
  
  if (!MONGO_URI) {
    throw new Error('MongoDB URI not found. Set MONGO_URI or MONGODB_URI in .env');
  }
  
  console.log('[MongoDB] Connecting...');
  await mongoose.connect(MONGO_URI);
  console.log('[MongoDB] Connected!');
  
  // Get all productos from MongoDB
  const productos = await Producto.find({ 'audit.isActive': true }).lean();
  const total = productos.length;
  console.log(`[MongoDB] Found ${total} productos to migrate`);
  
  if (total === 0) {
    console.log('[Migrate] No products to migrate. Exiting.');
    await mongoose.disconnect();
    return;
  }
  
  // Connect to Oracle
  console.log('[Oracle] Connecting...');
  const pool = await initOracle();
  const conn = await pool.getConnection();
  
  // Ensure table exists
  try {
    await conn.execute(`
      CREATE TABLE PRODUCTOS (
        ID VARCHAR2(64) PRIMARY KEY,
        DATA CLOB,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[Oracle] Table PRODUCTOS created or already exists');
  } catch (e) {
    if (e.message.includes('ORA-00955')) {
      console.log('[Oracle] Table already exists');
    } else {
      throw e;
    }
  }
  
  // Clear existing data (optional - comment out if you want to keep existing Oracle data)
  console.log('[Oracle] Clearing existing data...');
  await conn.execute('DELETE FROM PRODUCTOS');
  await conn.commit();
  
  // Migrate each producto
  let migrated = 0;
  let errors = 0;
  
  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];
    
    try {
      // Transform _id to string
      const producto = {
        ...p,
        _id: p._id?.toString(),
      };
      
      // Ensure audit fields exist
      if (!producto.audit) {
        producto.audit = {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'migration',
          updatedBy: 'migration',
          version: 1,
          isActive: true,
          changeLog: [],
        };
      }
      
      const jsonStr = JSON.stringify(producto);
      const id = crypto.randomUUID();
      
      await conn.execute(
        `INSERT INTO PRODUCTOS (ID, DATA) VALUES (:1, :2)`,
        [id, jsonStr]
      );
      
      migrated++;
      console.log(`Migrando producto ${i + 1} de ${total}...`);
    } catch (e) {
      errors++;
      console.error(`Error migrando producto ${i + 1}:`, e.message);
    }
  }
  
  await conn.commit();
  console.log(`[Oracle] Committed ${migrated} productos`);
  
  // Verify
  const result = await conn.execute('SELECT COUNT(*) as CNT FROM PRODUCTOS');
  const count = result.rows[0].CNT;
  console.log(`[Oracle] Total in database: ${count}`);
  
  // Cleanup
  await conn.close();
  await pool.close();
  await mongoose.disconnect();
  
  console.log('='.repeat(50));
  console.log(`MIGRACIÓN COMPLETA`);
  console.log(`Migrados: ${migrated}`);
  console.log(`Errores: ${errors}`);
  console.log('='.repeat(50));
}

migrate().catch((err) => {
  console.error('MIGRATION FAILED:', err);
  process.exit(1);
});