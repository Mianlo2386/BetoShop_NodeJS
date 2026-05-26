import oracledb from 'oracledb';
import { withConnection } from '../config/database.js';

// ── init table ────────────────────────────────────────────────────────────────

export async function initContactosTable() {
  await withConnection(async (conn) => {
    try {
      await conn.execute(`
        CREATE TABLE CONTACTOS (
          ID          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          NOMBRE      VARCHAR2(200) NOT NULL,
          EMAIL       VARCHAR2(200) NOT NULL,
          TELEFONO    VARCHAR2(50),
          ASUNTO      VARCHAR2(300) NOT NULL,
          MENSAJE     CLOB NOT NULL,
          LEIDO       NUMBER(1) DEFAULT 0,
          CREATED_AT  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await conn.commit();
      console.log('[SQL] Table CONTACTOS created');
    } catch (e) {
      if (e.message.includes('ORA-00955')) {
        console.log('[SQL] Table CONTACTOS already exists');
      } else {
        throw e;
      }
    }
  });
}

// ── crear contacto ────────────────────────────────────────────────────────────

export async function crear({ nombre, email, telefono, asunto, mensaje }) {
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `INSERT INTO CONTACTOS (NOMBRE, EMAIL, TELEFONO, ASUNTO, MENSAJE)
       VALUES (:1, :2, :3, :4, :5)
       RETURNING ID INTO :id`,
      {
        1: nombre,
        2: email.toLowerCase(),
        3: telefono || null,
        4: asunto,
        5: mensaje,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );
    return { id: result.outBinds.id[0], nombre, email, telefono, asunto, mensaje, leido: false };
  });
}

// ── obtener todos (para admin) ────────────────────────────────────────────────

export async function obtenerTodos({ page = 1, limit = 20, soloNoLeidos = false } = {}) {
  const offset = (page - 1) * limit;
  return await withConnection(async (conn) => {
    const filtro = soloNoLeidos ? 'WHERE LEIDO = 0' : '';
    const result = await conn.execute(
      `SELECT ID, NOMBRE, EMAIL, TELEFONO, ASUNTO, MENSAJE, LEIDO, CREATED_AT
       FROM CONTACTOS ${filtro}
       ORDER BY CREATED_AT DESC
       OFFSET :1 ROWS FETCH NEXT :2 ROWS ONLY`,
      [offset, limit],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const countResult = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM CONTACTOS ${filtro}`
    );
    const total = countResult.rows[0][0] || countResult.rows[0].CNT || 0;
    return {
      data: result.rows.map(rowToContacto),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  });
}

// ── marcar como leído ─────────────────────────────────────────────────────────

export async function marcarLeido(id) {
  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE CONTACTOS SET LEIDO = 1, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :1`,
      [id],
      { autoCommit: true }
    );
  });
}

// ── helper ────────────────────────────────────────────────────────────────────

function rowToContacto(row) {
  return {
    id: row.ID,
    nombre: row.NOMBRE,
    email: row.EMAIL,
    telefono: row.TELEFONO,
    asunto: row.ASUNTO,
    mensaje: row.MENSAJE,
    leido: row.LEIDO === 1,
    createdAt: row.CREATED_AT,
  };
}
