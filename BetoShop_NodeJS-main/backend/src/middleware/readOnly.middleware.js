import { ROLES } from '../config/auth.js';

export const READ_ONLY_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const MODO_CONSULTA_ACTIVO = true;

export const readOnlyMiddleware = (req, res, next) => {
  if (MODO_CONSULTA_ACTIVO && READ_ONLY_METHODS.includes(req.method)) {
    return res.status(503).json({
      status: 'maintenance',
      message: 'Plataforma en preparación',
      code: 'MAINTENANCE_MODE',
      hint: 'El modo de consulta está activo. Las operaciones de escritura están temporalmente deshabilitadas.',
    });
  }
  next();
};

export const readOnlyForRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (READ_ONLY_METHODS.includes(req.method)) {
      if (MODO_CONSULTA_ACTIVO) {
        return res.status(503).json({
          status: 'maintenance',
          message: 'Plataforma en preparación',
          code: 'MAINTENANCE_MODE',
        });
      }

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
      if (MODO_CONSULTA_ACTIVO) {
        return res.status(503).json({
          status: 'maintenance',
          message: 'Plataforma en preparación',
          code: 'MAINTENANCE_MODE',
        });
      }

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
