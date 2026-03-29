import { Router } from 'express';
import promotionService from '../services/producto.service.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';
import Promotion from '../schemas/promocion.schema.js';

const router = Router();

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const promociones = await Promotion.findActive();

    res.json({
      success: true,
      data: promociones,
      total: promociones.length,
    });
  })
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const promocion = await Promotion.findById(req.params.id);

    if (!promocion) {
      return res.status(404).json({
        success: false,
        error: 'Promoción no encontrada',
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: promocion,
    });
  })
);

export default router;
