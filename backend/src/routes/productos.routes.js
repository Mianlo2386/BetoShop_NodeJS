import { Router } from 'express';
import * as productoService from '../services/producto.service.js';
import { verifyJWT, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { readOnlyMiddleware } from '../middleware/readOnly.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

const router = Router();

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 50,
      sortBy = 'nombre',
      sortOrder = 'asc',
      categoria,
      subcategoria,
      precioMin,
      precioMax,
    } = req.query;

    const opciones = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sortBy,
      sortOrder,
      categoria,
      subcategoria,
      precioMin: precioMin ? parseFloat(precioMin) : undefined,
      precioMax: precioMax ? parseFloat(precioMax) : undefined,
    };

    const resultado = await productoService.obtenerTodos(opciones);

    res.json({
      success: true,
      ...resultado,
    });
  })
);

router.get(
  '/search',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'El query debe tener al menos 2 caracteres',
        code: 'INVALID_QUERY',
      });
    }

    const productos = await productoService.buscarPorNombreCategoriaSubcategoria(q.trim());

    res.json({
      success: true,
      data: productos,
      total: productos.length,
    });
  })
);

router.get(
  '/releases',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const releases = await productoService.obtenerReleases(parseInt(days));

    res.json({
      success: true,
      data: releases,
      total: releases.length,
      days: parseInt(days),
    });
  })
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const producto = await productoService.obtenerPorId(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: producto,
    });
  })
);

router.get(
  '/categoria/:categoria',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const resultado = await productoService.obtenerPorCategoria(
      req.params.categoria,
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      ...resultado,
    });
  })
);

router.get(
  '/precio/rango',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { min, max, page = 1, limit = 50 } = req.query;

    if (!min || !max) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros min y max son requeridos',
        code: 'MISSING_PARAMS',
      });
    }

    const resultado = await productoService.obtenerPorRangoPrecio(
      parseFloat(min),
      parseFloat(max),
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      ...resultado,
    });
  })
);

router.get(
  '/meta/categorias',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const categorias = await productoService.obtenerCategorias();

    res.json({
      success: true,
      data: categorias,
    });
  })
);

router.get(
  '/meta/subcategorias',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { categoria } = req.query;
    const subcategorias = await productoService.obtenerSubcategorias(categoria);

    res.json({
      success: true,
      data: subcategorias,
    });
  })
);

router.get(
  '/meta/estadisticas',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const estadisticas = await productoService.obtenerEstadisticas();

    res.json({
      success: true,
      data: estadisticas,
    });
  })
);

router.post(
  '/',
  verifyJWT,
  requireAdmin,
  readOnlyMiddleware,
  asyncHandler(async (req, res) => {
    const producto = await productoService.crear(req.body, req.user.username);

    res.status(201).json({
      success: true,
      data: producto,
      message: 'Producto creado exitosamente',
    });
  })
);

router.put(
  '/:id',
  verifyJWT,
  requireAdmin,
  readOnlyMiddleware,
  asyncHandler(async (req, res) => {
    const producto = await productoService.actualizar(
      req.params.id,
      req.body,
      req.user.username
    );

    res.json({
      success: true,
      data: producto,
      message: 'Producto actualizado exitosamente',
    });
  })
);

router.delete(
  '/:id',
  verifyJWT,
  requireAdmin,
  readOnlyMiddleware,
  asyncHandler(async (req, res) => {
    await productoService.eliminar(req.params.id, req.user.username);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
    });
  })
);

router.patch(
  '/:id/restaurar',
  verifyJWT,
  requireAdmin,
  readOnlyMiddleware,
  asyncHandler(async (req, res) => {
    const producto = await productoService.restaurar(
      req.params.id,
      req.user.username
    );

    res.json({
      success: true,
      data: producto,
      message: 'Producto restaurado exitosamente',
    });
  })
);

export default router;
