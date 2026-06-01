import { Router } from 'express';
import { verifyJWT, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';
import { getStats } from '../services/dashboard.service.js';

const router = Router();

// GET / — estadísticas generales (solo admin)
router.get(
  '/',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const stats = await getStats();
    res.json({ success: true, data: stats });
  })
);

export default router;