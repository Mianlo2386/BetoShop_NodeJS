import { Router } from 'express';
import Contacto from '../schemas/contacto.schema.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.middleware.js';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    console.log('📩 Contact form received:', req.body);
    
    const { nombre, email, subject, mensaje } = req.body;

    const name = nombre || req.body.name;
    const message = mensaje || req.body.message;

    if (!name || !email || !subject || !message) {
      throw new ValidationError('Todos los campos son requeridos');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('El formato del email es inválido');
    }

    await Contacto.create({
      nombre: name,
      email: email,
      asunto: subject,
      mensaje: message
    });

    console.log('✅ Mensaje guardado en MongoDB');

    res.json({
      success: true,
      message: 'Hemos recibido tu mensaje. Nos contactaremos a la brevedad.',
    });
  })
);

export default router;