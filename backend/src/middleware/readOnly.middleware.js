import { ROLES } from '../config/auth.js';

export const READ_ONLY_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const readOnlyMiddleware = (req, res, next) => {
  if (READ_ONLY_METHODS.includes(req.method)) {
    return res.status(403).json({
      success: false,
      error: 'Modo solo lectura. Las operaciones de escritura están deshabilitadas en este MVP.',
      code: 'READ_ONLY_MODE',
      hint: 'Este endpoint solo permite consultas GET. Las mutaciones no están habilitadas.',
    });
  }
  next();
};

export const readOnlyForRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (READ_ONLY_METHODS.includes(req.method)) {
      const userRoles = req.user?.roles || [];
      const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));
      
      if (!hasAllowedRole) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para modificar recursos.',
          code: 'WRITE_FORBIDDEN',
          hint: 'Solo usuarios con roles específicos pueden realizar operaciones de escritura.',
        });
      }
    }
    next();
  };
};

export const adminWriteOnly = readOnlyForRole(ROLES.ADMIN);

export const createReadOnlyGuard = (options = {}) => {
  const { 
    allowPost = false,
    allowPut = false,
    allowPatch = false,
    allowDelete = false,
    allowedRoles = [ROLES.ADMIN],
  } = options;
  
  return (req, res, next) => {
    const method = req.method;
    let isWriteOperation = false;
    
    switch (method) {
      case 'POST':
        isWriteOperation = !allowPost;
        break;
      case 'PUT':
        isWriteOperation = !allowPut;
        break;
      case 'PATCH':
        isWriteOperation = !allowPatch;
        break;
      case 'DELETE':
        isWriteOperation = !allowDelete;
        break;
      default:
        isWriteOperation = false;
    }
    
    if (isWriteOperation) {
      const userRoles = req.user?.roles || [];
      const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));
      
      if (!hasAllowedRole) {
        return res.status(403).json({
          success: false,
          error: 'Operación de escritura bloqueada en modo solo lectura.',
          code: 'WRITE_BLOCKED',
          method: method,
          path: req.path,
        });
      }
    }
    
    next();
  };
};
