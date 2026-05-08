import oracledb from 'oracledb';
import { getPool, withConnection } from '../config/database.js';

function processAudit(obj, isNew, modifiedBy = 'system') {
  const audit = obj.audit || {};
  if (isNew) {
    audit.createdAt = new Date();
    audit.updatedAt = new Date();
    audit.createdBy = modifiedBy;
    audit.updatedBy = modifiedBy;
    audit.version = 1;
    audit.isActive = true;
    audit.changeLog = [];
  } else {
    audit.updatedAt = new Date();
    audit.version = (audit.version || 1) + 1;
    audit.updatedBy = modifiedBy;
    if (!audit.changeLog) audit.changeLog = [];
    audit.changeLog.push({ action: 'UPDATE', modifiedBy, modifiedAt: new Date(), changes: {} });
  }
  return { ...obj, audit };
}

function addChange(obj, action, modifiedBy, changes = {}) {
  if (!obj.audit) obj.audit = {};
  if (!obj.audit.changeLog) obj.audit.changeLog = [];
  obj.audit.changeLog.push({ action, modifiedBy: modifiedBy || 'system', modifiedAt: new Date(), changes });
}

function rowToProducto(row) {
  if (!row) return null;
  
  let data = row.DATA;
  if (data && typeof data === 'object') {
    data = data.toString();
  }
  
  if (typeof data === 'string' && data.startsWith('{')) {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.warn('[rowToProducto] JSON parse error:', e.message);
    }
  }
  
  return { _id: row.ID, ...data };
}

async function initCollection() {
  console.log('[SQL] Ensuring table PRODUCTOS exists...');
  
  await withConnection(async (conn) => {
    try {
      await conn.execute(`
        CREATE TABLE PRODUCTOS (
          ID VARCHAR2(64) PRIMARY KEY,
          DATA CLOB,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await conn.commit();
      console.log('[SQL] Table PRODUCTOS ready!');
    } catch (e) {
      if (e.message.includes('ORA-00955')) {
        console.log('[SQL] Table already exists');
      } else {
        console.log('[SQL] Warning:', e.message);
      }
    }
  });
  
  return { success: true };
}

export { initCollection, rowToProducto, withConnection };

export async function obtenerTodos(opciones = {}) {
  const { page = 1, limit = 50 } = opciones;
  const offset = (page - 1) * limit;
  
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, DATA FROM PRODUCTOS ORDER BY ID OFFSET :1 ROWS FETCH NEXT :2 ROWS ONLY`,
      [offset, limit],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const countResult = await conn.execute(`SELECT COUNT(*) as CNT FROM PRODUCTOS`);
    
    const productos = result.rows.map(rowToProducto);
    const total = countResult.rows[0].CNT;
    
    return {
      data: productos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  });
}

export async function obtenerPorId(id) {
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, DATA FROM PRODUCTOS WHERE ID = :1`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows.length > 0 ? rowToProducto(result.rows[0]) : null;
  });
}

export async function buscarPorNombreCategoriaSubcategoria(query) {
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, DATA FROM PRODUCTOS WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true' AND (
        JSON_VALUE(DATA, '$.nombre') LIKE '%' || :1 || '%' OR
        JSON_VALUE(DATA, '$.categoria') LIKE '%' || :1 || '%' OR
        JSON_VALUE(DATA, '$.subcategoria') LIKE '%' || :1 || '%'
      )`,
      [query],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows.map(rowToProducto);
  });
}

export async function obtenerReleases(daysAgo = 30) {
  return await withConnection(async (conn) => {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - daysAgo);
    const result = await conn.execute(
      `SELECT ID, DATA FROM PRODUCTOS WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true' AND JSON_VALUE(DATA, '$.releaseDate') >= :1 ORDER BY JSON_VALUE(DATA, '$.releaseDate') DESC`,
      [fechaLimite.toISOString()],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows.map(rowToProducto);
  });
}

export async function obtenerPorCategoria(categoria, opciones = {}) {
  const { page = 1, limit = 50 } = opciones;
  const offset = (page - 1) * limit;
  
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, DATA FROM PRODUCTOS WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true' AND JSON_VALUE(DATA, '$.categoria') = :1 ORDER BY JSON_VALUE(DATA, '$.releaseDate') DESC OFFSET :2 ROWS FETCH NEXT :3 ROWS ONLY`,
      [categoria, offset, limit],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const countResult = await conn.execute(
      `SELECT COUNT(*) FROM PRODUCTOS WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true' AND JSON_VALUE(DATA, '$.categoria') = :1`,
      [categoria]
    );
    
    const productos = result.rows.map(rowToProducto);
    const total = countResult.rows[0].COUNT;
    
    return { data: productos, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  });
}

export async function obtenerPorRangoPrecio(min, max, opciones = {}) {
  const { page = 1, limit = 50 } = opciones;
  const offset = (page - 1) * limit;
  
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, DATA FROM PRODUCTOS WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true' AND CAST(JSON_VALUE(DATA, '$.precio') AS NUMBER) BETWEEN :1 AND :2 ORDER BY CAST(JSON_VALUE(DATA, '$.precio') AS NUMBER) OFFSET :3 ROWS FETCH NEXT :4 ROWS ONLY`,
      [min, max, offset, limit],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const productos = result.rows.map(rowToProducto);
    const total = productos.length;
    
    return { data: productos, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  });
}

export async function crear(productoData, createdBy = 'system') {
  const id = crypto.randomUUID();
  const producto = processAudit(productoData, true, createdBy);
  
  return await withConnection(async (conn) => {
    await conn.execute(
      `INSERT INTO PRODUCTOS (ID, DATA) VALUES (:1, :2)`,
      [id, JSON.stringify(producto)]
    );
    await conn.commit();
    return { ...producto, _id: id };
  });
}

export async function actualizar(id, productoData, updatedBy = 'system') {
  const existing = await obtenerPorId(id);
  if (!existing) throw new Error('Producto no encontrado');
  
  const merged = { ...existing, ...productoData };
  const updated = processAudit(merged, false, updatedBy);
  addChange(updated, 'UPDATE', updatedBy, productoData);
  
  return await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE PRODUCTOS SET DATA = :1, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :2`,
      [JSON.stringify(updated), id]
    );
    await conn.commit();
    return updated;
  });
}

export async function eliminar(id, deletedBy = 'system') {
  const existing = await obtenerPorId(id);
  if (!existing) throw new Error('Producto no encontrado');
  
  existing.audit.isActive = false;
  addChange(existing, 'DELETE', deletedBy);
  const deleted = processAudit(existing, false, deletedBy);
  
  return await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE PRODUCTOS SET DATA = :1, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :2`,
      [JSON.stringify(deleted), id]
    );
    await conn.commit();
    return deleted;
  });
}

export async function restaurar(id, restoredBy = 'system') {
  const existing = await obtenerPorId(id);
  if (!existing) throw new Error('Producto no encontrado');
  
  existing.audit.isActive = true;
  addChange(existing, 'RESTORE', restoredBy);
  const restored = processAudit(existing, false, restoredBy);
  
  return await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE PRODUCTOS SET DATA = :1, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :2`,
      [JSON.stringify(restored), id]
    );
    await conn.commit();
    return restored;
  });
}

export async function obtenerEstadisticas() {
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT COUNT(*) as CNT, AVG(CAST(JSON_VALUE(DATA, '$.precio') AS NUMBER)) as AVG_PRICE, MIN(CAST(JSON_VALUE(DATA, '$.precio') AS NUMBER)) as MIN_PRICE, MAX(CAST(JSON_VALUE(DATA, '$.precio') AS NUMBER)) as MAX_PRICE, SUM(CAST(JSON_VALUE(DATA, '$.stock') AS NUMBER)) as TOTAL_STOCK FROM PRODUCTOS WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true'`
    );
    
    const row = result.rows[0];
    return {
      totalProductos: row.CNT || 0,
      precioPromedio: Math.round((row.AVG_PRICE || 0) * 100) / 100,
      precioMin: row.MIN_PRICE || 0,
      precioMax: row.MAX_PRICE || 0,
      stockTotal: row.TOTAL_STOCK || 0,
      totalCategorias: 0
    };
  });
}

export async function obtenerCategorias() {
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT DISTINCT JSON_VALUE(DATA, '$.categoria') as CATEGORIA FROM PRODUCTOS WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true' AND JSON_VALUE(DATA, '$.categoria') IS NOT NULL`
    );
    return result.rows.map(r => r.CATEGORIA);
  });
}

export async function obtenerSubcategorias(categoria) {
  return await withConnection(async (conn) => {
    const filter = categoria 
      ? `AND JSON_VALUE(DATA, '$.categoria') = '${categoria}'`
      : '';
    const result = await conn.execute(
      `SELECT DISTINCT JSON_VALUE(DATA, '$.subcategoria') as SUBCATEGORIA FROM PRODUCTOS WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true' AND JSON_VALUE(DATA, '$.subcategoria') IS NOT NULL ${filter}`
    );
    return result.rows.map(r => r.SUBCATEGORIA);
  });
}