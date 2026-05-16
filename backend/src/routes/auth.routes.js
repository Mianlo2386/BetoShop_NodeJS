import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authService from '../services/auth.service.js';
import { verifyJWT, optionalAuth, requireAdmin, extractToken } from '../middleware/auth.middleware.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.middleware.js';

const router = Router();

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Demasiados intentos de login. Intenta en 15 minutos.',
    code: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Demasiados registros desde esta IP. Intenta en 1 hora.',
    code: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: 'Demasiadas solicitudes de recuperación. Intenta en 1 hora.',
    code: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/register',
  registerLimiter,
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      throw new ValidationError('Username, email y password son requeridos');
    }

    const result = await authService.register({ username, email, password });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Usuario registrado exitosamente',
    });
  })
);

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ValidationError('Usuario y contraseña son requeridos');
    }

    const result = await authService.login({ username, password });

    const accessMaxAge = 15 * 60;
    const refreshMaxAge = 7 * 24 * 60 * 60;

    res.cookie('accessToken', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: accessMaxAge * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge * 1000,
    });

    const { accessToken, refreshToken, ...userData } = result;

    res.json({
      success: true,
      data: {
        ...userData,
        usesCookies: true,
      },
      message: 'Login exitoso',
    });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new ValidationError('Refresh token es requerido');
    }

    const tokens = await authService.refreshToken(refreshToken);

    const accessMaxAge = 15 * 60;
    const refreshMaxAge = 7 * 24 * 60 * 60;

    res.cookie('accessToken', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: accessMaxAge * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge * 1000,
    });

    const { accessToken, refreshToken: rt, ...tokenData } = tokens;

    res.json({
      success: true,
      data: {
        ...tokenData,
        usesCookies: true,
      },
    });
  })
);

router.post(
  '/recuperar',
  resetLimiter,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email es requerido');
    }

    const result = await authService.requestPasswordReset(email);

    res.json({
      success: true,
      ...result,
    });
  })
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new ValidationError('Token y nueva contraseña son requeridos');
    }

    const result = await authService.resetPassword(token, password);

    res.json({
      success: true,
      ...result,
    });
  })
);

router.get(
  '/me',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  })
);

router.post(
  '/change-password',
  verifyJWT,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Contraseña actual y nueva contraseña son requeridas');
    }

    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    res.json({
      success: true,
      ...result,
    });
  })
);

router.get(
  '/validate',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.json({
        success: true,
        valid: false,
        authenticated: false,
      });
    }

    res.json({
      success: true,
      valid: true,
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        roles: req.user.roles,
      },
    });
  })
);

router.get(
  '/usuarios',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role } = req.query;

    const resultado = await authService.listUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      role,
    });

    res.json({
      success: true,
      ...resultado,
    });
  })
);

router.post(
  '/admin/register',
  registerLimiter,
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      throw new ValidationError('Username, email y password son requeridos');
    }

    const result = await authService.createAdmin({ username, email, password });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Usuario admin creado exitosamente',
    });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    res.cookie('accessToken', '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    res.cookie('refreshToken', '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    res.json({
      success: true,
      message: 'Logout exitoso',
    });
  })
);


router.post(
  '/usuarios/:id/lock',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await authService.lockUser(req.params.id);
    res.json({ success: true, message: 'Usuario bloqueado' });
  })
);

router.post(
  '/usuarios/:id/unlock',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await authService.unlockUser(req.params.id);
    res.json({ success: true, message: 'Usuario desbloqueado' });
  })
);
export default router;
