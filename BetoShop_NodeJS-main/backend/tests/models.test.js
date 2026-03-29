import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import Producto from '../src/schemas/producto.schema.js';
import Usuario from '../src/schemas/usuario.schema.js';
import Promotion, { PROMOTION_TYPES } from '../src/schemas/promocion.schema.js';
import Carrito from '../src/schemas/carrito.schema.js';
import PasswordResetToken from '../src/schemas/passwordResetToken.schema.js';

let mongoServer;

beforeEach(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  await mongoose.disconnect();
  await new Promise(resolve => setTimeout(resolve, 100));
  if (mongoServer) {
    await mongoServer.stop();
  }
  await new Promise(resolve => setTimeout(resolve, 500));
});

afterAll(async () => {
  await mongoose.disconnect();
  await new Promise(resolve => setTimeout(resolve, 100));
  if (mongoServer) {
    await mongoServer.stop();
  }
  await new Promise(resolve => setTimeout(resolve, 500));
});

describe('📦 Producto Schema Tests', () => {
  
  describe('✅ Creación de producto con auditoría', () => {
    it('debe crear un producto con auditoría automática', async () => {
      const productoData = {
        nombre: 'Zapatilla Nike Air Max',
        descripcion: 'Zapatilla deportiva',
        precio: 149.99,
        categoria: 'Calzado',
        subcategoria: 'Deportivo',
        stock: 50,
      };

      const producto = new Producto(productoData);
      await producto.save();

      expect(producto._id).toBeDefined();
      expect(producto.audit.createdAt).toBeInstanceOf(Date);
      expect(producto.audit.updatedAt).toBeInstanceOf(Date);
      expect(producto.audit.createdBy).toBe('system');
      expect(producto.audit.updatedBy).toBe('system');
      expect(producto.audit.version).toBe(1);
      expect(producto.audit.isActive).toBe(true);
      expect(producto.audit.changeLog).toEqual([]);
    });

    it('debe asignar releaseDate automáticamente si no se proporciona', async () => {
      const producto = new Producto({
        nombre: 'Producto Test',
        precio: 99.99,
        stock: 10,
      });
      await producto.save();

      expect(producto.releaseDate).toBeInstanceOf(Date);
    });
  });

  describe('🔍 findById retorna producto activo', () => {
    it('debe encontrar producto activo por ID', async () => {
      const producto = new Producto({
        nombre: 'Producto Activo',
        precio: 100,
        stock: 10,
      });
      await producto.save();

      const encontrado = await Producto.findByIdActive(producto._id);
      expect(encontrado).toBeDefined();
      expect(encontrado.nombre).toBe('Producto Activo');
    });

    it('no debe encontrar producto con isActive: false', async () => {
      const producto = new Producto({
        nombre: 'Producto Inactivo',
        precio: 100,
        stock: 10,
      });
      await producto.save();
      await producto.softDelete('test');

      const encontrado = await Producto.findByIdActive(producto._id);
      expect(encontrado).toBeNull();
    });
  });

  describe('🔎 Búsqueda por nombre/categoría/subcategoría', () => {
    beforeEach(async () => {
      const productos = [
        { nombre: 'Zapatilla Nike Air', categoria: 'Calzado', subcategoria: 'Deportivo', precio: 150, stock: 10 },
        { nombre: 'Remera Nike Dri-Fit', categoria: 'Indumentaria', subcategoria: 'Camisetas', precio: 50, stock: 20 },
        { nombre: 'Zapatilla Adidas Ultraboost', categoria: 'Calzado', subcategoria: 'Running', precio: 200, stock: 15 },
        { nombre: 'Pantalon Adidas Training', categoria: 'Indumentaria', subcategoria: 'Pantalones', precio: 80, stock: 25 },
      ];

      for (const prod of productos) {
        const producto = new Producto(prod);
        await producto.save();
      }
    });

    it('debe buscar por nombre', async () => {
      const resultados = await Producto.search('Nike');
      expect(resultados.length).toBeGreaterThanOrEqual(2);
    });

    it('debe buscar por categoría', async () => {
      const resultados = await Producto.search('Calzado');
      expect(resultados.length).toBeGreaterThanOrEqual(2);
    });

    it('debe buscar por subcategoría', async () => {
      const resultados = await Producto.search('Running');
      expect(resultados.length).toBe(1);
    });

    it('debe buscar por texto parcial (case insensitive)', async () => {
      const resultados = await Producto.search('air');
      expect(resultados.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('📅 Productos release (últimos 30 días)', () => {
    it('debe encontrar productos release recientes', async () => {
      const hoy = new Date();
      const hace20Dias = new Date(hoy);
      hace20Dias.setDate(hace20Dias.getDate() - 20);

      const productoReciente = new Producto({
        nombre: 'Producto Reciente',
        precio: 100,
        stock: 10,
        releaseDate: hace20Dias,
      });
      await productoReciente.save();

      const releases = await Producto.findReleases(30);
      expect(releases.length).toBeGreaterThanOrEqual(1);
      expect(releases.some(p => p.nombre === 'Producto Reciente')).toBe(true);
    });

    it('no debe incluir productos de más de 30 días', async () => {
      const hace40Dias = new Date();
      hace40Dias.setDate(hace40Dias.getDate() - 40);

      const productoAntiguo = new Producto({
        nombre: 'Producto Antiguo',
        precio: 100,
        stock: 10,
        releaseDate: hace40Dias,
      });
      await productoAntiguo.save();

      const releases = await Producto.findReleases(30);
      expect(releases.some(p => p.nombre === 'Producto Antiguo')).toBe(false);
    });
  });

  describe('🗑️ Soft delete (isActive: false)', () => {
    it('debe marcar producto como inactivo', async () => {
      const producto = new Producto({
        nombre: 'Producto a Eliminar',
        precio: 100,
        stock: 10,
      });
      await producto.save();

      await producto.softDelete('admin');

      expect(producto.audit.isActive).toBe(false);
      expect(producto.audit.changeLog).toHaveLength(1);
      expect(producto.audit.changeLog[0].action).toBe('DELETE');
    });

    it('debe restaurar producto eliminado', async () => {
      const producto = new Producto({
        nombre: 'Producto a Restaurar',
        precio: 100,
        stock: 10,
      });
      await producto.save();
      await producto.softDelete('admin');
      await producto.restore('admin');

      expect(producto.audit.isActive).toBe(true);
      expect(producto.audit.changeLog[1].action).toBe('RESTORE');
    });
  });

  describe('📝 Versionamiento (optimistic locking)', () => {
    it('debe incrementar version en cada update', async () => {
      const producto = new Producto({
        nombre: 'Producto v1',
        precio: 100,
        stock: 10,
      });
      await producto.save();
      expect(producto.audit.version).toBe(1);

      producto.precio = 120;
      await producto.save();
      expect(producto.audit.version).toBe(2);

      producto.stock = 5;
      await producto.save();
      expect(producto.audit.version).toBe(3);
    });

    it('debe registrar cambios en changeLog', async () => {
      const producto = new Producto({
        nombre: 'Producto Log',
        precio: 100,
        stock: 10,
      });
      await producto.save();

      producto.precio = 150;
      producto.stock = 5;
      await producto.save();

      expect(producto.audit.changeLog.length).toBeGreaterThan(0);
      const lastChange = producto.audit.changeLog[producto.audit.changeLog.length - 1];
      expect(lastChange.action).toBe('UPDATE');
      expect(lastChange.modifiedBy).toBe('system');
    });
  });
});

describe('👤 Usuario Schema Tests', () => {

  describe('🔐 Registro con password hasheado (bcrypt)', () => {
    it('debe hashear password al guardar', async () => {
      const usuario = new Usuario({
        username: 'testuser',
        email: 'test@test.com',
        password: 'plainpassword123',
      });
      await usuario.save();

      expect(usuario.password).not.toBe('plainpassword123');
      expect(usuario.password.length).toBeGreaterThan(50);
    });

    it('debe verificar password correctamente', async () => {
      const usuario = new Usuario({
        username: 'testuser2',
        email: 'test2@test.com',
        password: 'secretpassword',
      });
      await usuario.save();

      const isMatch = await usuario.comparePassword('secretpassword');
      expect(isMatch).toBe(true);

      const isNotMatch = await usuario.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });
  });

  describe('🎭 Roles por defecto', () => {
    it('debe asignar ROLE_USER por defecto', async () => {
      const usuario = new Usuario({
        username: 'newuser',
        email: 'new@test.com',
        password: 'password123',
      });
      await usuario.save();

      expect(usuario.roles).toContain('ROLE_USER');
      expect(usuario.roles).toHaveLength(1);
    });

    it('debe permitir múltiples roles', async () => {
      const usuario = new Usuario({
        username: 'adminuser',
        email: 'admin@test.com',
        password: 'password123',
        roles: ['ROLE_ADMIN', 'ROLE_USER'],
      });
      await usuario.save();

      expect(usuario.hasRole('ROLE_ADMIN')).toBe(true);
      expect(usuario.hasRole('ROLE_USER')).toBe(true);
    });
  });

  describe('🔒 Seguridad password', () => {
    it('no debe exponer password en toJSON', async () => {
      const usuario = new Usuario({
        username: 'secureuser',
        email: 'secure@test.com',
        password: 'mypassword',
      });
      await usuario.save();

      const json = usuario.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.username).toBe('secureuser');
    });

    it('no debe encontrar usuario por password en query (select: false)', async () => {
      const usuario = new Usuario({
        username: 'hiddentest',
        email: 'hidden@test.com',
        password: 'secretpass',
      });
      await usuario.save();

      const found = await Usuario.findOne({ username: 'hiddentest' });
      expect(found.password).toBeUndefined();
    });
  });

  describe('🚫 Bloqueo de cuenta', () => {
    it('debe bloquear después de 5 intentos fallidos', async () => {
      const usuario = new Usuario({
        username: 'locktest',
        email: 'lock@test.com',
        password: 'password',
        failedLoginAttempts: 5,
      });
      await usuario.save();

      expect(usuario.isLockedAccount()).toBe(true);
    });

    it('debe desbloquear después de login exitoso', async () => {
      const usuario = new Usuario({
        username: 'unlocktest',
        email: 'unlock@test.com',
        password: 'password',
        failedLoginAttempts: 3,
      });
      await usuario.save();

      await usuario.recordSuccessfulLogin();
      
      expect(usuario.failedLoginAttempts).toBe(0);
      expect(usuario.isLocked).toBe(false);
    });
  });

  describe('🔍 Búsqueda de usuarios', () => {
    it('debe encontrar por email (case insensitive)', async () => {
      const usuario = new Usuario({
        username: 'emailtest',
        email: 'Test@Test.COM',
        password: 'password',
      });
      await usuario.save();

      const found = await Usuario.findByEmail('test@test.com');
      expect(found).toBeDefined();
      expect(found.username).toBe('emailtest');
    });

    it('no debe encontrar usuarios inactivos', async () => {
      const usuario = new Usuario({
        username: 'inactivetest',
        email: 'inactive@test.com',
        password: 'password',
      });
      await usuario.save();
      await usuario.softDelete('admin');

      const found = await Usuario.findByEmail('inactive@test.com');
      expect(found).toBeNull();
    });
  });
});

describe('🎁 Promotion Schema Tests', () => {

  describe('📅 Promociones activas por fecha', () => {
    it('debe encontrar promociones activas', async () => {
      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const promocion = new Promotion({
        title: 'Promo Activa',
        description: 'Descuento activo',
        type: PROMOTION_TYPES.BANNER,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      });
      await promocion.save();

      const activas = await Promotion.findActive();
      expect(activas.length).toBeGreaterThanOrEqual(1);
    });

    it('no debe encontrar promociones expiradas', async () => {
      const promocion = new Promotion({
        title: 'Promo Expirada',
        type: PROMOTION_TYPES.BANNER,
        startDate: new Date(Date.now() - 172800000),
        endDate: new Date(Date.now() - 86400000),
      });
      await promocion.save();

      const activas = await Promotion.findActive();
      expect(activas.some(p => p.title === 'Promo Expirada')).toBe(false);
    });
  });

  describe('💰 Descuento como porcentaje', () => {
    it('debe validar rango de descuento (0-100)', async () => {
      const promo = new Promotion({
        title: 'Test Descuento',
        type: PROMOTION_TYPES.PRODUCT_DISCOUNT,
        discountPercentage: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      });
      await promo.save();

      expect(promo.discountPercentage).toBe(50);
      expect(promo.discountPercentage).toBeGreaterThanOrEqual(0);
      expect(promo.discountPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('📸 Imágenes de promoción', () => {
    it('debe guardar imágenes relacionadas', async () => {
      const promo = new Promotion({
        title: 'Promo con Imagenes',
        type: PROMOTION_TYPES.BANNER,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        images: [
          { url: 'https://example.com/img1.jpg', alt: 'Banner 1' },
          { url: 'https://example.com/img2.jpg', alt: 'Banner 2' },
        ],
      });
      await promo.save();

      expect(promo.images).toHaveLength(2);
      expect(promo.images[0].url).toBe('https://example.com/img1.jpg');
    });
  });

  describe('🔍 Filtrado por tipo y categoría', () => {
    it('debe filtrar por tipo', async () => {
      await Promotion.create({
        title: 'Banner Promo',
        type: PROMOTION_TYPES.BANNER,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      });

      await Promotion.create({
        title: 'Category Promo',
        type: PROMOTION_TYPES.CATEGORY_DISCOUNT,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      });

      const banners = await Promotion.findActiveByType(PROMOTION_TYPES.BANNER);
      expect(banners.length).toBeGreaterThanOrEqual(1);
      expect(banners[0].type).toBe(PROMOTION_TYPES.BANNER);
    });
  });
});

describe('🛒 Carrito Schema Tests', () => {

  describe('➕ Agregar productos', () => {
    it('debe agregar producto al carrito', async () => {
      const producto = new Producto({
        nombre: 'Producto Carrito',
        precio: 100,
        stock: 10,
      });
      await producto.save();

      const carrito = new Carrito({
        items: [],
      });
      await carrito.save();

      await carrito.agregarProducto(producto._id, 2);

      expect(carrito.items).toHaveLength(1);
      expect(carrito.items[0].quantity).toBe(2);
    });

    it('debe incrementar cantidad si producto ya existe', async () => {
      const producto = new Producto({
        nombre: 'Producto Duplicado',
        precio: 100,
        stock: 10,
      });
      await producto.save();

      const carrito = new Carrito({
        items: [{ producto: producto._id, quantity: 1 }],
      });
      await carrito.save();

      await carrito.agregarProducto(producto._id, 3);

      expect(carrito.items).toHaveLength(1);
      expect(carrito.items[0].quantity).toBe(4);
    });
  });

  describe('➖ Eliminar productos', () => {
    it('debe eliminar producto del carrito', async () => {
      const producto = new Producto({
        nombre: 'Producto Eliminar',
        precio: 100,
        stock: 10,
      });
      await producto.save();

      const carrito = new Carrito({
        items: [{ producto: producto._id, quantity: 2 }],
      });
      await carrito.save();

      await carrito.eliminarProducto(producto._id);

      expect(carrito.items).toHaveLength(0);
    });
  });

  describe('🔄 Vaciar carrito', () => {
    it('debe vaciar todos los items', async () => {
      const producto1 = new Producto({ nombre: 'Prod 1', precio: 100, stock: 10 });
      const producto2 = new Producto({ nombre: 'Prod 2', precio: 50, stock: 10 });
      await producto1.save();
      await producto2.save();

      const carrito = new Carrito({
        items: [
          { producto: producto1._id, quantity: 1 },
          { producto: producto2._id, quantity: 2 },
        ],
      });
      await carrito.save();

      await carrito.vaciar();

      expect(carrito.items).toHaveLength(0);
    });
  });
});

describe('🔑 Password Reset Token Tests', () => {

  describe('🎫 Creación de token', () => {
    it('debe crear token con expiración de 1 hora', async () => {
      const usuario = new Usuario({
        username: 'resettest',
        email: 'reset@test.com',
        password: 'password',
      });
      await usuario.save();

      const token = await PasswordResetToken.createToken(usuario._id, usuario.email);

      expect(token.token).toBeDefined();
      expect(token.token.length).toBeGreaterThan(10);
      expect(token.expiresAt).toBeInstanceOf(Date);
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('debe invalidar tokens anteriores al crear nuevo', async () => {
      const usuario = new Usuario({
        username: 'multiplereset',
        email: 'multiplereset@test.com',
        password: 'password',
      });
      await usuario.save();

      const token1 = await PasswordResetToken.createToken(usuario._id, usuario.email);
      const token2 = await PasswordResetToken.createToken(usuario._id, usuario.email);

      const tokens = await PasswordResetToken.findByEmail(usuario.email);
      expect(tokens.length).toBe(1);
      expect(tokens[0]._id.toString()).toBe(token2._id.toString());
    });
  });

  describe('✅ Validación de token', () => {
    it('debe marcar token como usado', async () => {
      const usuario = new Usuario({
        username: 'usedtoken',
        email: 'usedtoken@test.com',
        password: 'password',
      });
      await usuario.save();

      const token = await PasswordResetToken.createToken(usuario._id, usuario.email);
      await token.markAsUsed();

      expect(token.isUsed).toBe(true);
    });

    it('debe invalidar token expirado', async () => {
      const usuario = new Usuario({
        username: 'expiredtoken',
        email: 'expiredtoken@test.com',
        password: 'password',
      });
      await usuario.save();

      const token = new PasswordResetToken({
        usuario: usuario._id,
        email: usuario.email,
        expiresAt: new Date(Date.now() - 1000),
      });
      await token.save();

      expect(token.isValid()).toBe(false);
    });
  });
});

describe('📋 Auditoría Tests', () => {

  describe('🏷️ Bloque de auditoría obligatorio', () => {
    it('Producto debe tener estructura de auditoría completa', async () => {
      const producto = new Producto({
        nombre: 'Audit Test',
        precio: 100,
        stock: 10,
      });
      await producto.save();

      expect(producto.audit).toBeDefined();
      expect(producto.audit.createdAt).toBeInstanceOf(Date);
      expect(producto.audit.updatedAt).toBeInstanceOf(Date);
      expect(producto.audit.createdBy).toBeDefined();
      expect(producto.audit.updatedBy).toBeDefined();
      expect(producto.audit.version).toBe(1);
      expect(producto.audit.isActive).toBe(true);
      expect(Array.isArray(producto.audit.changeLog)).toBe(true);
    });

    it('Usuario debe tener estructura de auditoría completa', async () => {
      const usuario = new Usuario({
        username: 'audituser',
        email: 'audituser@test.com',
        password: 'password',
      });
      await usuario.save();

      expect(usuario.audit.createdAt).toBeInstanceOf(Date);
      expect(usuario.audit.updatedAt).toBeInstanceOf(Date);
      expect(usuario.audit.version).toBe(1);
      expect(usuario.audit.isActive).toBe(true);
    });

    it('Promotion debe tener estructura de auditoría completa', async () => {
      const promocion = new Promotion({
        title: 'Audit Promo',
        type: PROMOTION_TYPES.BANNER,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      });
      await promocion.save();

      expect(promocion.audit.createdAt).toBeInstanceOf(Date);
      expect(promocion.audit.updatedAt).toBeInstanceOf(Date);
      expect(promocion.audit.version).toBe(1);
      expect(promocion.audit.isActive).toBe(true);
    });
  });
});
