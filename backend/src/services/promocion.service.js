import oracledb from 'oracledb';
import { withConnection } from '../config/database.js';

// ── init table ────────────────────────────────────────────────────────────────

export async function initPromocionesTable() {
  await withConnection(async (conn) => {
    try {
      await conn.execute(`
        CREATE TABLE PROMOCIONES (
          ID          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          DATA        CLOB,
          CREATED_AT  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await conn.commit();
      console.log('[SQL] Table PROMOCIONES created');
    } catch (e) {
      if (e.message.includes('ORA-00955')) {
        console.log('[SQL] Table PROMOCIONES already exists');
      } else {
        throw e;
      }
    }
  });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function rowToPromocion(row) {
  if (!row) return null;
  let data = row.DATA;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { return null; }
  }
  return { id: row.ID, ...data };
}

// ── obtener todas las activas (público) ───────────────────────────────────────

export async function findActive() {
  const now = new Date().toISOString();
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, DATA FROM PROMOCIONES
       WHERE JSON_VALUE(DATA, '$.isActive') = 'true'
         AND JSON_VALUE(DATA, '$.audit.isActive') = 'true'
         AND JSON_VALUE(DATA, '$.startDate') <= :1
         AND JSON_VALUE(DATA, '$.endDate') >= :2
       ORDER BY ID DESC`,
      [now, now],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows.map(rowToPromocion);
  });
}

// ── obtener todas (admin) ─────────────────────────────────────────────────────

export async function obtenerTodas({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, DATA FROM PROMOCIONES
       WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true'
       ORDER BY ID DESC
       OFFSET :1 ROWS FETCH NEXT :2 ROWS ONLY`,
      [offset, limit],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const countResult = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM PROMOCIONES WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true'`
    );
    const total = countResult.rows[0][0] || countResult.rows[0].CNT || 0;
    return {
      data: result.rows.map(rowToPromocion),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  });
}

// ── obtener por ID ────────────────────────────────────────────────────────────

export async function obtenerPorId(id) {
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, DATA FROM PROMOCIONES WHERE ID = :1`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows.length > 0 ? rowToPromocion(result.rows[0]) : null;
  });
}

// ── obtener activas por tipo ──────────────────────────────────────────────────

export async function findActiveByType(type) {
  const now = new Date().toISOString();
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, DATA FROM PROMOCIONES
       WHERE JSON_VALUE(DATA, '$.isActive') = 'true'
         AND JSON_VALUE(DATA, '$.audit.isActive') = 'true'
         AND JSON_VALUE(DATA, '$.type') = :1
         AND JSON_VALUE(DATA, '$.startDate') <= :2
         AND JSON_VALUE(DATA, '$.endDate') >= :3`,
      [type, now, now],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows.map(rowToPromocion);
  });
}

// ── crear ─────────────────────────────────────────────────────────────────────

export async function crear(promocionData, createdBy = 'system') {
  const data = {
    ...promocionData,
    isActive: true,
    audit: {
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      updatedBy: createdBy,
      version: 1,
    },
  };

  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `INSERT INTO PROMOCIONES (DATA) VALUES (:1) RETURNING ID INTO :id`,
      { 1: JSON.stringify(data), id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );
    return { id: result.outBinds.id[0], ...data };
  });
}

// ── actualizar ────────────────────────────────────────────────────────────────

export async function actualizar(id, promocionData, updatedBy = 'system') {
  const existing = await obtenerPorId(id);
  if (!existing) throw new Error('Promoción no encontrada');

  const { id: _id, ...rest } = existing;
  const updated = {
    ...rest,
    ...promocionData,
    audit: {
      ...rest.audit,
      updatedAt: new Date().toISOString(),
      updatedBy,
      version: (rest.audit?.version || 1) + 1,
    },
  };

  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE PROMOCIONES SET DATA = :1, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :2`,
      [JSON.stringify(updated), id],
      { autoCommit: true }
    );
  });

  return { id, ...updated };
}

// ── eliminar (soft delete) ────────────────────────────────────────────────────

export async function eliminar(id, deletedBy = 'system') {
  const existing = await obtenerPorId(id);
  if (!existing) throw new Error('Promoción no encontrada');

  const { id: _id, ...rest } = existing;
  const deleted = {
    ...rest,
    isActive: false,
    audit: {
      ...rest.audit,
      isActive: false,
      updatedAt: new Date().toISOString(),
      updatedBy: deletedBy,
    },
  };

  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE PROMOCIONES SET DATA = :1, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :2`,
      [JSON.stringify(deleted), id],
      { autoCommit: true }
    );
  });

  return { message: 'Promoción eliminada' };
}
