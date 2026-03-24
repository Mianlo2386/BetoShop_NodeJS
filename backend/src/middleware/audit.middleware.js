import { AUDIT_ACTIONS } from '../config/auth.js';
import { extractUserFromRequest } from './auth.middleware.js';

export const auditMiddleware = async (req, res, next) => {
  res.locals.auditUser = extractUserFromRequest(req);
  next();
};

export const createAuditEntry = (action, user, changes = {}) => {
  return {
    action,
    modifiedBy: user || 'system',
    modifiedAt: new Date(),
    changes,
  };
};

export const logModelChange = async (model, action, user, originalData, newData) => {
  if (!model.audit) {
    model.audit = {};
  }
  
  if (!model.audit.changeLog) {
    model.audit.changeLog = [];
  }
  
  const changes = {};
  for (const key of Object.keys(newData)) {
    if (key !== 'audit' && key !== '_id' && key !== '__v') {
      if (JSON.stringify(originalData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = {
          old: originalData[key],
          new: newData[key],
        };
      }
    }
  }
  
  model.audit.changeLog.push(createAuditEntry(action, user, changes));
  
  if (action === AUDIT_ACTIONS.UPDATE) {
    model.audit.updatedAt = new Date();
    model.audit.updatedBy = user || 'system';
    model.audit.version = (model.audit.version || 0) + 1;
  }
  
  if (action === AUDIT_ACTIONS.CREATE) {
    model.audit.createdAt = new Date();
    model.audit.updatedAt = new Date();
    model.audit.createdBy = user || 'system';
    model.audit.updatedBy = user || 'system';
    model.audit.version = 1;
    model.audit.isActive = true;
  }
  
  if (action === AUDIT_ACTIONS.DELETE) {
    model.audit.isActive = false;
    model.audit.updatedAt = new Date();
    model.audit.updatedBy = user || 'system';
  }
  
  if (action === AUDIT_ACTIONS.RESTORE) {
    model.audit.isActive = true;
    model.audit.updatedAt = new Date();
    model.audit.updatedBy = user || 'system';
  }
  
  return model;
};

export const auditQueryLogger = (modelName) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        user: req.user?.username || 'anonymous',
        timestamp: new Date().toISOString(),
        model: modelName,
      };
      
      if (res.statusCode >= 400) {
        console.error('[AUDIT-QUERY-ERROR]', JSON.stringify(logData));
      } else {
        console.log('[AUDIT-QUERY]', JSON.stringify(logData));
      }
    });
    
    next();
  };
};

export const validateAuditIntegrity = (doc) => {
  const errors = [];
  
  if (!doc.audit) {
    errors.push('Document missing audit field');
    return errors;
  }
  
  if (!doc.audit.createdAt) {
    errors.push('Audit missing createdAt');
  }
  
  if (!doc.audit.updatedAt) {
    errors.push('Audit missing updatedAt');
  }
  
  if (typeof doc.audit.version !== 'number') {
    errors.push('Audit missing or invalid version');
  }
  
  if (typeof doc.audit.isActive !== 'boolean') {
    errors.push('Audit missing or invalid isActive');
  }
  
  if (!Array.isArray(doc.audit.changeLog)) {
    errors.push('Audit changeLog must be an array');
  }
  
  return errors;
};

export const getAuditSummary = (doc) => {
  if (!doc.audit) return null;
  
  return {
    createdAt: doc.audit.createdAt,
    createdBy: doc.audit.createdBy,
    updatedAt: doc.audit.updatedAt,
    updatedBy: doc.audit.updatedBy,
    version: doc.audit.version,
    isActive: doc.audit.isActive,
    totalChanges: doc.audit.changeLog?.length || 0,
    lastChange: doc.audit.changeLog?.length > 0 
      ? doc.audit.changeLog[doc.audit.changeLog.length - 1] 
      : null,
  };
};
