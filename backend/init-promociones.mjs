import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { initOracleClient, createPool } from './src/config/database.js';
import { initPromocionesTable } from './src/services/promocion.service.js';

await initOracleClient();
await createPool();
await initPromocionesTable();
console.log('✅ Tabla PROMOCIONES lista');
process.exit(0);
