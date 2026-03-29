import mongoose from 'mongoose';

const ContactoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  asunto: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  leido: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Contacto = mongoose.model('Contacto', ContactoSchema);

export default Contacto;
