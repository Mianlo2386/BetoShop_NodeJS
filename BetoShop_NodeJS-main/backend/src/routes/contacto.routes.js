import { Router } from 'express';
import nodemailer from 'nodemailer';
import Contacto from '../schemas/contacto.schema.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

const router = Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { nombre, email, asunto, mensaje } = req.body;

    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    const contacto = new Contacto({
      nombre,
      email,
      asunto,
      mensaje
    });

    await contacto.save();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: process.env.SMTP_USER,
      subject: `[BetoShop] Nuevo mensaje: ${asunto}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${asunto}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${mensaje}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado correctamente',
      data: contacto
    });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const contactos = await Contacto.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: contactos
    });
  })
);

router.patch(
  '/:id/leido',
  asyncHandler(async (req, res) => {
    const contacto = await Contacto.findByIdAndUpdate(
      req.params.id,
      { leido: true },
      { new: true }
    );

    res.json({
      success: true,
      data: contacto
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await Contacto.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Mensaje eliminado'
    });
  })
);

export default router;
