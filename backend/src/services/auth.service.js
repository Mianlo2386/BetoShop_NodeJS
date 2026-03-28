import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authConfig, ROLES } from '../config/auth.js';
import Usuario from '../schemas/usuario.schema.js';
import PasswordResetToken from '../schemas/passwordResetToken.schema.js';
import { AuthError, ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler.middleware.js';

class AuthService {

  async register(userData) {
    const { username, email, password } = userData;

    if (!username || !email || !password) {
      throw new ValidationError('Todos los campos son requeridos');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('El formato del email es inválido');
    }

    if (password.length < authConfig.security.minPasswordLength) {
      throw new ValidationError(`La contraseña debe tener al menos ${authConfig.security.minPasswordLength} caracteres`);
    }

    const existingUser = await Usuario.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    });

    if (existingUser) {
      if (existingUser.username === username.toLowerCase()) {
        throw new ConflictError('El nombre de usuario ya está en uso');
      }
      throw new ConflictError('El email ya está registrado');
    }

    const usuario = new Usuario({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      roles: [ROLES.USER],
      audit: {
        createdBy: 'system',
        updatedBy: 'system',
      },
    });

    await usuario.save();

    const tokens = this.generateTokens(usuario);

    return {
      user: usuario.toJSON(),
      ...tokens,
    };
  }

  async login(credentials) {
    const { username, password } = credentials;

    if (!username || !password) {
      throw new ValidationError('Usuario y contraseña son requeridos');
    }

    const usuario = await Usuario.findOne({
      username: username.toLowerCase(),
    }).select('+password');

    if (!usuario) {
      throw new AuthError('Credenciales inválidas');
    }

    if (!usuario.audit.isActive) {
      throw new AuthError('Usuario desactivado');
    }

    if (usuario.isLockedAccount()) {
      throw new AuthError('Cuenta bloqueada. Intenta más tarde.');
    }

    const isMatch = await usuario.comparePassword(password);

    if (!isMatch) {
      await usuario.recordFailedLogin();
      throw new AuthError('Credenciales inválidas');
    }

    await usuario.recordSuccessfulLogin();

    const tokens = this.generateTokens(usuario);

    return {
      user: usuario.toJSON(),
      ...tokens,
    };
  }

  generateTokens(usuario) {
    const jti = uuidv4();

    const payload = {
      userId: usuario._id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles,
    };

    const accessToken = jwt.sign(
      {
        ...payload,
        jti,
        type: 'access',
      },
      authConfig.jwt.secret,
      {
        expiresIn: authConfig.jwt.expiresIn,
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      }
    );

    const refreshToken = jwt.sign(
      {
        userId: usuario._id,
        jti: uuidv4(),
        type: 'refresh',
      },
      authConfig.jwt.secret,
      {
        expiresIn: authConfig.jwt.refreshExpiresIn,
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      }
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: authConfig.jwt.expiresIn,
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, authConfig.jwt.secret, {
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      });

      if (decoded.type !== 'refresh') {
        throw new AuthError('Token de refresco inválido');
      }

      const usuario = await Usuario.findById(decoded.userId);

      if (!usuario || !usuario.audit.isActive) {
        throw new AuthError('Usuario no encontrado o inactivo');
      }

      if (usuario.isLockedAccount()) {
        throw new AuthError('Cuenta bloqueada');
      }

      const tokens = this.generateTokens(usuario);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token de refresco expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Token de refresco inválido');
      }
      throw error;
    }
  }

  async requestPasswordReset(email) {
    const usuario = await Usuario.findByEmail(email);

    if (!usuario) {
      return {
        message: 'Si el email existe, recibirás un enlace de recuperación.',
      };
    }

    const token = await PasswordResetToken.createToken(usuario._id, email);

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${token.token}`;

    console.log(`[PASSWORD RESET] Link de recuperación: ${resetLink}`);

    return {
      message: 'Si el email existe, recibirás un enlace de recuperación.',
      token: token.token,
    };
  }

  async resetPassword(token, newPassword) {
    if (!newPassword || newPassword.length < authConfig.security.minPasswordLength) {
      throw new ValidationError(`La contraseña debe tener al menos ${authConfig.security.minPasswordLength} caracteres`);
    }

    const resetToken = await PasswordResetToken.findByToken(token);

    if (!resetToken) {
      throw new AuthError('Token inválido', 400);
    }

    if (!resetToken.isValid()) {
      throw new AuthError('El token ha expirado');
    }

    const usuario = await Usuario.findById(resetToken.usuario);

    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    usuario.password = newPassword;
    usuario.audit.updatedBy = 'password_reset';
    await usuario.save();

    await resetToken.markAsUsed();

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret, {
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      });

      if (decoded.type !== 'access') {
        throw new AuthError('Token de acceso inválido');
      }

      const usuario = await Usuario.findById(decoded.userId);

      if (!usuario || !usuario.audit.isActive) {
        throw new AuthError('Usuario no encontrado o inactivo');
      }

      return {
        valid: true,
        user: {
          id: usuario._id,
          username: usuario.username,
          email: usuario.email,
          roles: usuario.roles,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  async getUserById(userId) {
    const usuario = await Usuario.findById(userId);

    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    return usuario.toJSON();
  }

  async listUsers(filters = {}) {
    const { page = 1, limit = 20, role } = filters;
    const skip = (page - 1) * limit;

    const query = { 'audit.isActive': true };
    
    if (role) {
      query.roles = role;
    }

    const [usuarios, total] = await Promise.all([
      Usuario.find(query)
        .select('-password')
        .sort({ 'audit.createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Usuario.countDocuments(query),
    ]);

    return {
      data: usuarios,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createAdmin(userData) {
    const admin = await this.register(userData);
    
    const usuario = await Usuario.findById(admin.user._id);
    usuario.roles = [ROLES.ADMIN, ROLES.USER];
    usuario.audit.updatedBy = 'system';
    await usuario.save();

    return {
      ...admin,
      user: usuario.toJSON(),
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const usuario = await Usuario.findById(userId).select('+password');

    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const isMatch = await usuario.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AuthError('Contraseña actual incorrecta');
    }

    if (newPassword.length < authConfig.security.minPasswordLength) {
      throw new ValidationError(`La nueva contraseña debe tener al menos ${authConfig.security.minPasswordLength} caracteres`);
    }

    usuario.password = newPassword;
    usuario.audit.updatedBy = userId.toString();
    await usuario.save();

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }
}

export default new AuthService();
