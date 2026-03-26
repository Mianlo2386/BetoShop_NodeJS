import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { readOnlyMiddleware, MODO_CONSULTA_ACTIVO } from '../src/middleware/readOnly.middleware.js';

const testApp = express();
testApp.use(express.json());
testApp.use((req, res, next) => {
  req.body = {};
  next();
});
testApp.post('/test', readOnlyMiddleware, (req, res) => {
  res.json({ success: true });
});
testApp.put('/test', readOnlyMiddleware, (req, res) => {
  res.json({ success: true });
});
testApp.patch('/test', readOnlyMiddleware, (req, res) => {
  res.json({ success: true });
});
testApp.delete('/test', readOnlyMiddleware, (req, res) => {
  res.json({ success: true });
});
testApp.get('/test', readOnlyMiddleware, (req, res) => {
  res.json({ success: true });
});

describe('🔧 Maintenance Mode Middleware Tests', () => {

  describe('📋 Feature Toggle Validation', () => {

    it('debe tener MODO_CONSULTA_ACTIVO definido como boolean', () => {
      expect(typeof MODO_CONSULTA_ACTIVO).toBe('boolean');
    });

    it('debe tener MODO_CONSULTA_ACTIVO en TRUE por defecto', () => {
      expect(MODO_CONSULTA_ACTIVO).toBe(true);
    });
  });

  describe('🚫 Bloqueo de mutaciones en modo mantenimiento', () => {

    it('debe bloquear POST con status 503 y response maintenance', async () => {
      const response = await request(testApp)
        .post('/test')
        .send({});

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('maintenance');
      expect(response.body.message).toBe('Plataforma en preparación');
      expect(response.body.code).toBe('MAINTENANCE_MODE');
    });

    it('debe bloquear PUT con status 503 y response maintenance', async () => {
      const response = await request(testApp)
        .put('/test')
        .send({});

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('maintenance');
      expect(response.body.message).toBe('Plataforma en preparación');
    });

    it('debe bloquear PATCH con status 503 y response maintenance', async () => {
      const response = await request(testApp)
        .patch('/test')
        .send({});

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('maintenance');
    });

    it('debe bloquear DELETE con status 503 y response maintenance', async () => {
      const response = await request(testApp)
        .delete('/test');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('maintenance');
    });
  });

  describe('✅ Permitir operaciones GET en modo mantenimiento', () => {

    it('debe permitir GET cuando MODO_CONSULTA_ACTIVO es TRUE', async () => {
      const response = await request(testApp)
        .get('/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('📦 Estructura del response de mantenimiento', () => {

    it('debe incluir todos los campos requeridos en response', async () => {
      const response = await request(testApp)
        .post('/test');

      expect(response.body).toHaveProperty('status', 'maintenance');
      expect(response.body).toHaveProperty('message', 'Plataforma en preparación');
      expect(response.body).toHaveProperty('code', 'MAINTENANCE_MODE');
    });

    it('debe incluir hint explicativo', async () => {
      const response = await request(testApp)
        .post('/test');

      expect(response.body).toHaveProperty('hint');
      expect(response.body.hint).toContain('consulta');
    });
  });
});
