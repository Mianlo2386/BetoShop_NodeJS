import mongoose from 'mongoose';
import { AuditSchema } from './base.schema.js';

const ProductImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

const ProductoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres'],
  },
  descripcion: {
    type: String,
    trim: true,
  },
  precio: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo'],
  },
  imagenUrl: {
    type: String,
    trim: true,
  },
  especificaciones: {
    type: String,
  },
  categoria: {
    type: String,
    trim: true,
    index: true,
  },
  subcategoria: {
    type: String,
    trim: true,
    index: true,
  },
  size: {
    type: String,
  },
  stars: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  releaseDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'El stock no puede ser negativo'],
    default: 0,
  },
  imagenes: [ProductImageSchema],
  audit: {
    type: AuditSchema,
    default: () => ({}),
  },
});

ProductoSchema.index({ nombre: 'text', descripcion: 'text', categoria: 'text', subcategoria: 'text' });
ProductoSchema.index({ precio: 1 });
ProductoSchema.index({ 'audit.isActive': 1 });

ProductoSchema.pre('save', function(next) {
  if (!this.audit) {
    this.audit = {};
  }
  if (this.isNew) {
    this.audit.createdAt = new Date();
    this.audit.updatedAt = new Date();
    this.audit.createdBy = this.audit.createdBy || 'system';
    this.audit.updatedBy = this.audit.updatedBy || 'system';
    this.audit.version = 1;
    this.audit.isActive = true;
    this.audit.changeLog = [];
  } else if ((this.isModified() || this.isSoftDeleting || this.isRestoring) && !this.isSoftDeleting && !this.isRestoring) {
    this.audit.updatedAt = new Date();
    this.audit.version += 1;
    this.audit.addChange('UPDATE', this.audit.updatedBy, this._getChanges());
  } else if (this.isSoftDeleting) {
    this.audit.updatedAt = new Date();
    this.audit.version += 1;
    delete this.isSoftDeleting;
  } else if (this.isRestoring) {
    this.audit.updatedAt = new Date();
    this.audit.version += 1;
    delete this.isRestoring;
  }
  next();
});

ProductoSchema.methods._getChanges = function() {
  const changes = {};
  const modifiedPaths = this.modifiedPaths();
  const original = this._original || {};
  modifiedPaths.forEach((path) => {
    if (path !== 'audit') {
      changes[path] = {
        old: original[path],
        new: this[path],
      };
    }
  });
  return changes;
};

ProductoSchema.methods.softDelete = async function(deletedBy = 'system') {
  this.audit.isActive = false;
  this.audit.updatedBy = deletedBy;
  this.audit.addChange('DELETE', deletedBy);
  this.isSoftDeleting = true;
  return this.save();
};

ProductoSchema.methods.restore = async function(restoredBy = 'system') {
  this.audit.isActive = true;
  this.audit.updatedBy = restoredBy;
  this.audit.addChange('RESTORE', restoredBy);
  this.isRestoring = true;
  return this.save();
};

ProductoSchema.statics.findActive = function() {
  return this.find({ 'audit.isActive': true });
};

ProductoSchema.statics.findByIdActive = function(id) {
  return this.findOne({ _id: id, 'audit.isActive': true });
};

ProductoSchema.statics.search = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    'audit.isActive': true,
    $or: [
      { nombre: searchRegex },
      { categoria: searchRegex },
      { subcategoria: searchRegex },
    ],
  });
};

ProductoSchema.statics.findReleases = function(daysAgo = 30) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - daysAgo);
  return this.find({
    'audit.isActive': true,
    releaseDate: { $gte: fechaLimite },
  }).sort({ releaseDate: -1 });
};

ProductoSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Producto = mongoose.model('Producto', ProductoSchema);

export default Producto;
