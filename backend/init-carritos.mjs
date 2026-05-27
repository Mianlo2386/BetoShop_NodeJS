import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { initOracleClient, createPool } from './src/config/database.js';
import { initCarritosTable } from './src/services/carrito.service.js';

await initOracleClient();
await createPool();
await initCarritosTable();
console.log('✅ Tabla CARRITOS lista');
process.exit(0);
