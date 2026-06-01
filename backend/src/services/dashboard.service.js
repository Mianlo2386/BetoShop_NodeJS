import oracledb from 'oracledb';
import { withConnection } from '../config/database.js';

export async function getStats() {
  return await withConnection(async (conn) => {

    // Productos
    const productos = await conn.execute(
      `SELECT
        COUNT(*) AS TOTAL,
        SUM(CASE WHEN CAST(JSON_VALUE(DATA, '$.stock') AS NUMBER) <= 5 THEN 1 ELSE 0 END) AS STOCK_BAJO,
        AVG(CAST(JSON_VALUE(DATA, '$.precio') AS NUMBER)) AS PRECIO_PROMEDIO,
        MIN(CAST(JSON_VALUE(DATA, '$.precio') AS NUMBER)) AS PRECIO_MIN,
        MAX(CAST(JSON_VALUE(DATA, '$.precio') AS NUMBER)) AS PRECIO_MAX,
        SUM(CAST(JSON_VALUE(DATA, '$.stock') AS NUMBER)) AS STOCK_TOTAL
       FROM PRODUCTOS
       WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Categorías
    const categorias = await conn.execute(
      `SELECT COUNT(DISTINCT JSON_VALUE(DATA, '$.categoria')) AS TOTAL
       FROM PRODUCTOS
       WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true'
         AND JSON_VALUE(DATA, '$.categoria') IS NOT NULL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Contactos
    const contactos = await conn.execute(
      `SELECT
        COUNT(*) AS TOTAL,
        SUM(CASE WHEN LEIDO = 0 THEN 1 ELSE 0 END) AS NO_LEIDOS
       FROM CONTACTOS`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Contactos últimos 7 días
    const contactosRecientes = await conn.execute(
      `SELECT COUNT(*) AS TOTAL FROM CONTACTOS
       WHERE CREATED_AT >= CURRENT_TIMESTAMP - INTERVAL '7' DAY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Promociones
    const promociones = await conn.execute(
      `SELECT
        COUNT(*) AS TOTAL,
        SUM(CASE WHEN JSON_VALUE(DATA, '$.isActive') = 'true'
                  AND JSON_VALUE(DATA, '$.startDate') <= :1
                  AND JSON_VALUE(DATA, '$.endDate') >= :2
             THEN 1 ELSE 0 END) AS ACTIVAS_HOY,
        SUM(CASE WHEN JSON_VALUE(DATA, '$.isActive') = 'true'
                  AND JSON_VALUE(DATA, '$.endDate') >= :3
                  AND JSON_VALUE(DATA, '$.endDate') <= :4
             THEN 1 ELSE 0 END) AS VENCEN_PRONTO
       FROM PROMOCIONES
       WHERE JSON_VALUE(DATA, '$.audit.isActive') = 'true'`,
      [
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Usuarios
    const usuarios = await conn.execute(
      `SELECT
        COUNT(*) AS TOTAL,
        SUM(CASE WHEN CREATED_AT >= CURRENT_TIMESTAMP - INTERVAL '30' DAY THEN 1 ELSE 0 END) AS NUEVOS
       FROM USUARIOS
       WHERE IS_ACTIVE = 1`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Carritos activos con items
    const carritos = await conn.execute(
      `SELECT COUNT(*) AS TOTAL FROM CARRITOS
       WHERE JSON_VALUE(DATA, '$.items[0].productoId') IS NOT NULL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const p = productos.rows[0];
    const c = contactos.rows[0];
    const pr = promociones.rows[0];
    const u = usuarios.rows[0];

    return {
      productos: {
        total: p.TOTAL || 0,
        stockBajo: p.STOCK_BAJO || 0,
        stockTotal: p.STOCK_TOTAL || 0,
        precioPromedio: Math.round((p.PRECIO_PROMEDIO || 0) * 100) / 100,
        precioMin: p.PRECIO_MIN || 0,
        precioMax: p.PRECIO_MAX || 0,
        categorias: categorias.rows[0].TOTAL || 0,
      },
      contactos: {
        total: c.TOTAL || 0,
        noLeidos: c.NO_LEIDOS || 0,
        ultimosSieteDias: contactosRecientes.rows[0].TOTAL || 0,
      },
      promociones: {
        total: pr.TOTAL || 0,
        activasHoy: pr.ACTIVAS_HOY || 0,
        vencenPronto: pr.VENCEN_PRONTO || 0,
      },
      usuarios: {
        total: u.TOTAL || 0,
        nuevosUltimos30Dias: u.NUEVOS || 0,
      },
      carritos: {
        activos: carritos.rows[0].TOTAL || 0,
      },
    };
  });
}
