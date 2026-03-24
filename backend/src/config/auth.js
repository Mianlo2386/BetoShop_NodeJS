import dotenv from 'dotenv';

dotenv.config();

export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-min-32-characters-long',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'betostore-api',
    audience: 'betostore-frontend',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
  },
  security: {
    minPasswordLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
  },
};

export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  USER: 'ROLE_USER',
};

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  RESTORE: 'RESTORE',
};
