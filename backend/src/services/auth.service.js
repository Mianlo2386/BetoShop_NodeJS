import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authConfig, ROLES } from '../config/auth.js';
import { withConnection } from '../config/database.js';
import { AuthError, ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler.middleware.js';

class AuthService {

  async login({ username, password }) {
    if (!username || !password) {
      throw new ValidationError('Usuario y contraseña son requeridos');
    }

    const usuario = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT ID, USERNAME, EMAIL, PASSWORD, ROLES, IS_LOCKED, LOCK_UNTIL, 
                FAILED_LOGIN_ATTEMPTS, IS_ACTIVE 
         FROM USUARIOS WHERE USERNAME = :username`,
        { username: username.toLowerCase() },
        { outFormat: 4002 }
      );
      return result.rows[0] || null;
    });

    if (!usuario) throw new AuthError('Credenciales inválidas');
    if (!usuario.IS_ACTIVE) throw new AuthError('Usuario desactivado');
    if (usuario.IS_LOCKED && usuario.LOCK_UNTIL && new Date(usuario.LOCK_UNTIL) > new Date()) {
      throw new AuthError('Cuenta bloqueada. Intenta más tarde.');
    }

    const isMatch = await bcrypt.compare(password, usuario.PASSWORD);
    if (!isMatch) {
      await withConnection(async (conn) => {
        await conn.execute(
          `UPDATE USUARIOS SET FAILED_LOGIN_ATTEMPTS = FAILED_LOGIN_ATTEMPTS + 1 WHERE ID = :id`,
          { id: usuario.ID }, { autoCommit: true }
        );
      });
      throw new AuthError('Credenciales inválidas');
    }

    await withConnection(async (conn) => {
      await conn.execute(
        `UPDATE USUARIOS SET FAILED_LOGIN_ATTEMPTS = 0, IS_LOCKED = 0, LAST_LOGIN_AT = CURRENT_TIMESTAMP WHERE ID = :id`,
        { id: usuario.ID }, { autoCommit: true }
      );
    });

    return { user: this._formatUser(usuario), ...this.generateTokens(usuario) };
  }

  async register({ username, email, password }) {
    if (!username || !email || !password) throw new ValidationError('Todos los campos son requeridos');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Email inválido');
    if (password.length < 8) throw new ValidationError('La contraseña debe tener al menos 8 caracteres');

    const existing = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT ID FROM USUARIOS WHERE USERNAME = :username OR EMAIL = :email`,
        { username: username.toLowerCase(), email: email.toLowerCase() },
        { outFormat: 4002 }
      );
      return result.rows[0] || null;
    });

    if (existing) throw new ConflictError('El usuario o email ya está en uso');

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await withConnection(async (conn) => {
      const result = await conn.execute(
        `INSERT INTO USUARIOS (USERNAME, EMAIL, PASSWORD, ROLES, IS_ACTIVE, CREATED_BY)
         VALUES (:username, :email, :password, :roles, 1, 'system')
         RETURNING ID INTO :id`,
        {
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          password: hashedPassword,
          roles: ROLES.USER,
          id: { dir: 3003, type: 2010 }
        },
        { autoCommit: true }
      );
      return { ID: result.outBinds.id[0], USERNAME: username.toLowerCase(), EMAIL: email.toLowerCase(), ROLES: ROLES.USER };
    });

    return { user: this._formatUser(usuario), ...this.generateTokens(usuario) };
  }

  async getUserById(userId) {
    const usuario = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT ID, USERNAME, EMAIL, ROLES, IS_ACTIVE, CREATED_AT FROM USUARIOS WHERE ID = :id`,
        { id: userId }, { outFormat: 4002 }
      );
      return result.rows[0] || null;
    });
    if (!usuario) throw new NotFoundError('Usuario');
    return this._formatUser(usuario);
  }

  async listUsers({ page = 1, limit = 20, role } = {}) {
    const offset = (page - 1) * limit;
    const usuarios = await withConnection(async (conn) => {
      let query = `SELECT ID, USERNAME, EMAIL, ROLES, IS_ACTIVE, CREATED_AT FROM USUARIOS WHERE IS_ACTIVE = 1`;
      const binds = {};
      if (role) { query += ` AND ROLES LIKE :role`; binds.role = `%${role}%`; }
      query += ` ORDER BY CREATED_AT DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
      binds.offset = offset; binds.limit = limit;
      const result = await conn.execute(query, binds, { outFormat: 4002 });
      return result.rows;
    });
    return { data: usuarios.map(u => this._formatUser(u)), pagination: { page, limit } };
  }

  async changePassword(userId, currentPassword, newPassword) {
    if (newPassword.length < 8) throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
    const usuario = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT ID, PASSWORD FROM USUARIOS WHERE ID = :id`,
        { id: userId }, { outFormat: 4002 }
      );
      return result.rows[0] || null;
    });
    if (!usuario) throw new NotFoundError('Usuario');
    const isMatch = await bcrypt.compare(currentPassword, usuario.PASSWORD);
    if (!isMatch) throw new AuthError('Contraseña actual incorrecta');
    const hashed = await bcrypt.hash(newPassword, 10);
    await withConnection(async (conn) => {
      await conn.execute(
        `UPDATE USUARIOS SET PASSWORD = :password, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :id`,
        { password: hashed, id: userId }, { autoCommit: true }
      );
    });
    return { message: 'Contraseña actualizada exitosamente' };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, authConfig.jwt.secret, {
        issuer: authConfig.jwt.issuer, audience: authConfig.jwt.audience
      });
      if (decoded.type !== 'refresh') throw new AuthError('Token inválido');
      const usuario = await this.getUserById(decoded.userId);
      return this.generateTokens(usuario);
    } catch (e) {
      throw new AuthError('Token de refresco inválido o expirado');
    }
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret, {
        issuer: authConfig.jwt.issuer, audience: authConfig.jwt.audience
      });
      if (decoded.type !== 'access') throw new AuthError('Token inválido');
      const usuario = await this.getUserById(decoded.userId);
      return { valid: true, user: usuario };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  async requestPasswordReset(email) {
    return { message: 'Si el email existe, recibirás un enlace de recuperación.' };
  }

  async resetPassword(token, newPassword) {
    throw new AuthError('Reset de contraseña no implementado aún');
  }

  async createAdmin(userData) {
    const result = await this.register(userData);
    await withConnection(async (conn) => {
      await conn.execute(
        `UPDATE USUARIOS SET ROLES = :roles WHERE ID = :id`,
        { roles: 'ROLE_ADMIN,ROLE_USER', id: result.user.id }, { autoCommit: true }
      );
    });
    result.user.roles = ['ROLE_ADMIN', 'ROLE_USER'];
    return result;
  }

  generateTokens(usuario) {
    const payload = {
      userId: usuario.ID || usuario.id,
      username: usuario.USERNAME || usuario.username,
      email: usuario.EMAIL || usuario.email,
      roles: typeof usuario.ROLES === 'string' ? usuario.ROLES.split(',') : usuario.roles,
    };
    const accessToken = jwt.sign({ ...payload, jti: uuidv4(), type: 'access' }, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn, issuer: authConfig.jwt.issuer, audience: authConfig.jwt.audience
    });
    const refreshToken = jwt.sign({ userId: payload.userId, jti: uuidv4(), type: 'refresh' }, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.refreshExpiresIn, issuer: authConfig.jwt.issuer, audience: authConfig.jwt.audience
    });
    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: authConfig.jwt.expiresIn };
  }

  _formatUser(u) {
    return {
      id: u.ID || u.id,
      username: u.USERNAME || u.username,
      email: u.EMAIL || u.email,
      roles: typeof (u.ROLES || u.roles) === 'string' ? (u.ROLES || u.roles).split(',') : (u.roles || []),
      isActive: u.IS_ACTIVE !== undefined ? !!u.IS_ACTIVE : true,
    };
  }
}

export default new AuthService();
