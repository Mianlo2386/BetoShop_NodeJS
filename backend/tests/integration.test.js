import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

const testApp = express();
testApp.use(express.json());
testApp.use(cookieParser());

beforeEach(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('🔌 API Integration Tests', () => {

  describe('GET /api/productos', () => {
    it('debe retornar lista vacía si no hay productos', async () => {
      const { default: productoRoutes } = await import('../src/routes/productos.routes.js');
      
      testApp.use('/api/productos', productoRoutes);
      
      const response = await request(testApp)
        .get('/api/productos');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/productos/search', () => {
    it('debe buscar productos por nombre', async () => {
      const { default: productoRoutes } = await import('../src/routes/productos.routes.js');
      
      testApp.use('/api/productos', productoRoutes);
      
      const response = await request(testApp)
        .get('/api/productos/search?q=test');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/productos/categoria/:categoria', () => {
    it('debe filtrar por categoría', async () => {
      const { default: productoRoutes } = await import('../src/routes/productos.routes.js');
      
      testApp.use('/api/productos', productoRoutes);
      
      const response = await request(testApp)
        .get('/api/productos/categoria/Decoración');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('🔐 Auth API Contract', () => {

  describe('POST /api/auth/login', () => {
    it('debe requerir username y password', async () => {
      const { default: authRoutes } = await import('../src/routes/auth.routes.js');
      
      testApp.use('/api/auth', authRoutes);
      
      const response = await request(testApp)
        .post('/api/auth/login')
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('debe rechazar credenciales inválidas', async () => {
      const { default: authRoutes } = await import('../src/routes/auth.routes.js');
      
      testApp.use('/api/auth', authRoutes);
      
      const response = await request(testApp)
        .post('/api/auth/login')
        .send({ username: 'invalid', password: 'invalid' });
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('debe validar email correctamente', async () => {
      const { default: authRoutes } = await import('../src/routes/auth.routes.js');
      
      testApp.use('/api/auth', authRoutes);
      
      const response = await request(testApp)
        .post('/api/auth/register')
        .send({ username: 'test', email: 'invalid-email', password: 'password123' });
      
      expect(response.status).toBe(400);
    });

    it('debe rechazar password corta', async () => {
      const { default: authRoutes } = await import('../src/routes/auth.routes.js');
      
      testApp.use('/api/auth', authRoutes);
      
      const response = await request(testApp)
        .post('/api/auth/register')
        .send({ username: 'test', email: 'test@test.com', password: '123' });
      
      expect(response.status).toBe(400);
    });
  });
});

describe('📦 Maintenance Mode Contract', () => {
  
  it('debe tener MODO_CONSULTA_ACTIVO en true', async () => {
    const { MODO_CONSULTA_ACTIVO } = await import('../src/middleware/readOnly.middleware.js');
    expect(MODO_CONSULTA_ACTIVO).toBe(true);
  });

  it('debe bloquear POST en modo mantenimiento', async () => {
    const { readOnlyMiddleware } = await import('../src/middleware/readOnly.middleware.js');
    
    const mockReq = { method: 'POST' };
    const mockRes = {
      status: (code) => ({
        json: (data) => expect(data.status).toBe('maintenance')
      })
    };
    const mockNext = () => {};
    
    readOnlyMiddleware(mockReq, mockRes, mockNext);
  });

  it('debe bloquear PUT en modo mantenimiento', async () => {
    const { readOnlyMiddleware } = await import('../src/middleware/readOnly.middleware.js');
    
    const mockReq = { method: 'PUT' };
    const mockRes = {
      status: (code) => ({
        json: (data) => expect(data.status).toBe('maintenance')
      })
    };
    const mockNext = () => {};
    
    readOnlyMiddleware(mockReq, mockRes, mockNext);
  });

  it('debe bloquear DELETE en modo mantenimiento', async () => {
    const { readOnlyMiddleware } = await import('../src/middleware/readOnly.middleware.js');
    
    const mockReq = { method: 'DELETE' };
    const mockRes = {
      status: (code) => ({
        json: (data) => expect(data.status).toBe('maintenance')
      })
    };
    const mockNext = () => {};
    
    readOnlyMiddleware(mockReq, mockRes, mockNext);
  });

  it('debe permitir GET en modo mantenimiento', async () => {
    const { readOnlyMiddleware } = await import('../src/middleware/readOnly.middleware.js');
    
    const mockReq = { method: 'GET' };
    let nextCalled = false;
    const mockNext = () => { nextCalled = true; };
    
    readOnlyMiddleware(mockReq, {}, mockNext);
    expect(nextCalled).toBe(true);
  });
});

describe('🍪 Cookies HttpOnly Security', () => {
  
  it('debe usar COOKIE_OPTIONS con HttpOnly', async () => {
    const cookieParser = await import('cookie-parser');
    const { COOKIE_OPTIONS } = await import('../src/routes/auth.routes.js');
    
    expect(COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(COOKIE_OPTIONS.sameSite).toBe('strict');
    expect(COOKIE_OPTIONS.path).toBe('/');
  });

  it('debe tener extractToken disponible', async () => {
    const { extractToken } = await import('../src/middleware/auth.middleware.js');
    expect(typeof extractToken).toBe('function');
  });
});
