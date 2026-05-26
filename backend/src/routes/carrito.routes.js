import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.middleware.js';
import * as carritoService from '../services/carrito.service.js';
import * as productoService from '../services/producto.service.js';

const router = Router();

// GET / — obtener carrito del usuario
router.get(
  '/',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const carrito = await carritoService.findOrCreate(req.user.id);
    res.json({
      success: true,
      data: carrito,
      itemCount: carrito.items.length,
      total: carritoService.calcularTotal(carrito),
    });
  })
);

// POST /add — agregar producto al carrito
router.post(
  '/add',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) throw new ValidationError('productId es requerido');
    if (quantity < 1) throw new ValidationError('La cantidad debe ser al menos 1');

    const producto = await productoService.obtenerPorId(productId);
    if (!producto) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        code: 'NOT_FOUND',
      });
    }

    if (producto.stock < quantity) {
      throw new ValidationError('Stock insuficiente');
    }

    // Descontar stock
    await productoService.actualizar(producto._id, { stock: producto.stock - quantity }, req.user.username);

    const carrito = await carritoService.agregarProducto(req.user.id, producto, quantity);

    res.json({
      success: true,
      data: carrito,
      message: 'Producto agregado al carrito',
    });
  })
);

// PATCH /:productId — actualizar cantidad de un item
router.patch(
  '/:productId',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) throw new ValidationError('quantity es requerido');

    // Restaurar stock del item anterior y ajustar con nueva cantidad
    const carritoActual = await carritoService.getCarrito(req.user.id);
    if (carritoActual) {
      const itemActual = carritoActual.items.find(i => String(i.productoId) === String(productId));
      if (itemActual) {
        const diferencia = quantity - itemActual.quantity;
        const producto = await productoService.obtenerPorId(productId);
        if (producto) {
          if (diferencia > 0 && producto.stock < diferencia) {
            throw new ValidationError('Stock insuficiente');
          }
          await productoService.actualizar(producto._id, { stock: producto.stock - diferencia }, req.user.username);
        }
      }
    }

    const carrito = await carritoService.actualizarCantidad(req.user.id, productId, quantity);

    res.json({
      success: true,
      data: carrito,
      message: quantity <= 0 ? 'Producto eliminado del carrito' : 'Cantidad actualizada',
    });
  })
);

// DELETE /:productId — eliminar un producto del carrito
router.delete(
  '/:productId',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { productId } = req.params;

    // Restaurar stock
    const carritoActual = await carritoService.getCarrito(req.user.id);
    if (carritoActual) {
      const item = carritoActual.items.find(i => String(i.productoId) === String(productId));
      if (item) {
        const producto = await productoService.obtenerPorId(productId);
        if (producto) {
          await productoService.actualizar(producto._id, { stock: producto.stock + item.quantity }, req.user.username);
        }
      }
    }

    await carritoService.eliminarProducto(req.user.id, productId);

    res.json({
      success: true,
      message: 'Producto eliminado del carrito',
    });
  })
);

// DELETE / — vaciar carrito completo
router.delete(
  '/',
  verifyJWT,
  asyncHandler(async (req, res) => {
    // Restaurar stock de todos los items
    const carritoActual = await carritoService.getCarrito(req.user.id);
    if (carritoActual && carritoActual.items.length > 0) {
      for (const item of carritoActual.items) {
        const producto = await productoService.obtenerPorId(item.productoId);
        if (producto) {
          await productoService.actualizar(producto._id, { stock: producto.stock + item.quantity }, req.user.username);
        }
      }
    }

    await carritoService.vaciarCarrito(req.user.id);

    res.json({
      success: true,
      message: 'Carrito vaciado',
    });
  })
);

export default router;
