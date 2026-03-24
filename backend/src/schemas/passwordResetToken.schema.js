import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AuditSchema } from './base.schema.js';

const PasswordResetTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  token: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  audit: {
    type: AuditSchema,
    default: () => ({}),
  },
});

PasswordResetTokenSchema.index({ token: 1 });
PasswordResetTokenSchema.index({ email: 1 });

PasswordResetTokenSchema.pre('save', function(next) {
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
  }
  next();
});

PasswordResetTokenSchema.methods.isValid = function() {
  return !this.isUsed && new Date() < this.expiresAt;
};

PasswordResetTokenSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  this.audit.addChange('UPDATE', 'system', { isUsed: true });
  return this.save();
};

PasswordResetTokenSchema.statics.findByToken = function(token) {
  return this.findOne({ token, 'audit.isActive': true });
};

PasswordResetTokenSchema.statics.findByEmail = function(email) {
  return this.find({ email: email.toLowerCase(), isUsed: false, 'audit.isActive': true });
};

PasswordResetTokenSchema.statics.createToken = async function(usuarioId, email) {
  await this.deleteByEmail(email);
  
  const token = new this({
    usuario: usuarioId,
    email: email.toLowerCase(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  
  await token.save();
  return token;
};

PasswordResetTokenSchema.statics.deleteByEmail = async function(email) {
  return this.deleteMany({ email: email.toLowerCase(), isUsed: false });
};

PasswordResetTokenSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

const PasswordResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);

export default PasswordResetToken;
