import { Router } from 'express';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.middleware.js';
import { requireAdmin, verifyJWT } from '../middleware/auth.middleware.js';
import * as contactoService from '../services/contacto.service.js';
import emailService from '../services/email.service.js';

const router = Router();

// POST / — enviar mensaje de contacto (público)
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { nombre, email, telefono, asunto, mensaje } = req.body;
    const name = nombre || req.body.name;
    const message = mensaje || req.body.message;
    const subject = asunto || req.body.subject;

    if (!name || !email || !subject || !message) {
      throw new ValidationError('Nombre, email, asunto y mensaje son requeridos');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('El formato del email es inválido');
    }

    await contactoService.crear({
      nombre: name,
      email,
      telefono: telefono || null,
      asunto: subject,
      mensaje: message,
    });

    // Email al admin con los datos del contacto
    try {
      await emailService.sendContactEmail({ name, email, subject, message, telefono });
    } catch (e) {
      console.error('⚠️ No se pudo enviar email al admin:', e.message);
    }

    // Email de confirmación al visitante
    try {
      await emailService.sendConfirmationEmail(email, name);
    } catch (e) {
      console.error('⚠️ No se pudo enviar email de confirmación:', e.message);
    }

    res.json({
      success: true,
      message: 'Hemos recibido tu mensaje. Nos contactaremos a la brevedad.',
    });
  })
);

// GET / — listar contactos (solo admin)
router.get(
  '/',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, noLeidos } = req.query;
    const resultado = await contactoService.obtenerTodos({
      page: parseInt(page),
      limit: parseInt(limit),
      soloNoLeidos: noLeidos === 'true',
    });
    res.json({ success: true, ...resultado });
  })
);

// PATCH /:id/leido — marcar como leído (solo admin)
router.patch(
  '/:id/leido',
  verifyJWT,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await contactoService.marcarLeido(req.params.id);
    res.json({ success: true, message: 'Contacto marcado como leído' });
  })
);

export default router;
