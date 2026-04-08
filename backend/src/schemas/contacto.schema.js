import mongoose from 'mongoose';

const contactoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  asunto: {
    type: String,
    required: true,
    trim: true
  },
  mensaje: {
    type: String,
    required: true
  },
  leido: {
    type: Boolean,
    default: false
  },
  audit: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
});

contactoSchema.pre('save', function(next) {
  this.audit.updatedAt = new Date();
  next();
});

export default mongoose.model('Contacto', contactoSchema);