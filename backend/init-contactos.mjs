import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { initOracleClient, createPool } from './src/config/database.js';
import { initContactosTable } from './src/services/contacto.service.js';

await initOracleClient();
await createPool();
await initContactosTable();
console.log('✅ Tabla CONTACTOS lista');
process.exit(0);
