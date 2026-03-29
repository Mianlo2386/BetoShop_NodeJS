import { Router } from 'express';
import emailService from '../services/email.service.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.middleware.js';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    console.log('📩 Contact form received:', req.body);
    
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      throw new ValidationError('Todos los campos son requeridos');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('El formato del email es inválido');
    }

    console.log('📧 Enviando email al admin...');
    await emailService.sendContactEmail({ name, email, subject, message });
    console.log('📧 Enviando email de confirmación al usuario...');
    await emailService.sendConfirmationEmail(email, name);

    res.json({
      success: true,
      message: 'Mensaje enviado correctamente',
    });
  })
);

export default router;
