import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config({ path: './.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool = null;
let useThickMode = false;

// Hardcoded credentials - env gets overridden from root workspace
const DB_USER = 'ADMIN';
const DB_PASSWORD = '72BetoStore*';
const CONNECT_STRING = 'betostoredb_high';

const initOracleClient = async () => {
  const instantClientPath = path.join(__dirname, '../config/instantclient/instantclient_23_0');
  const walletPath = path.join(__dirname, '../config/wallet');
  
  console.log('[DB] Checking paths...');
  console.log('[DB] __dirname:', __dirname);
  console.log('[DB] instantClientPath:', instantClientPath);
  console.log('[DB] instantClientPath exists:', fs.existsSync(instantClientPath));
  console.log('[DB] walletPath exists:', fs.existsSync(walletPath));
  
  try {
    console.log('[DB] Attempting THICK mode with wallet...');
    
    await oracledb.initOracleClient({
      libDir: instantClientPath,
      configDir: walletPath,
    });
    useThickMode = true;
    console.log('[DB] ✅ THICK mode initialized with wallet!');
  } catch (e) {
    console.log('[DB] ⚠️ THICK mode failed:', e.message);
    useThickMode = false;
  }
};

const createPool = async () => {
  if (pool) return pool;

  const user = DB_USER;
  const password = DB_PASSWORD;
  const connectString = CONNECT_STRING;
  
  // TNS_ADMIN must point to wallet for SSL/TLS connections
  const walletPath = path.join(__dirname, '../config/wallet');
  process.env.TNS_ADMIN = walletPath;
  
  console.log('[DB] ========== CONNECTION CONFIG ==========');
  console.log('[DB] CONNECT_STRING:', connectString);
  console.log('[DB] USER:', user);
  console.log('[DB] TNS_ADMIN:', walletPath);
  console.log('[DB] TNS_ADMIN exists:', fs.existsSync(walletPath));
  console.log('[DB] MODE:', useThickMode ? 'THICK (SSL)' : 'THIN');
  console.log('[DB] =======================================');

  try {
    console.log('[DB] Creating pool (this may take up to 60 seconds)...');
    pool = await oracledb.createPool({
      user,
      password,
      connectString,
      poolMin: 1,
      poolMax: 5,
      poolTimeout: 120,
      connectTimeout: 60,
    });

    console.log('[DB] ✅ Pool created successfully!');
    return pool;
  } catch (error) {
    console.error('[DB] ========== POOL ERROR ==========');
    console.error('[DB] Error code:', error.code);
    console.error('[DB] Error message:', error.message);
    console.error('[DB] ===============================');
    throw error;
  }
};

const getPool = () => pool;

const closePool = async () => {
  if (pool) {
    await pool.close(0);
    pool = null;
    console.log('[DB] Pool closed');
  }
};

async function withConnection(callback) {
  const p = getPool();
  let connection = null;
  try {
    connection = await p.getConnection();
    return await callback(connection);
  } finally {
    if (connection) await connection.close();
  }
}

export { initOracleClient, createPool, getPool, closePool, withConnection, useThickMode };
export default { initOracleClient, createPool, getPool, closePool, withConnection, useThickMode };