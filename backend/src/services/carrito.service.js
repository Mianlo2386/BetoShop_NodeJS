import oracledb from 'oracledb';
import { withConnection } from '../config/database.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function rowToCarrito(row) {
  if (!row) return null;
  let data = row.DATA;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { return null; }
  }
  return { _id: row.ID, usuarioId: row.USUARIO_ID, ...data };
}

// ── init table ────────────────────────────────────────────────────────────────

export async function initCarritosTable() {
  await withConnection(async (conn) => {
    try {
      await conn.execute(`
        CREATE TABLE CARRITOS (
          ID           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          USUARIO_ID   NUMBER NOT NULL UNIQUE,
          DATA         CLOB,
          CREATED_AT   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await conn.commit();
      console.log('[SQL] Table CARRITOS created');
    } catch (e) {
      if (e.message.includes('ORA-00955')) {
        console.log('[SQL] Table CARRITOS already exists');
      } else {
        throw e;
      }
    }
  });
}

// ── find or create ────────────────────────────────────────────────────────────

export async function findOrCreate(usuarioId) {
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, USUARIO_ID, DATA FROM CARRITOS WHERE USUARIO_ID = :1`,
      [usuarioId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
      return rowToCarrito(result.rows[0]);
    }

    // Crear carrito vacío
    const data = JSON.stringify({ items: [] });
    const insert = await conn.execute(
      `INSERT INTO CARRITOS (USUARIO_ID, DATA) VALUES (:1, :2) RETURNING ID INTO :id`,
      { 1: usuarioId, 2: data, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );

    const newId = insert.outBinds.id[0];
    return { _id: newId, usuarioId, items: [] };
  });
}

// ── get carrito ───────────────────────────────────────────────────────────────

export async function getCarrito(usuarioId) {
  return await withConnection(async (conn) => {
    const result = await conn.execute(
      `SELECT ID, USUARIO_ID, DATA FROM CARRITOS WHERE USUARIO_ID = :1`,
      [usuarioId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows.length > 0 ? rowToCarrito(result.rows[0]) : null;
  });
}

// ── agregar producto ──────────────────────────────────────────────────────────

export async function agregarProducto(usuarioId, producto, quantity) {
  const carrito = await findOrCreate(usuarioId);

  const items = carrito.items || [];
  const idx = items.findIndex(i => String(i.productoId) === String(producto._id));

  if (idx > -1) {
    items[idx].quantity += quantity;
    items[idx].updatedAt = new Date().toISOString();
  } else {
    items.push({
      productoId: String(producto._id),
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen || null,
      quantity,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return await _saveItems(usuarioId, items);
}

// ── eliminar producto ─────────────────────────────────────────────────────────

export async function eliminarProducto(usuarioId, productoId) {
  const carrito = await getCarrito(usuarioId);
  if (!carrito) throw new Error('Carrito no encontrado');

  const items = (carrito.items || []).filter(
    i => String(i.productoId) !== String(productoId)
  );

  return await _saveItems(usuarioId, items);
}

// ── actualizar cantidad ───────────────────────────────────────────────────────

export async function actualizarCantidad(usuarioId, productoId, quantity) {
  const carrito = await getCarrito(usuarioId);
  if (!carrito) throw new Error('Carrito no encontrado');

  let items = carrito.items || [];

  if (quantity <= 0) {
    items = items.filter(i => String(i.productoId) !== String(productoId));
  } else {
    const idx = items.findIndex(i => String(i.productoId) === String(productoId));
    if (idx > -1) {
      items[idx].quantity = quantity;
      items[idx].updatedAt = new Date().toISOString();
    }
  }

  return await _saveItems(usuarioId, items);
}

// ── vaciar carrito ────────────────────────────────────────────────────────────

export async function vaciarCarrito(usuarioId) {
  return await _saveItems(usuarioId, []);
}

// ── calcular total ────────────────────────────────────────────────────────────

export function calcularTotal(carrito) {
  return (carrito.items || []).reduce(
    (acc, item) => acc + item.precio * item.quantity,
    0
  );
}

// ── helper interno: guardar items ─────────────────────────────────────────────

async function _saveItems(usuarioId, items) {
  const data = JSON.stringify({ items });

  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE CARRITOS SET DATA = :1, UPDATED_AT = CURRENT_TIMESTAMP WHERE USUARIO_ID = :2`,
      [data, usuarioId],
      { autoCommit: true }
    );
  });

  return { usuarioId, items, total: calcularTotal({ items }) };
}
