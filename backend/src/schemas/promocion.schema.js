import mongoose from 'mongoose';
import { AuditSchema } from './base.schema.js';

export const PROMOTION_TYPES = {
  BANNER: 'BANNER',
  CATEGORY_DISCOUNT: 'CATEGORY_DISCOUNT',
  PRODUCT_DISCOUNT: 'PRODUCT_DISCOUNT',
  FLASH_SALE: 'FLASH_SALE',
  BUY_ONE_GET_ONE: 'BUY_ONE_GET_ONE',
};

const PromotionImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
}, { _id: true });

const PromotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres'],
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'El tipo de promoción es requerido'],
    enum: Object.values(PROMOTION_TYPES),
    default: PROMOTION_TYPES.BANNER,
  },
  discountPercentage: {
    type: Number,
    min: [0, 'El descuento no puede ser negativo'],
    max: [100, 'El descuento no puede exceder 100%'],
  },
  category: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida'],
  },
  endDate: {
    type: Date,
    required: [true, 'La fecha de fin es requerida'],
  },
  images: [PromotionImageSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  audit: {
    type: AuditSchema,
    default: () => ({}),
  },
});

PromotionSchema.index({ type: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ category: 1 });
PromotionSchema.index({ 'audit.isActive': 1 });

PromotionSchema.pre('save', function(next) {
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
  } else if (this.isModified()) {
    this.audit.updatedAt = new Date();
    this.audit.version += 1;
    this.audit.addChange('UPDATE', this.audit.updatedBy, this._getChanges());
  }
  next();
});

PromotionSchema.methods._getChanges = function() {
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

PromotionSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

PromotionSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    'audit.isActive': true,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
};

PromotionSchema.statics.findActiveByType = function(type) {
  const now = new Date();
  return this.find({
    'audit.isActive': true,
    isActive: true,
    type,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
};

PromotionSchema.statics.findActiveByCategory = function(category) {
  const now = new Date();
  return this.find({
    'audit.isActive': true,
    isActive: true,
    category,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
};

PromotionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Promotion = mongoose.model('Promotion', PromotionSchema);

export default Promotion;
