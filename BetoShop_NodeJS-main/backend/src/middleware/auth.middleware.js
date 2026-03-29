import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.js';
import Usuario from '../schemas/usuario.schema.js';
import { ROLES } from '../config/auth.js';
import { AuthError } from './errorHandler.middleware.js';

export const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  
  return null;
};

export const verifyJWT = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AuthError('Token no proporcionado o formato inválido');
    }
    
    const decoded = jwt.verify(token, authConfig.jwt.secret, {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
    
    if (!decoded.jti) {
      throw new AuthError('Token inválido: falta identificador');
    }
    
    const usuario = await Usuario.findById(decoded.userId);
    
    if (!usuario) {
      throw new AuthError('Usuario no encontrado');
    }
    
    if (!usuario.audit.isActive) {
      throw new AuthError('Usuario desactivado');
    }
    
    if (usuario.isLockedAccount()) {
      throw new AuthError('Cuenta bloqueada. Intenta más tarde.');
    }
    
    req.user = {
      id: usuario._id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles,
    };
    req.tokenId = decoded.jti;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false,
        error: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ 
        success: false,
        error: error.message,
        code: 'AUTH_ERROR'
      });
    }
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret, {
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      });
      
      const usuario = await Usuario.findById(decoded.userId);
      
      if (usuario && usuario.audit.isActive) {
        req.user = {
          id: usuario._id,
          username: usuario.username,
          email: usuario.email,
          roles: usuario.roles,
        };
        req.tokenId = decoded.jti;
      }
    } catch {
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const hasRole = roles.some(role => req.user.roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        success: false,
        error: 'No tienes permisos para realizar esta acción',
        code: 'FORBIDDEN'
      });
    }
    
    next();
  };
};

export const requireAdmin = requireRole(ROLES.ADMIN);

export const requireUser = requireRole(ROLES.USER);

export const extractUserFromRequest = (req) => {
  return req.user ? req.user.username : 'system';
};

