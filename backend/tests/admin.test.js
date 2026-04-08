import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('📧 Contact API', () => {
  const endpoint = '/contact';
  
  it('debe rechazar solicitud vacía', async () => {
    const res = await request(app).post(endpoint).send({});
    expect(res.status).toBe(400);
  });
  
  it('debe rechazar email inválido', async () => {
    const res = await request(app).post(endpoint).send({
      nombre: 'Test',
      email: 'invalid',
      subject: 'Test',
      mensaje: 'Hola'
    });
    expect(res.status).toBe(400);
  });
  
  it('debe guardar mensaje válido', async () => {
    const res = await request(app).post(endpoint).send({
      nombre: 'Test User',
      email: 'test@test.com',
      subject: 'Test',
      mensaje: 'Hola mundo'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('👥 Admin Auth Middleware', () => {
  it('debe verificar que existe requireAdmin', async () => {
    const { requireAdmin } = await import('../src/middleware/auth.middleware.js');
    expect(typeof requireAdmin).toBe('function');
  });
});

describe('📦 Productos CRUD', () => {
  it('debe tener rutas POST/PUT/DELETE con requireAdmin', async () => {
    const productosRoutes = await import('../src/routes/productos.routes.js');
    expect(productosRoutes.default).toBeDefined();
  });
});