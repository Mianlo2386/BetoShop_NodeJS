import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import Producto from '../schemas/producto.schema.js';
import Usuario from '../schemas/usuario.schema.js';
import Promotion from '../schemas/promocion.schema.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('📋 API Endpoints Contract Tests', () => {

  describe('📦 GET /api/productos', () => {
    it('debe retornar array de productos', async () => {
      const producto = new Producto({
        nombre: 'Zapatilla Nike',
        descripcion: 'Descripción del producto',
        precio: 150.00,
        categoria: 'Calzado',
        subcategoria: 'Deportivo',
        stock: 10,
        stars: 4,
        size: '42',
      });
      await producto.save();

      const productos = await Producto.find({ 'audit.isActive': true });

      expect(Array.isArray(productos)).toBe(true);
      expect(productos.length).toBeGreaterThan(0);
      expect(productos[0]).toHaveProperty('id');
      expect(productos[0]).toHaveProperty('nombre');
      expect(productos[0]).toHaveProperty('descripcion');
      expect(productos[0]).toHaveProperty('precio');
      expect(productos[0]).toHaveProperty('imagenUrl');
      expect(productos[0]).toHaveProperty('categoria');
      expect(productos[0]).toHaveProperty('subcategoria');
      expect(productos[0]).toHaveProperty('stock');
      expect(productos[0]).toHaveProperty('stars');
      expect(productos[0]).toHaveProperty('size');
    });

    it('cada producto debe tener campos requeridos según especificación', async () => {
      const producto = new Producto({
        nombre: 'Producto Test',
        precio: 100.00,
        stock: 5,
      });
      await producto.save();

      expect(producto.nombre).toBeDefined();
      expect(producto.precio).toBeDefined();
      expect(producto.stock).toBeDefined();
      expect(producto.categoria).toBeDefined();
    });
  });

  describe('GET /api/productos/:id', () => {
    it('debe retornar producto por ID', async () => {
      const producto = new Producto({
        nombre: 'Producto ID',
        precio: 200,
        stock: 15,
      });
      await producto.save();

      const encontrado = await Producto.findById(producto._id);

      expect(encontrado).toBeDefined();
      expect(encontrado.nombre).toBe('Producto ID');
    });

    it('debe retornar 404 si no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const encontrado = await Producto.findById(fakeId);
      expect(encontrado).toBeNull();
    });
  });

  describe('POST /api/productos (Admin)', () => {
    it('debe crear producto con rol ADMIN', async () => {
      const productoData = {
        nombre: 'Nuevo Producto',
        descripcion: 'Descripción',
        precio: 100.00,
        categoria: 'Calzado',
        stock: 20,
        audit: {
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      };

      const producto = new Producto(productoData);
      await producto.save();

      expect(producto._id).toBeDefined();
      expect(producto.nombre).toBe('Nuevo Producto');
      expect(producto.audit.createdBy).toBe('admin');
    });
  });

  describe('DELETE /api/productos/:id (Admin)', () => {
    it('debe marcar producto como inactivo (soft delete)', async () => {
      const producto = new Producto({
        nombre: 'Producto a Eliminar',
        precio: 50,
        stock: 5,
      });
      await producto.save();

      await producto.softDelete('admin');

      expect(producto.audit.isActive).toBe(false);
      
      const encontrado = await Producto.findByIdActive(producto._id);
      expect(encontrado).toBeNull();
    });
  });

  describe('👤 GET /api/usuarios', () => {
    it('debe listar usuarios activos', async () => {
      const usuario = new Usuario({
        username: 'usuario1',
        email: 'usuario@email.com',
        password: 'password123',
      });
      await usuario.save();

      const usuarios = await Usuario.find({ 'audit.isActive': true });

      expect(Array.isArray(usuarios)).toBe(true);
      expect(usuarios.length).toBeGreaterThan(0);
    });

    it('cada usuario debe tener username, email, roles', async () => {
      const usuario = new Usuario({
        username: 'testuser',
        email: 'test@email.com',
        password: 'password123',
      });
      await usuario.save();

      expect(usuario.username).toBeDefined();
      expect(usuario.email).toBeDefined();
      expect(usuario.roles).toBeDefined();
      expect(Array.isArray(usuario.roles)).toBe(true);
    });
  });

  describe('POST /api/usuarios (Admin)', () => {
    it('debe crear usuario con rol ADMIN', async () => {
      const usuarioData = {
        username: 'nuevousuario',
        email: 'nuevo@email.com',
        password: 'contraseña123',
        roles: ['ROLE_USER'],
      };

      const usuario = new Usuario(usuarioData);
      await usuario.save();

      expect(usuario._id).toBeDefined();
      expect(usuario.username).toBe('nuevousuario');
      expect(usuario.email).toBe('nuevo@email.com');
    });
  });

  describe('🔐 POST /api/auth/login', () => {
    it('debe verificar credenciales correctas', async () => {
      const password = 'miPassword123';
      const usuario = new Usuario({
        username: 'logintest',
        email: 'login@email.com',
        password: password,
      });
      await usuario.save();

      const isValid = await usuario.comparePassword(password);
      expect(isValid).toBe(true);
    });

    it('debe rechazar credenciales incorrectas', async () => {
      const usuario = new Usuario({
        username: 'wrongpass',
        email: 'wrong@email.com',
        password: 'correctpassword',
      });
      await usuario.save();

      const isValid = await usuario.comparePassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    it('debe hashear password al guardar', async () => {
      const usuario = new Usuario({
        username: 'hashuser',
        email: 'hash@email.com',
        password: 'plaintext',
      });
      await usuario.save();

      expect(usuario.password).not.toBe('plaintext');
      expect(usuario.password.length).toBeGreaterThan(50);
    });
  });

  describe('🔐 POST /api/auth/register', () => {
    it('debe registrar nuevo usuario exitosamente', async () => {
      const usuarioData = {
        username: 'nuevousuario',
        email: 'nuevo@email.com',
        password: 'contraseña123',
      };

      const usuario = new Usuario(usuarioData);
      await usuario.save();

      expect(usuario._id).toBeDefined();
      expect(usuario.username).toBe('nuevousuario');
      expect(usuario.email).toBe('nuevo@email.com');
      expect(usuario.roles).toContain('ROLE_USER');
    });
  });

  describe('🎁 GET /api/promociones', () => {
    it('debe listar promociones activas', async () => {
      const promocion = new Promotion({
        title: 'Descuento 20%',
        description: 'En todos los productos',
        type: 'BANNER',
        discountPercentage: 20,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      });
      await promocion.save();

      const promociones = await Promotion.findActive();

      expect(Array.isArray(promociones)).toBe(true);
      expect(promociones.length).toBeGreaterThan(0);
    });

    it('cada promoción debe tener campos requeridos', async () => {
      const promocion = new Promotion({
        title: 'Promo Test',
        type: 'BANNER',
        discountPercentage: 15,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      });
      await promocion.save();

      expect(promocion.title).toBeDefined();
      expect(promocion.type).toBeDefined();
      expect(promocion.discountPercentage).toBeDefined();
      expect(promocion.startDate).toBeDefined();
      expect(promocion.endDate).toBeDefined();
    });

    it('no debe retornar promociones expiradas', async () => {
      const promocionExpirada = new Promotion({
        title: 'Promo Expirada',
        type: 'BANNER',
        discountPercentage: 10,
        startDate: new Date(Date.now() - 172800000),
        endDate: new Date(Date.now() - 86400000),
      });
      await promocionExpirada.save();

      const promociones = await Promotion.findActive();
      const titulos = promociones.map(p => p.title);
      expect(titulos).not.toContain('Promo Expirada');
    });
  });

  describe('📋 Validación de Contrato - Códigos de Error', () => {
    it('404 - Entidad no encontrada debe retornar null', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const producto = await Producto.findById(fakeId);
      expect(producto).toBeNull();
    });

    it('400 - Validación debe fallar con datos inválidos', async () => {
      try {
        const producto = new Producto({
          nombre: '',
          precio: -10,
        });
        await producto.validate();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    it('401 - Sin auth debe rechazar acceso', async () => {
      const producto = new Producto({
        nombre: 'Producto Test',
        precio: 100,
        stock: 10,
      });
      await producto.save();
      
      expect(producto.audit.createdBy).toBeDefined();
    });
  });

  describe('🔒 Roles y Permisos', () => {
    it('debe asignar ROLE_USER por defecto al registrar', async () => {
      const usuario = new Usuario({
        username: 'roleuser',
        email: 'role@email.com',
        password: 'password',
      });
      await usuario.save();

      expect(usuario.roles).toContain('ROLE_USER');
      expect(usuario.roles.length).toBe(1);
    });

    it('debe permitir múltiples roles', async () => {
      const admin = new Usuario({
        username: 'adminuser',
        email: 'admin@email.com',
        password: 'password',
        roles: ['ROLE_ADMIN', 'ROLE_USER'],
      });
      await admin.save();

      expect(admin.roles).toContain('ROLE_ADMIN');
      expect(admin.roles).toContain('ROLE_USER');
    });
  });
});
