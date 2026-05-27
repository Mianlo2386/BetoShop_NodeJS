import { Router } from 'express';
import { optionalAuth, verifyJWT, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.middleware.js';
import * as promocionService from '../services/promocion.service.js';

const router = Router();

export const PROMOTION_TYPES = [
  'BANNER',
  'CATEGORY_DISCOUNT',
  'PRODUCT_DISCOUNT',
  'FLASH_SALE',
  'BUY_ONE_GET_ONE',
];

// GET / — listar promociones activas (público)
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { type } = req.query;
    const promociones = type
      ? await promocionService.findActiveByType(type)
      : await promocionService.findActive();
    res.json({
      success: true,
      data: promociones,
      total: promociones.length,
    });
  })
);

// GET /admin — listar todas (admin)
router.get(
  '/admin',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const resultado = await promocionService.obtenerTodas({
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.json({ success: true, ...resultado });
  })
);

// GET /:id — obtener por ID (público)
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const promocion = await promocionService.obtenerPorId(req.params.id);
    if (!promocion) {
      return res.status(404).json({
        success: false,
        error: 'Promoción no encontrada',
        code: 'NOT_FOUND',
      });
    }
    res.json({ success: true, data: promocion });
  })
);

// POST / — crear promoción (admin)
router.post(
  '/',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { title, description, type, discountPercentage, category, startDate, endDate, images } = req.body;

    if (!title) throw new ValidationError('El título es requerido');
    if (!type) throw new ValidationError('El tipo es requerido');
    if (!PROMOTION_TYPES.includes(type)) {
      throw new ValidationError(`Tipo inválido. Válidos: ${PROMOTION_TYPES.join(', ')}`);
    }
    if (!startDate || !endDate) throw new ValidationError('Las fechas de inicio y fin son requeridas');
    if (new Date(startDate) >= new Date(endDate)) {
      throw new ValidationError('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    const promocion = await promocionService.crear(
      { title, description, type, discountPercentage, category, startDate, endDate, images: images || [] },
      req.user.username
    );

    res.status(201).json({
      success: true,
      data: promocion,
      message: 'Promoción creada exitosamente',
    });
  })
);

// PUT /:id — actualizar promoción (admin)
router.put(
  '/:id',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const promocion = await promocionService.obtenerPorId(req.params.id);
    if (!promocion) {
      return res.status(404).json({
        success: false,
        error: 'Promoción no encontrada',
        code: 'NOT_FOUND',
      });
    }

    if (req.body.type && !PROMOTION_TYPES.includes(req.body.type)) {
      throw new ValidationError(`Tipo inválido. Válidos: ${PROMOTION_TYPES.join(', ')}`);
    }

    const updated = await promocionService.actualizar(req.params.id, req.body, req.user.username);
    res.json({ success: true, data: updated, message: 'Promoción actualizada' });
  })
);

// DELETE /:id — eliminar promoción (admin)
router.delete(
  '/:id',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const promocion = await promocionService.obtenerPorId(req.params.id);
    if (!promocion) {
      return res.status(404).json({
        success: false,
        error: 'Promoción no encontrada',
        code: 'NOT_FOUND',
      });
    }
    await promocionService.eliminar(req.params.id, req.user.username);
    res.json({ success: true, message: 'Promoción eliminada' });
  })
);

export default router;
