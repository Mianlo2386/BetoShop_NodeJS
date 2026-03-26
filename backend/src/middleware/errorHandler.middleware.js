export class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso', identifier = '') {
    super(`${resource} no encontrado${identifier ? `: ${identifier}` : ''}`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

export const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  
  if (err.code === 'VALIDATION_ERROR') {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      details: err.details || {},
    });
  }
  
  if (err.code === 'NOT_FOUND') {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }
  
  if (err.code === 'CONFLICT') {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }
  
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'campo';
      return res.status(409).json({
        success: false,
        error: `Valor duplicado para el campo: ${field}`,
        code: 'DUPLICATE_KEY',
        field: field,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Error de base de datos',
      code: 'DATABASE_ERROR',
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Valor inválido para el campo: ${err.path}`,
      code: 'INVALID_ID',
      field: err.path,
      value: err.value,
    });
  }
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map(e => ({
      field: e.path,
      message: e.message,
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      code: 'VALIDATION_ERROR',
      details: errors,
    });
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.path}`,
    code: 'ROUTE_NOT_FOUND',
  });
};
