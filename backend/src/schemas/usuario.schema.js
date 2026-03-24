import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AuditSchema } from './base.schema.js';
import { ROLES, authConfig } from '../config/auth.js';

const UsuarioSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El username es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'El username debe tener al menos 3 caracteres'],
    maxlength: [50, 'El username no puede exceder 50 caracteres'],
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    select: false,
  },
  roles: {
    type: [String],
    enum: Object.values(ROLES),
    default: [ROLES.USER],
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockUntil: {
    type: Date,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lastLoginAt: {
    type: Date,
  },
  audit: {
    type: AuditSchema,
    default: () => ({}),
  },
});

UsuarioSchema.index({ 'audit.isActive': 1 });

UsuarioSchema.pre('save', async function(next) {
  if (!this.audit) {
    this.audit = {};
  }
  if (this.isNew) {
    this.audit.createdAt = new Date();
    this.audit.updatedAt = new Date();
    this.audit.createdBy = 'system';
    this.audit.updatedBy = 'system';
    this.audit.version = 1;
    this.audit.isActive = true;
    this.audit.changeLog = [];
    
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, authConfig.bcrypt.saltRounds);
      this.audit.addChange('CREATE', 'system', { password: '[REDACTED]' });
    }
  }
  if (this.isModified() && !this.isNew) {
    this.audit.updatedAt = new Date();
    this.audit.version += 1;
    
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, authConfig.bcrypt.saltRounds);
      this.audit.addChange('UPDATE', this.audit.updatedBy, { password: '[REDACTED]' });
    }
  }
  next();
});

UsuarioSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UsuarioSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

UsuarioSchema.methods.isLockedAccount = function() {
  if (this.isLocked && this.lockUntil && this.lockUntil > Date.now()) {
    return true;
  }
  if (this.failedLoginAttempts >= authConfig.security.maxLoginAttempts) {
    return true;
  }
  return false;
};

UsuarioSchema.methods.recordFailedLogin = async function() {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= authConfig.security.maxLoginAttempts) {
    this.isLocked = true;
    this.lockUntil = new Date(Date.now() + authConfig.security.lockoutDuration);
  }
  await this.save();
};

UsuarioSchema.methods.recordSuccessfulLogin = async function() {
  this.failedLoginAttempts = 0;
  this.isLocked = false;
  this.lockUntil = undefined;
  this.lastLoginAt = new Date();
  await this.save();
};

UsuarioSchema.methods.softDelete = function(deletedBy = 'system') {
  this.audit.isActive = false;
  this.audit.updatedBy = deletedBy;
  this.audit.addChange('DELETE', deletedBy);
  return this.save();
};

UsuarioSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), 'audit.isActive': true });
};

UsuarioSchema.statics.findByUsername = function(username) {
  return this.findOne({ username, 'audit.isActive': true });
};

UsuarioSchema.statics.findActive = function() {
  return this.find({ 'audit.isActive': true });
};

UsuarioSchema.statics.register = async function(userData) {
  const usuario = new this(userData);
  usuario.roles = [ROLES.USER];
  await usuario.save();
  return usuario;
};

UsuarioSchema.statics.createAdmin = async function(userData) {
  const usuario = new this(userData);
  usuario.roles = [ROLES.ADMIN, ROLES.USER];
  await usuario.save();
  return usuario;
};

UsuarioSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

export default Usuario;
