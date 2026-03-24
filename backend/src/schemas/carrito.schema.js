import mongoose from 'mongoose';
import { AuditSchema } from './base.schema.js';

const CarritoItemSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La cantidad debe ser al menos 1'],
    default: 1,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const CarritoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  sessionId: {
    type: String,
  },
  items: [CarritoItemSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  audit: {
    type: AuditSchema,
    default: () => ({}),
  },
});

CarritoSchema.index({ usuario: 1 });
CarritoSchema.index({ sessionId: 1 });

CarritoSchema.pre('save', function(next) {
  if (!this.audit) {
    this.audit = {};
  }
  this.updatedAt = new Date();
  if (this.isNew) {
    this.audit.createdAt = new Date();
    this.audit.updatedAt = new Date();
    this.audit.createdBy = 'system';
    this.audit.updatedBy = 'system';
    this.audit.version = 1;
    this.audit.isActive = true;
    this.audit.changeLog = [];
  }
  if (this.isModified() && !this.isNew) {
    this.audit.updatedAt = new Date();
    this.audit.version += 1;
    this.audit.addChange('UPDATE', this.audit.updatedBy, { items: 'modified' });
  }
  next();
});

CarritoSchema.methods.agregarProducto = function(productoId, cantidad) {
  const itemIndex = this.items.findIndex(
    (item) => item.producto.toString() === productoId.toString()
  );
  
  if (itemIndex > -1) {
    this.items[itemIndex].quantity += cantidad;
  } else {
    this.items.push({ producto: productoId, quantity: cantidad });
  }
  
  return this.save();
};

CarritoSchema.methods.eliminarProducto = function(productoId) {
  this.items = this.items.filter(
    (item) => item.producto.toString() !== productoId.toString()
  );
  return this.save();
};

CarritoSchema.methods.actualizarCantidad = function(productoId, cantidad) {
  const itemIndex = this.items.findIndex(
    (item) => item.producto.toString() === productoId.toString()
  );
  
  if (itemIndex > -1) {
    if (cantidad <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = cantidad;
    }
  }
  
  return this.save();
};

CarritoSchema.methods.vaciar = function() {
  this.items = [];
  this.audit.addChange('UPDATE', this.audit.updatedBy, { items: 'cleared' });
  return this.save();
};

CarritoSchema.methods.getTotal = function() {
  return this.items.reduce(async (accPromise, item) => {
    const acc = await accPromise;
    const producto = await mongoose.model('Producto').findById(item.producto);
    return acc + (producto ? producto.precio * item.quantity : 0);
  }, Promise.resolve(0));
};

CarritoSchema.statics.findByUsuario = function(usuarioId) {
  return this.findOne({ usuario: usuarioId, 'audit.isActive': true }).populate('items.producto');
};

CarritoSchema.statics.findBySession = function(sessionId) {
  return this.findOne({ sessionId, 'audit.isActive': true }).populate('items.producto');
};

CarritoSchema.statics.findOrCreate = async function(usuarioId, sessionId) {
  let carrito;
  if (usuarioId) {
    carrito = await this.findByUsuario(usuarioId);
  } else if (sessionId) {
    carrito = await this.findBySession(sessionId);
  }
  
  if (!carrito) {
    carrito = new this({ usuario: usuarioId, sessionId, items: [] });
    await carrito.save();
  }
  
  return carrito;
};

CarritoSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Carrito = mongoose.model('Carrito', CarritoSchema);

export default Carrito;
