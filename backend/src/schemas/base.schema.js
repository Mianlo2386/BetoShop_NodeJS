import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../config/auth.js';

const ChangeLogEntrySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: Object.values(AUDIT_ACTIONS),
    required: true,
  },
  modifiedBy: {
    type: String,
    default: 'system',
  },
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { _id: false });

const AuditSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: String,
    default: 'system',
  },
  updatedBy: {
    type: String,
    default: 'system',
  },
  version: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  changeLog: {
    type: [ChangeLogEntrySchema],
    default: [],
  },
}, { _id: false });

AuditSchema.methods.addChange = function(action, modifiedBy, changes = {}) {
  this.changeLog.push({
    action,
    modifiedBy: modifiedBy || 'system',
    modifiedAt: new Date(),
    changes,
  });
};

AuditSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

export { AuditSchema, ChangeLogEntrySchema };
