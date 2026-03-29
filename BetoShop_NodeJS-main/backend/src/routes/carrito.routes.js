import { Router } from 'express';
import Carrito from '../schemas/carrito.schema.js';
import Producto from '../schemas/producto.schema.js';
import { verifyJWT, optionalAuth } from '../middleware/auth.middleware.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.middleware.js';

const router = Router();

router.get(
  '/',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const carrito = await Carrito.findOrCreate(req.user.id, null);

    res.json({
      success: true,
      data: carrito,
      itemCount: carrito.items.length,
    });
  })
);

router.post(
  '/add',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      throw new ValidationError('ProductId es requerido');
    }

    if (quantity < 1) {
      throw new ValidationError('La cantidad debe ser al menos 1');
    }

    const producto = await Producto.findByIdActive(productId);

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

    let carrito = await Carrito.findOrCreate(req.user.id, null);
    await carrito.agregarProducto(productId, quantity);

    producto.stock -= quantity;
    await producto.save();

    carrito = await Carrito.findByUsuario(req.user.id);

    res.json({
      success: true,
      data: carrito,
      message: 'Producto agregado al carrito',
    });
  })
);

router.delete(
  '/:productId',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const carrito = await Carrito.findByUsuario(req.user.id);

    if (!carrito) {
      return res.status(404).json({
        success: false,
        error: 'Carrito no encontrado',
        code: 'NOT_FOUND',
      });
    }

    const item = carrito.items.find(
      (i) => i.producto.toString() === productId
    );

    if (item) {
      const producto = await Producto.findByIdActive(productId);
      if (producto) {
        producto.stock += item.quantity;
        await producto.save();
      }
    }

    await carrito.eliminarProducto(productId);

    res.json({
      success: true,
      message: 'Producto eliminado del carrito',
    });
  })
);

router.delete(
  '/',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const carrito = await Carrito.findByUsuario(req.user.id);

    if (!carrito) {
      return res.status(404).json({
        success: false,
        error: 'Carrito no encontrado',
        code: 'NOT_FOUND',
      });
    }

    await carrito.vaciar();

    res.json({
      success: true,
      message: 'Carrito vaciado',
    });
  })
);

export default router;
